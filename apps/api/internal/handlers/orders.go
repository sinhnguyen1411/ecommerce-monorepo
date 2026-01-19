package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
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
	Note           string           `json:"note"`
	DeliveryTime   string           `json:"delivery_time"`
	ShippingMethod string           `json:"shipping_method"`
	PaymentMethod  string           `json:"payment_method"`
	PromoCode      string           `json:"promo_code"`
	Items          []OrderItemInput `json:"items"`
}

type OrderResponse struct {
	ID            int     `json:"id"`
	OrderNumber   string  `json:"order_number"`
	Subtotal      float64 `json:"subtotal"`
	ShippingFee   float64 `json:"shipping_fee"`
	DiscountTotal float64 `json:"discount_total"`
	Total         float64 `json:"total"`
	PaymentMethod string  `json:"payment_method"`
	Status        string  `json:"status"`
}

func (s *Server) CreateOrder(c *gin.Context) {
	var input OrderRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid order payload")
		return
	}

	if strings.TrimSpace(input.CustomerName) == "" || strings.TrimSpace(input.Email) == "" || strings.TrimSpace(input.Phone) == "" || strings.TrimSpace(input.Address) == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Customer name, email, phone, and address are required")
		return
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

	shippingFee := 30000.0
	if shippingMethod == "express" {
		shippingFee = 50000.0
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

	orderNumber := fmt.Sprintf("TB%v", time.Now().Unix())
	result, err := tx.Exec(`
    INSERT INTO orders (order_number, user_id, customer_name, email, phone, address, note, delivery_time, promo_code, shipping_method, subtotal, shipping_fee, discount_total, total, payment_method, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `, orderNumber, userID, input.CustomerName, input.Email, input.Phone, input.Address, input.Note, input.DeliveryTime, promoCode, shippingMethod, subtotal, shippingFee, discountTotal, total, input.PaymentMethod)
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

	respondOK(c, OrderResponse{
		ID:            orderID,
		OrderNumber:   orderNumber,
		Subtotal:      subtotal,
		ShippingFee:   shippingFee,
		DiscountTotal: discountTotal,
		Total:         total,
		PaymentMethod: input.PaymentMethod,
		Status:        "pending",
	})
}

func (s *Server) UploadPaymentProof(c *gin.Context) {
	idParam := c.Param("id")
	orderID, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_order", "Invalid order ID")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "missing_file", "Payment proof file is required")
		return
	}

	extension := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("order_%d_%d%s", orderID, time.Now().Unix(), extension)
	path := filepath.Join(s.Config.UploadDir, filename)

	if err := c.SaveUploadedFile(file, path); err != nil {
		respondError(c, http.StatusInternalServerError, "upload_error", "Failed to save payment proof")
		return
	}

	url := "/uploads/" + filename
	if _, err := s.DB.Exec("UPDATE orders SET payment_proof_url = ?, payment_status = 'proof_submitted' WHERE id = ?", url, orderID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update payment proof")
		return
	}

	respondOK(c, gin.H{"payment_proof_url": s.buildAssetURL(url)})
}
