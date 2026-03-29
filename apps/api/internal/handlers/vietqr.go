package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var (
	vietqrTemplates = map[string]struct{}{
		"compact":  {},
		"compact2": {},
		"qr_only":  {},
		"print":    {},
	}
	vietqrTemplateCustomAllowed = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)
	vietqrAccountNameAllowed    = regexp.MustCompile(`[^\\p{L}\\p{N} ]+`)
)

func normalizeVietQRTemplate(input string) string {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return "compact2"
	}
	normalized := strings.ToLower(trimmed)
	if _, ok := vietqrTemplates[normalized]; ok {
		return normalized
	}
	if vietqrTemplateCustomAllowed.MatchString(trimmed) {
		return trimmed
	}
	return "compact2"
}

func normalizeBankID(input string) string {
	return strings.TrimSpace(strings.ToLower(input))
}

func normalizeAccountNo(input string) string {
	return strings.ReplaceAll(strings.TrimSpace(input), " ", "")
}

func normalizeVietQRAccountName(input string) string {
	cleaned := strings.TrimSpace(input)
	if cleaned == "" {
		return ""
	}
	cleaned = strings.ToUpper(vietqrAccountNameAllowed.ReplaceAllString(cleaned, " "))
	cleaned = strings.Join(strings.Fields(cleaned), " ")
	return cleaned
}

func buildTransferContent(orderNumber string) string {
	content := strings.TrimSpace(orderNumber)
	if content == "" {
		return ""
	}
	if len(content) <= 25 {
		return content
	}
	return content[:25]
}

func normalizeVietQRImageURL(parsed *url.URL) {
	if parsed == nil {
		return
	}
	host := strings.ToLower(parsed.Hostname())
	if host != "api.vietqr.io" {
		return
	}

	port := parsed.Port()
	if port != "" {
		parsed.Host = net.JoinHostPort("img.vietqr.io", port)
		return
	}
	parsed.Host = "img.vietqr.io"
}

func buildQuickLink(baseURL, bankID, accountNo, template, ext string, amount int64, addInfo, accountName string) (string, error) {
	if bankID == "" || accountNo == "" {
		return "", errors.New("missing bank configuration")
	}
	if amount <= 0 {
		return "", errors.New("invalid amount")
	}
	parsedBase, err := url.Parse(strings.TrimSpace(baseURL))
	if err != nil || parsedBase.Scheme == "" || parsedBase.Host == "" {
		return "", errors.New("invalid VietQR image base URL")
	}
	normalizeVietQRImageURL(parsedBase)
	imageBase := strings.TrimRight(parsedBase.String(), "/")
	if !strings.HasSuffix(strings.ToLower(parsedBase.Path), "/image") {
		imageBase = imageBase + "/image"
	}
	cleanExt := strings.TrimPrefix(strings.TrimSpace(ext), ".")
	if cleanExt == "" {
		cleanExt = "png"
	}
	base := fmt.Sprintf("%s/%s-%s-%s.%s", imageBase, bankID, accountNo, template, cleanExt)
	params := url.Values{}
	params.Set("amount", strconv.FormatInt(amount, 10))
	if addInfo != "" {
		params.Set("addInfo", addInfo)
	}
	if accountName != "" {
		params.Set("accountName", accountName)
	}
	return base + "?" + params.Encode(), nil
}

type vietqrBank struct {
	Code      string `json:"code"`
	ShortName string `json:"shortName"`
	Name      string `json:"name"`
	Bin       string `json:"bin"`
}

type vietqrBanksResponse struct {
	Code string       `json:"code"`
	Desc string       `json:"desc"`
	Data []vietqrBank `json:"data"`
}

type vietqrGenerateRequest struct {
	AccountNo   string `json:"accountNo"`
	AccountName string `json:"accountName"`
	AcqID       int    `json:"acqId"`
	Amount      int64  `json:"amount"`
	AddInfo     string `json:"addInfo"`
	Template    string `json:"template"`
}

type vietqrGenerateResponse struct {
	Code string `json:"code"`
	Desc string `json:"desc"`
	Data struct {
		QRCode    string `json:"qrCode"`
		QRDataURL string `json:"qrDataURL"`
	} `json:"data"`
}

func mapVietQRBanks(banks []vietqrBank) map[string]int {
	result := make(map[string]int)
	for _, bank := range banks {
		bin, err := strconv.Atoi(strings.TrimSpace(bank.Bin))
		if err != nil || bin == 0 {
			continue
		}
		if bank.Code != "" {
			result[strings.ToLower(strings.TrimSpace(bank.Code))] = bin
		}
		if bank.ShortName != "" {
			result[strings.ToLower(strings.TrimSpace(bank.ShortName))] = bin
		}
		if bank.Name != "" {
			result[strings.ToLower(strings.TrimSpace(bank.Name))] = bin
		}
	}
	return result
}

func (s *Server) getVietQRBankBIN(bankID string) (int, error) {
	key := strings.ToLower(strings.TrimSpace(bankID))
	if key == "" {
		return 0, errors.New("missing bank id")
	}

	s.vietqrBanksMu.Lock()
	if time.Now().Before(s.vietqrBanksExpiresAt) {
		if bin, ok := s.vietqrBanksCache[key]; ok {
			s.vietqrBanksMu.Unlock()
			return bin, nil
		}
	}
	s.vietqrBanksMu.Unlock()

	client := &http.Client{Timeout: 10 * time.Second}
	url := strings.TrimRight(s.Config.VietQRBaseURL, "/") + "/v2/banks"
	resp, err := client.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return 0, fmt.Errorf("vietqr banks status %d", resp.StatusCode)
	}

	var payload vietqrBanksResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return 0, err
	}
	bankMap := mapVietQRBanks(payload.Data)

	s.vietqrBanksMu.Lock()
	s.vietqrBanksCache = bankMap
	s.vietqrBanksExpiresAt = time.Now().Add(24 * time.Hour)
	bin, ok := bankMap[key]
	s.vietqrBanksMu.Unlock()

	if !ok {
		return 0, fmt.Errorf("bank id not found: %s", bankID)
	}
	return bin, nil
}

func (s *Server) generateVietQR(accountNo, accountName string, acqID int, amount int64, addInfo, template string) (string, string, error) {
	if s.Config.VietQRClientID == "" || s.Config.VietQRAPIKey == "" {
		return "", "", errors.New("vietqr credentials missing")
	}
	reqBody := vietqrGenerateRequest{
		AccountNo:   accountNo,
		AccountName: normalizeVietQRAccountName(accountName),
		AcqID:       acqID,
		Amount:      amount,
		AddInfo:     addInfo,
		Template:    template,
	}
	raw, err := json.Marshal(reqBody)
	if err != nil {
		return "", "", err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	endpoint := strings.TrimRight(s.Config.VietQRBaseURL, "/") + "/v2/generate"
	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(raw))
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-client-id", s.Config.VietQRClientID)
	req.Header.Set("x-api-key", s.Config.VietQRAPIKey)

	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", fmt.Errorf("vietqr generate status %d", resp.StatusCode)
	}

	var payload vietqrGenerateResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", "", err
	}
	if payload.Data.QRDataURL == "" {
		return "", "", errors.New("vietqr generate returned empty qrDataURL")
	}
	return payload.Data.QRCode, payload.Data.QRDataURL, nil
}
