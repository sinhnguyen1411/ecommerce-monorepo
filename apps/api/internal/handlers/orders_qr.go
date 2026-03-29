package handlers

import (
	"database/sql"
	"errors"
	"math"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type paymentQRResponse struct {
	OrderID         int    `json:"orderId"`
	OrderNumber     string `json:"orderNumber"`
	Amount          int64  `json:"amount"`
	Currency        string `json:"currency"`
	TransferContent string `json:"transferContent"`
	Bank            struct {
		BankID      string `json:"bankId"`
		Bin         string `json:"bin"`
		AccountNo   string `json:"accountNo"`
		AccountName string `json:"accountName"`
		BankName    string `json:"bankName"`
	} `json:"bank"`
	VietQR struct {
		Method     string `json:"method"`
		Template   string `json:"template"`
		QRImageURL string `json:"qrImageUrl,omitempty"`
		QRDataURL  string `json:"qrDataURL,omitempty"`
		QRCode     string `json:"qrCode,omitempty"`
	} `json:"vietqr"`
	PaymentStatus string `json:"paymentStatus"`
}

func (s *Server) GetOrderPaymentQR(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_order", "Invalid order ID")
		return
	}
	if !s.enforceOrderAccess(c, orderID) {
		return
	}

	var (
		total           float64
		orderNumber     string
		paymentMethod   string
		paymentStatus   sql.NullString
		transferContent sql.NullString
		qrMethod        sql.NullString
		qrTemplate      sql.NullString
		qrValue         sql.NullString
	)
	row := s.DB.QueryRow(`SELECT total, order_number, payment_method, IFNULL(payment_status, ''), IFNULL(transfer_content, ''), IFNULL(qr_method, ''), IFNULL(qr_template, ''), IFNULL(qr_value, '')
    FROM orders WHERE id = ?`, orderID)
	if err := row.Scan(&total, &orderNumber, &paymentMethod, &paymentStatus, &transferContent, &qrMethod, &qrTemplate, &qrValue); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "Order not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order")
		return
	}

	if paymentMethod != "bank_transfer" && paymentMethod != "bank_qr" {
		respondError(c, http.StatusBadRequest, "payment_method", "Order is not eligible for bank transfer QR")
		return
	}

	amount := int64(math.Round(total))
	if amount <= 0 {
		respondError(c, http.StatusBadRequest, "invalid_amount", "Invalid order amount")
		return
	}

	settings, err := s.loadPaymentSettings()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load payment settings")
		return
	}

	content := strings.TrimSpace(transferContent.String)
	if content == "" || len(content) > 25 {
		content = buildTransferContent(orderNumber)
		if _, err := s.DB.Exec(`UPDATE orders SET transfer_content = ? WHERE id = ?`, content, orderID); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to update transfer content")
			return
		}
	}

	response := paymentQRResponse{
		OrderID:         orderID,
		OrderNumber:     orderNumber,
		Amount:          amount,
		Currency:        "VND",
		TransferContent: content,
		PaymentStatus:   normalizePaymentStatus(paymentStatus.String),
	}

	quickLinkPreset := strings.TrimSpace(settings.BankQRPayload)
	if quickLinkPreset != "" {
		link, parsed, err := buildQuickLinkFromPreset(quickLinkPreset, amount, content, strings.TrimSpace(settings.BankHolder))
		if err == nil {
			template := parsed.Template
			if template == "" {
				template = "custom"
			}
			if qrValue.String != link || qrMethod.String != "quicklink" || qrTemplate.String != template {
				if _, err := s.DB.Exec(`UPDATE orders SET qr_method = ?, qr_template = ?, qr_value = ?, qr_created_at = ? WHERE id = ?`,
					"quicklink", template, link, time.Now(), orderID); err != nil {
					respondError(c, http.StatusInternalServerError, "db_error", "Failed to save QR")
					return
				}
			}

			response.Bank.BankID = parsed.BankID
			response.Bank.Bin = parsed.Bin
			response.Bank.AccountNo = parsed.AccountNo
			response.Bank.AccountName = parsed.AccountName
			response.Bank.BankName = strings.TrimSpace(settings.BankName)
			if response.Bank.AccountName == "" {
				response.Bank.AccountName = strings.TrimSpace(settings.BankHolder)
			}
			response.VietQR.Method = "quicklink"
			response.VietQR.Template = template
			response.VietQR.QRImageURL = link
			respondOK(c, response)
			return
		}
	}

	bankID := normalizeBankID(settings.BankID)
	accountNo := normalizeAccountNo(settings.BankAccount)
	accountName := strings.TrimSpace(settings.BankHolder)
	bankName := strings.TrimSpace(settings.BankName)
	if bankID == "" || accountNo == "" || accountName == "" {
		respondError(c, http.StatusBadRequest, "payment_not_configured", "Bank transfer is not configured")
		return
	}

	template := normalizeVietQRTemplate(settings.BankQRTemplate)
	response.Bank.BankID = bankID
	response.Bank.AccountNo = accountNo
	response.Bank.AccountName = accountName
	response.Bank.BankName = bankName

	quickLink, err := buildQuickLink(s.Config.VietQRImageBaseURL, bankID, accountNo, template, s.Config.VietQRImageExt, amount, content, accountName)
	if err == nil {
		if qrValue.String != quickLink || qrMethod.String != "quicklink" || qrTemplate.String != template {
			if _, err := s.DB.Exec(`UPDATE orders SET qr_method = ?, qr_template = ?, qr_value = ?, qr_created_at = ? WHERE id = ?`,
				"quicklink", template, quickLink, time.Now(), orderID); err != nil {
				respondError(c, http.StatusInternalServerError, "db_error", "Failed to save QR")
				return
			}
		}
		response.Bank.Bin = ""
		response.VietQR.Method = "quicklink"
		response.VietQR.Template = template
		response.VietQR.QRImageURL = quickLink
		respondOK(c, response)
		return
	}

	useGenerate := s.Config.VietQRClientID != "" && s.Config.VietQRAPIKey != "" && s.Config.VietQRBaseURL != ""
	if !useGenerate {
		respondError(c, http.StatusBadRequest, "qr_error", "Failed to build VietQR link")
		return
	}

	bin, err := s.getVietQRBankBIN(bankID)
	if err != nil {
		respondError(c, http.StatusBadRequest, "bank_not_supported", "Bank is not supported by VietQR")
		return
	}
	response.Bank.Bin = strconv.Itoa(bin)

	if qrMethod.String == "generate" && qrTemplate.String == template && strings.TrimSpace(qrValue.String) != "" {
		response.VietQR.Method = "generate"
		response.VietQR.Template = template
		response.VietQR.QRDataURL = qrValue.String
		respondOK(c, response)
		return
	}

	qrCode, qrDataURL, err := s.generateVietQR(accountNo, accountName, bin, amount, content, template)
	if err != nil {
		respondError(c, http.StatusBadRequest, "qr_error", "Failed to generate VietQR")
		return
	}

	if _, err := s.DB.Exec(`UPDATE orders SET qr_method = ?, qr_template = ?, qr_value = ?, qr_created_at = ? WHERE id = ?`,
		"generate", template, qrDataURL, time.Now(), orderID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to save QR")
		return
	}

	response.VietQR.Method = "generate"
	response.VietQR.Template = template
	response.VietQR.QRDataURL = qrDataURL
	response.VietQR.QRCode = qrCode

	respondOK(c, response)
}

func normalizePaymentStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "paid":
		return "PAID"
	case "expired":
		return "EXPIRED"
	default:
		return "PENDING"
	}
}

type quickLinkPresetInfo struct {
	BankID      string
	Bin         string
	AccountNo   string
	AccountName string
	Template    string
}

func buildQuickLinkFromPreset(preset string, amount int64, content string, fallbackAccountName string) (string, quickLinkPresetInfo, error) {
	var info quickLinkPresetInfo
	trimmed := strings.TrimSpace(preset)
	if trimmed == "" {
		return "", info, errors.New("empty quick link")
	}

	parsedURL, err := url.Parse(trimmed)
	if err != nil || parsedURL.Scheme == "" || parsedURL.Host == "" {
		return "", info, errors.New("invalid quick link")
	}
	normalizeVietQRImageURL(parsedURL)

	query := parsedURL.Query()
	if fallbackAccountName != "" && strings.TrimSpace(query.Get("accountName")) == "" {
		query.Set("accountName", fallbackAccountName)
	}
	query.Set("amount", strconv.FormatInt(amount, 10))
	query.Set("addInfo", content)
	parsedURL.RawQuery = query.Encode()

	fileName := strings.TrimSuffix(path.Base(parsedURL.Path), path.Ext(parsedURL.Path))
	parts := strings.Split(fileName, "-")
	if len(parts) >= 2 {
		info.BankID = parts[0]
		info.AccountNo = parts[1]
	}
	if len(parts) >= 3 {
		info.Template = parts[2]
	}
	if info.BankID != "" && len(info.BankID) == 6 && isAllDigits(info.BankID) {
		info.Bin = info.BankID
	}
	info.AccountName = query.Get("accountName")

	return parsedURL.String(), info, nil
}

func isAllDigits(value string) bool {
	for _, r := range value {
		if r < '0' || r > '9' {
			return false
		}
	}
	return value != ""
}
