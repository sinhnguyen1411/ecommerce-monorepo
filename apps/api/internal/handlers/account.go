package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type UserProfile struct {
	ID        int     `json:"id"`
	Email     string  `json:"email"`
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatar_url,omitempty"`
	Phone     *string `json:"phone,omitempty"`
}

type ProfileUpdateInput struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

type Address struct {
	ID          int    `json:"id"`
	FullName    string `json:"full_name"`
	Phone       string `json:"phone"`
	AddressLine string `json:"address_line"`
	Province    string `json:"province"`
	District    string `json:"district"`
	IsDefault   bool   `json:"is_default"`
}

type AddressInput struct {
	FullName    string `json:"full_name"`
	Phone       string `json:"phone"`
	AddressLine string `json:"address_line"`
	Province    string `json:"province"`
	District    string `json:"district"`
	IsDefault   bool   `json:"is_default"`
}

type OrderItemSummary struct {
	ProductID int     `json:"product_id"`
	Name      string  `json:"name"`
	Quantity  int     `json:"quantity"`
	UnitPrice float64 `json:"unit_price"`
}

type OrderSummary struct {
	ID            int                `json:"id"`
	OrderNumber   string             `json:"order_number"`
	Subtotal      float64            `json:"subtotal"`
	ShippingFee   float64            `json:"shipping_fee"`
	DiscountTotal float64            `json:"discount_total"`
	Total         float64            `json:"total"`
	PaymentMethod string             `json:"payment_method"`
	PaymentStatus string             `json:"payment_status"`
	Status        string             `json:"status"`
	CreatedAt     string             `json:"created_at"`
	Items         []OrderItemSummary `json:"items"`
}

func (s *Server) GetProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	row := s.DB.QueryRow(`SELECT id, email, name, avatar_url, phone FROM users WHERE id = ?`, userID)
	var profile UserProfile
	var avatar sql.NullString
	var phone sql.NullString
	if err := row.Scan(&profile.ID, &profile.Email, &profile.Name, &avatar, &phone); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load profile")
		return
	}
	if avatar.Valid {
		profile.AvatarURL = &avatar.String
	}
	if phone.Valid {
		profile.Phone = &phone.String
	}

	respondOK(c, profile)
}

func (s *Server) UpdateProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	var input ProfileUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid profile payload")
		return
	}

	_, err := s.DB.Exec(`UPDATE users SET name = ?, phone = ? WHERE id = ?`, strings.TrimSpace(input.Name), strings.TrimSpace(input.Phone), userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update profile")
		return
	}

	s.GetProfile(c)
}

func (s *Server) ListAddresses(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	rows, err := s.DB.Query(`
    SELECT id, full_name, phone, address_line, IFNULL(province, ''), IFNULL(district, ''), is_default
    FROM user_addresses
    WHERE user_id = ?
    ORDER BY is_default DESC, created_at DESC
  `, userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load addresses")
		return
	}
	defer rows.Close()

	items := make([]Address, 0)
	for rows.Next() {
		var addr Address
		if err := rows.Scan(&addr.ID, &addr.FullName, &addr.Phone, &addr.AddressLine, &addr.Province, &addr.District, &addr.IsDefault); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse addresses")
			return
		}
		items = append(items, addr)
	}

	respondOK(c, items)
}

func (s *Server) CreateAddress(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	var input AddressInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid address payload")
		return
	}

	if strings.TrimSpace(input.FullName) == "" || strings.TrimSpace(input.Phone) == "" || strings.TrimSpace(input.AddressLine) == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Full name, phone, and address are required")
		return
	}

	tx, err := s.DB.Begin()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create address")
		return
	}
	defer tx.Rollback()

	if input.IsDefault {
		if _, err := tx.Exec(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?`, userID); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to update default address")
			return
		}
	}

	_, err = tx.Exec(`
    INSERT INTO user_addresses (user_id, full_name, phone, address_line, province, district, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, userID, input.FullName, input.Phone, input.AddressLine, input.Province, input.District, input.IsDefault)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create address")
		return
	}

	if err := tx.Commit(); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to save address")
		return
	}

	s.ListAddresses(c)
}

func (s *Server) UpdateAddress(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_address", "Invalid address ID")
		return
	}

	var input AddressInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid address payload")
		return
	}

	tx, err := s.DB.Begin()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update address")
		return
	}
	defer tx.Rollback()

	if input.IsDefault {
		if _, err := tx.Exec(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?`, userID); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to update default address")
			return
		}
	}

	result, err := tx.Exec(`
    UPDATE user_addresses
    SET full_name = ?, phone = ?, address_line = ?, province = ?, district = ?, is_default = ?
    WHERE id = ? AND user_id = ?
  `, input.FullName, input.Phone, input.AddressLine, input.Province, input.District, input.IsDefault, id, userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update address")
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		respondError(c, http.StatusNotFound, "not_found", "Address not found")
		return
	}

	if err := tx.Commit(); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update address")
		return
	}

	s.ListAddresses(c)
}

func (s *Server) DeleteAddress(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_address", "Invalid address ID")
		return
	}

	result, err := s.DB.Exec(`DELETE FROM user_addresses WHERE id = ? AND user_id = ?`, id, userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to delete address")
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		respondError(c, http.StatusNotFound, "not_found", "Address not found")
		return
	}

	respondOK(c, gin.H{"deleted": true})
}

func (s *Server) ListUserOrders(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	rows, err := s.DB.Query(`
    SELECT id, order_number, subtotal, shipping_fee, discount_total, total, payment_method, payment_status, status, created_at
    FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load orders")
		return
	}
	defer rows.Close()

	orders := make([]OrderSummary, 0)
	orderIDs := make([]int, 0)
	orderMap := make(map[int]*OrderSummary)
	for rows.Next() {
		var order OrderSummary
		if err := rows.Scan(&order.ID, &order.OrderNumber, &order.Subtotal, &order.ShippingFee, &order.DiscountTotal, &order.Total, &order.PaymentMethod, &order.PaymentStatus, &order.Status, &order.CreatedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse orders")
			return
		}
		orders = append(orders, order)
		orderIDs = append(orderIDs, order.ID)
		orderMap[order.ID] = &orders[len(orders)-1]
	}

	if len(orderIDs) == 0 {
		respondOK(c, orders)
		return
	}

	query := "SELECT order_id, product_id, product_name, quantity, unit_price FROM order_items WHERE order_id IN (" + intsToCSV(orderIDs) + ")"
	itemRows, err := s.DB.Query(query)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order items")
		return
	}
	defer itemRows.Close()

	for itemRows.Next() {
		var orderID int
		var item OrderItemSummary
		if err := itemRows.Scan(&orderID, &item.ProductID, &item.Name, &item.Quantity, &item.UnitPrice); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse order items")
			return
		}
		if order, ok := orderMap[orderID]; ok {
			order.Items = append(order.Items, item)
		}
	}

	respondOK(c, orders)
}

func intsToCSV(values []int) string {
	parts := make([]string, 0, len(values))
	for _, value := range values {
		parts = append(parts, strconv.Itoa(value))
	}
	return strings.Join(parts, ",")
}
