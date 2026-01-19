package handlers

import (
	"database/sql"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type paymentQRResponse struct {
	OrderID         int    `json:"orderId"`
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

	bankID := normalizeBankID(settings.BankID)
	accountNo := normalizeAccountNo(settings.BankAccount)
	accountName := strings.TrimSpace(settings.BankHolder)
	bankName := strings.TrimSpace(settings.BankName)
	if bankID == "" || accountNo == "" || accountName == "" {
		respondError(c, http.StatusBadRequest, "payment_not_configured", "Bank transfer is not configured")
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

	template := normalizeVietQRTemplate(settings.BankQRTemplate)

	response := paymentQRResponse{
		OrderID:         orderID,
		Amount:          amount,
		Currency:        "VND",
		TransferContent: content,
		PaymentStatus:   normalizePaymentStatus(paymentStatus.String),
	}
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
