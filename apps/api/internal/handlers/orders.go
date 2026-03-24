package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"ecommerce-monorepo/apps/api/internal/auth"
)

type OrderItemInput struct {
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}

type OrderRequest struct {
	CustomerName   string           `json:"customer_name"`
	Email          string           `json:"email"`
	Phone          string           `json:"phone"`
	Address        string           `json:"address"`
	AddressLine    string           `json:"address_line"`
	District       string           `json:"district"`
	Province       string           `json:"province"`
	Note           string           `json:"note"`
	DeliveryTime   string           `json:"delivery_time"`
	ShippingMethod string           `json:"shipping_method"`
	PaymentMethod  string           `json:"payment_method"`
	PromoCode      string           `json:"promo_code"`
	Items          []OrderItemInput `json:"items"`
}

type OrderResponse struct {
	ID                 int     `json:"id"`
	OrderRef           string  `json:"order_ref"`
	OrderNumber        string  `json:"order_number"`
	OrderLookupToken   string  `json:"order_lookup_token"`
	OrderAccessToken   string  `json:"order_access_token"`
	OrderAccessExpires string  `json:"order_access_expires_at"`
	Subtotal           float64 `json:"subtotal"`
	ShippingFee        float64 `json:"shipping_fee"`
	DiscountTotal      float64 `json:"discount_total"`
	Total              float64 `json:"total"`
	PaymentMethod      string  `json:"payment_method"`
	Status             string  `json:"status"`
}

type OrderSummaryResponse struct {
	ID              int     `json:"id"`
	OrderNumber     string  `json:"order_number"`
	Total           float64 `json:"total"`
	PaymentMethod   string  `json:"payment_method"`
	PaymentStatus   string  `json:"payment_status"`
	Status          string  `json:"status"`
	PaymentProofURL string  `json:"payment_proof_url"`
}

type OrderPaymentMethodRequest struct {
	PaymentMethod string `json:"payment_method"`
}

func (s *Server) CreateOrder(c *gin.Context) {
	var input OrderRequest
	if !s.bindJSONWithLimit(c, &input, "Invalid order payload") {
		return
	}

	ipKey := rateLimitKey("order:create:ip", c.ClientIP())
	if !s.enforceRateLimit(c, ipKey, s.Config.OrderRateLimitMax, s.Config.OrderRateLimitWindow, "order_rate_limited", "Too many order requests") {
		return
	}

	name := strings.TrimSpace(input.CustomerName)
	emailRaw := strings.TrimSpace(input.Email)
	phoneRaw := strings.TrimSpace(input.Phone)
	address := strings.TrimSpace(input.Address)
	addressLine := strings.TrimSpace(input.AddressLine)
	provinceInput := strings.TrimSpace(input.Province)
	districtInput := strings.TrimSpace(input.District)
	if name == "" || emailRaw == "" || phoneRaw == "" || (address == "" && addressLine == "") {
		respondError(c, http.StatusBadRequest, "missing_fields", "Customer name, email, phone, and address are required")
		return
	}

	email, err := auth.NormalizeEmail(emailRaw)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_email", "Invalid email address")
		return
	}

	_, nationalPhone, err := auth.NormalizeVNPhone(phoneRaw)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_phone", "Invalid phone number")
		return
	}

	var provinceName string
	var districtName string
	if provinceInput != "" || districtInput != "" || addressLine != "" {
		if addressLine == "" || provinceInput == "" || districtInput == "" {
			respondError(c, http.StatusBadRequest, "missing_fields", "Address line, province, and district are required")
			return
		}
		provinceName, districtName, err = s.resolveProvinceDistrict(provinceInput, districtInput)
		if err != nil {
			respondError(c, http.StatusBadRequest, "invalid_location", "Invalid province or district")
			return
		}
		addressParts := []string{addressLine, districtName, provinceName}
		address = strings.Join(addressParts, ", ")
	}

	if len(input.Items) == 0 {
		respondError(c, http.StatusBadRequest, "empty_cart", "Add at least one item before checkout")
		return
	}

	if strings.TrimSpace(input.PaymentMethod) == "" {
		input.PaymentMethod = "cod"
	}

	settings, err := s.loadPaymentSettings()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load payment settings")
		return
	}
	if !isPaymentMethodEnabled(input.PaymentMethod, settings) {
		respondError(c, http.StatusBadRequest, "payment_disabled", "Selected payment method is not available")
		return
	}

	shippingMethod := strings.TrimSpace(input.ShippingMethod)
	if shippingMethod == "" {
		shippingMethod = "standard"
	}
	if shippingMethod != "standard" && shippingMethod != "express" {
		respondError(c, http.StatusBadRequest, "invalid_shipping", "Shipping method is invalid")
		return
	}

	productIDs := make([]string, 0, len(input.Items))
	quantities := make(map[int]int)
	for _, item := range input.Items {
		if item.Quantity <= 0 {
			respondError(c, http.StatusBadRequest, "invalid_quantity", "Item quantity must be greater than zero")
			return
		}
		productIDs = append(productIDs, strconv.Itoa(item.ProductID))
		quantities[item.ProductID] = item.Quantity
	}

	query := "SELECT id, name, price FROM products WHERE status = 'published' AND id IN (" + strings.Join(productIDs, ",") + ")"
	rows, err := s.DB.Query(query)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate products")
		return
	}
	defer rows.Close()

	type productRow struct {
		ID    int
		Name  string
		Price float64
	}

	products := make([]productRow, 0)
	for rows.Next() {
		var row productRow
		if err := rows.Scan(&row.ID, &row.Name, &row.Price); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to load product pricing")
			return
		}
		products = append(products, row)
	}

	if len(products) == 0 {
		respondError(c, http.StatusBadRequest, "invalid_items", "Products not found")
		return
	}

	if len(products) != len(quantities) {
		respondError(c, http.StatusBadRequest, "invalid_items", "One or more products are unavailable")
		return
	}

	subtotal := 0.0
	for _, product := range products {
		qty := quantities[product.ID]
		subtotal += product.Price * float64(qty)
	}

	if s.Config.MinOrderAmount > 0 && subtotal < s.Config.MinOrderAmount {
		respondError(c, http.StatusBadRequest, "min_order", fmt.Sprintf("Minimum order is %.0f", s.Config.MinOrderAmount))
		return
	}

	shippingFee := s.Config.StandardShippingFee
	if shippingMethod == "express" {
		shippingFee = s.Config.ExpressShippingFee
	}
	if shippingMethod == "standard" && s.Config.FreeShippingThreshold > 0 && subtotal >= s.Config.FreeShippingThreshold {
		shippingFee = 0
	}

	tx, err := s.DB.Begin()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to start checkout")
		return
	}
	defer tx.Rollback()

	discountTotal := 0.0
	promoCode := ""
	if strings.TrimSpace(input.PromoCode) != "" {
		discountTotal, promoCode, err = s.validateCoupon(tx, input.PromoCode, subtotal, true)
		if err != nil {
			if perr, ok := err.(promoError); ok {
				respondError(c, http.StatusBadRequest, perr.code, perr.message)
				return
			}
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate promotion")
			return
		}
		if _, err := tx.Exec(`UPDATE coupons SET used_count = used_count + 1 WHERE code = ?`, promoCode); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to apply promotion")
			return
		}
	}

	total := subtotal + shippingFee - discountTotal

	var userID any = nil
	if claims := s.optionalUser(c); claims != nil {
		userID = claims.UserID
	}

	orderNumber, err := generateOrderNumber(tx)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to generate order number")
		return
	}
	orderLookupToken, orderLookupTokenHash, err := generateOrderLookupToken()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to allocate order token")
		return
	}
	orderLookupIssuedAt := time.Now()
	var addressLineDB any = nil
	var districtDB any = nil
	var provinceDB any = nil
	if addressLine != "" {
		addressLineDB = addressLine
	}
	if districtName != "" {
		districtDB = districtName
	}
	if provinceName != "" {
		provinceDB = provinceName
	}
	result, err := tx.Exec(`
    INSERT INTO orders (
      order_number,
      order_lookup_token_hash,
      order_lookup_token_issued_at,
      user_id,
      customer_name,
      email,
      phone,
      address,
      address_line,
      district,
      province,
      note,
      delivery_time,
      promo_code,
      shipping_method,
      subtotal,
      shipping_fee,
      discount_total,
      total,
      payment_method,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `, orderNumber, orderLookupTokenHash, orderLookupIssuedAt, userID, name, email, nationalPhone, address, addressLineDB, districtDB, provinceDB, input.Note, input.DeliveryTime, promoCode, shippingMethod, subtotal, shippingFee, discountTotal, total, input.PaymentMethod)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create order")
		return
	}

	orderID64, err := result.LastInsertId()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to confirm order")
		return
	}
	orderID := int(orderID64)

	if input.PaymentMethod == "bank_transfer" || input.PaymentMethod == "bank_qr" {
		transferContent := buildTransferContent(orderNumber)
		if _, err := tx.Exec(`UPDATE orders SET transfer_content = ? WHERE id = ?`, transferContent, orderID); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to save transfer content")
			return
		}
	}

	for _, product := range products {
		qty := quantities[product.ID]
		lineTotal := product.Price * float64(qty)
		if _, err := tx.Exec(`
      INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
      VALUES (?, ?, ?, ?, ?, ?)
    `, orderID, product.ID, product.Name, product.Price, qty, lineTotal); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to add order items")
			return
		}
	}

	if err := tx.Commit(); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to finalize order")
		return
	}

	orderAccess, err := s.issueOrderAccessToken(orderID, orderNumber, orderLookupTokenHash)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue order access token")
		return
	}

	respondOK(c, OrderResponse{
		ID:                 orderID,
		OrderRef:           orderNumber,
		OrderNumber:        orderNumber,
		OrderLookupToken:   orderLookupToken,
		OrderAccessToken:   orderAccess.OrderAccessToken,
		OrderAccessExpires: orderAccess.OrderAccessExpiresAt,
		Subtotal:           subtotal,
		ShippingFee:        shippingFee,
		DiscountTotal:      discountTotal,
		Total:              total,
		PaymentMethod:      input.PaymentMethod,
		Status:             "pending",
	})
}

func generateOrderNumber(tx *sql.Tx) (string, error) {
	now := time.Now()
	datePart := now.Format("020106")
	prefix := "TB" + datePart + "N"

	var lastNumber sql.NullString
	row := tx.QueryRow(`
    SELECT order_number
    FROM orders
    WHERE order_number LIKE ?
    ORDER BY order_number DESC
    LIMIT 1
    FOR UPDATE
  `, prefix+"%")
	if err := row.Scan(&lastNumber); err != nil && err != sql.ErrNoRows {
		return "", err
	}

	seq := 1
	if lastNumber.Valid && strings.HasPrefix(lastNumber.String, prefix) {
		suffix := strings.TrimPrefix(lastNumber.String, prefix)
		if n, err := strconv.Atoi(suffix); err == nil {
			seq = n + 1
		}
	}
	if seq > 9999 {
		return "", fmt.Errorf("order sequence overflow for %s", prefix)
	}

	return fmt.Sprintf("%s%04d", prefix, seq), nil
}

func (s *Server) UploadPaymentProof(c *gin.Context) {
	ipKey := rateLimitKey("payment-proof:ip", c.ClientIP())
	if !s.enforceRateLimit(c, ipKey, s.Config.PaymentProofRateLimitMax, s.Config.PaymentProofRateLimitWindow, "payment_proof_rate_limited", "Too many upload attempts") {
		return
	}

	idParam := c.Param("id")
	orderID, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_order", "Invalid order ID")
		return
	}
	if !s.enforceOrderAccess(c, orderID) {
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "missing_file", "Payment proof file is required")
		return
	}
	url, ok := s.saveValidatedImageUpload(c, file, fmt.Sprintf("order_%d", orderID))
	if !ok {
		return
	}
	if _, err := s.DB.Exec("UPDATE orders SET payment_proof_url = ?, payment_status = 'proof_submitted' WHERE id = ?", url, orderID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update payment proof")
		return
	}

	respondOK(c, gin.H{"payment_proof_url": s.buildAssetURL(url)})
}

func (s *Server) GetOrderSummary(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_order", "Invalid order ID")
		return
	}
	if !s.enforceOrderAccess(c, orderID) {
		return
	}

	var (
		id              int
		orderNumber     string
		total           float64
		paymentMethod   string
		paymentStatus   string
		status          string
		paymentProofURL string
	)
	row := s.DB.QueryRow(`SELECT id, order_number, total, payment_method, IFNULL(payment_status, ''), status, IFNULL(payment_proof_url, '') FROM orders WHERE id = ?`, orderID)
	if err := row.Scan(&id, &orderNumber, &total, &paymentMethod, &paymentStatus, &status, &paymentProofURL); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "Order not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order")
		return
	}

	respondOK(c, OrderSummaryResponse{
		ID:              id,
		OrderNumber:     orderNumber,
		Total:           total,
		PaymentMethod:   strings.TrimSpace(paymentMethod),
		PaymentStatus:   normalizePaymentStatus(paymentStatus),
		Status:          strings.TrimSpace(status),
		PaymentProofURL: s.buildAssetURL(paymentProofURL),
	})
}

func (s *Server) UpdateOrderPaymentMethod(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_order", "Invalid order ID")
		return
	}
	if !s.enforceOrderAccess(c, orderID) {
		return
	}

	var input OrderPaymentMethodRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid payment method payload")
		return
	}

	method := strings.TrimSpace(input.PaymentMethod)
	if method == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Payment method is required")
		return
	}

	settings, err := s.loadPaymentSettings()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load payment settings")
		return
	}
	if !isPaymentMethodEnabled(method, settings) {
		respondError(c, http.StatusBadRequest, "payment_disabled", "Selected payment method is not available")
		return
	}

	var (
		orderNumber     string
		status          string
		paymentStatus   sql.NullString
		transferContent sql.NullString
	)
	row := s.DB.QueryRow(`SELECT order_number, status, IFNULL(payment_status, ''), IFNULL(transfer_content, '') FROM orders WHERE id = ?`, orderID)
	if err := row.Scan(&orderNumber, &status, &paymentStatus, &transferContent); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "Order not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order")
		return
	}

	if normalizePaymentStatus(paymentStatus.String) == "PAID" {
		respondError(c, http.StatusBadRequest, "payment_locked", "Order payment is already completed")
		return
	}

	if strings.TrimSpace(status) != "pending" {
		respondError(c, http.StatusBadRequest, "order_locked", "Order can no longer change payment method")
		return
	}

	if method == "cod" {
		if _, err := s.DB.Exec(`UPDATE orders SET payment_method = ?, transfer_content = NULL, qr_method = NULL, qr_template = NULL, qr_value = NULL, qr_created_at = NULL WHERE id = ?`, method, orderID); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to update payment method")
			return
		}
		respondOK(c, gin.H{"order_id": orderID, "payment_method": method})
		return
	}

	content := strings.TrimSpace(transferContent.String)
	if content == "" || len(content) > 25 {
		content = buildTransferContent(orderNumber)
	}
	if _, err := s.DB.Exec(`UPDATE orders SET payment_method = ?, transfer_content = ? WHERE id = ?`, method, content, orderID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update payment method")
		return
	}

	respondOK(c, gin.H{"order_id": orderID, "payment_method": method, "transfer_content": content})
}
