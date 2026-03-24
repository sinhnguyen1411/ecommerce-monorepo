package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"ecommerce-monorepo/apps/api/internal/auth"
)

type UserProfile struct {
	ID                      int     `json:"id"`
	Email                   string  `json:"email"`
	Name                    string  `json:"name"`
	AvatarURL               *string `json:"avatar_url,omitempty"`
	Phone                   *string `json:"phone,omitempty"`
	Birthdate               *string `json:"birthdate,omitempty"`
	IsEmailVerified         bool    `json:"is_email_verified"`
	EmailVerificationStatus string  `json:"emailVerificationStatus"`
	HasPassword             bool    `json:"has_password"`
	OnboardingRequired      bool    `json:"onboarding_required"`
}

type ProfileUpdateInput struct {
	Name      string  `json:"name"`
	Phone     string  `json:"phone"`
	Birthdate *string `json:"birthdate"`
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
	LineTotal float64 `json:"line_total"`
}

type OrderSummary struct {
	ID             int                `json:"id"`
	OrderNumber    string             `json:"order_number"`
	CustomerName   string             `json:"customer_name"`
	Email          string             `json:"email"`
	Phone          string             `json:"phone"`
	Address        string             `json:"address"`
	AddressLine    string             `json:"address_line"`
	Province       string             `json:"province"`
	District       string             `json:"district"`
	Note           string             `json:"note"`
	DeliveryTime   string             `json:"delivery_time"`
	PromoCode      string             `json:"promo_code"`
	ShippingMethod string             `json:"shipping_method"`
	Subtotal       float64            `json:"subtotal"`
	ShippingFee    float64            `json:"shipping_fee"`
	DiscountTotal  float64            `json:"discount_total"`
	Total          float64            `json:"total"`
	PaymentMethod  string             `json:"payment_method"`
	PaymentStatus  string             `json:"payment_status"`
	Status         string             `json:"status"`
	PaymentProof   string             `json:"payment_proof_url"`
	CreatedAt      string             `json:"created_at"`
	UpdatedAt      string             `json:"updated_at"`
	Items          []OrderItemSummary `json:"items"`
}

type OrderNoteUpdateInput struct {
	Note string `json:"note"`
}

func (s *Server) GetProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	user, err := s.loadUserByID(userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load profile")
		return
	}

	profile := UserProfile{
		ID:                      user.ID,
		AvatarURL:               nullStringPtr(user.AvatarURL),
		Phone:                   preferredPhone(user),
		Birthdate:               datePtr(user.Birthdate),
		IsEmailVerified:         user.IsEmailVerified,
		EmailVerificationStatus: emailVerificationStatus(user.IsEmailVerified),
		HasPassword:             hasPassword(user),
		OnboardingRequired:      requiresOnboarding(user),
	}
	if user.Email.Valid {
		profile.Email = user.Email.String
	}
	if user.FullName.Valid {
		profile.Name = user.FullName.String
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

	name := strings.TrimSpace(input.Name)
	phone := strings.TrimSpace(input.Phone)
	var phoneE164 string
	var phoneNational string
	parsedBirthdate := sql.NullTime{}
	if input.Birthdate != nil {
		birthdate := strings.TrimSpace(*input.Birthdate)
		if birthdate != "" {
			parsed, err := time.Parse("2006-01-02", birthdate)
			if err != nil {
				respondError(c, http.StatusBadRequest, "invalid_birthdate", "Birthdate must be YYYY-MM-DD")
				return
			}
			if !isAtLeastAge(parsed, 13) {
				respondError(c, http.StatusBadRequest, "invalid_birthdate", "Age must be at least 13")
				return
			}
			parsedBirthdate = sql.NullTime{Time: parsed, Valid: true}
		}
	}
	if phone != "" {
		normalized, national, err := auth.NormalizeVNPhone(phone)
		if err != nil {
			respondError(c, http.StatusBadRequest, "invalid_phone", "Invalid phone number")
			return
		}
		phoneE164 = normalized
		phoneNational = national
	}

	if input.Birthdate == nil {
		if phone != "" {
			if _, err := s.DB.Exec(
				`UPDATE users SET full_name = ?, phone_e164 = ?, phone_national = ? WHERE id = ?`,
				name,
				phoneE164,
				phoneNational,
				userID,
			); err != nil {
				respondError(c, http.StatusInternalServerError, "db_error", "Failed to update profile")
				return
			}
		} else if _, err := s.DB.Exec(`UPDATE users SET full_name = ? WHERE id = ?`, name, userID); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to update profile")
			return
		}
	} else {
		var birthdateVal any = nil
		if parsedBirthdate.Valid {
			birthdateVal = parsedBirthdate.Time
		}
		if phone != "" {
			if _, err := s.DB.Exec(
				`UPDATE users SET full_name = ?, phone_e164 = ?, phone_national = ?, birthdate = ? WHERE id = ?`,
				name,
				phoneE164,
				phoneNational,
				birthdateVal,
				userID,
			); err != nil {
				respondError(c, http.StatusInternalServerError, "db_error", "Failed to update profile")
				return
			}
		} else if _, err := s.DB.Exec(`UPDATE users SET full_name = ?, birthdate = ? WHERE id = ?`, name, birthdateVal, userID); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to update profile")
			return
		}
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

	fullName := strings.TrimSpace(input.FullName)
	phoneRaw := strings.TrimSpace(input.Phone)
	addressLine := strings.TrimSpace(input.AddressLine)
	provinceInput := strings.TrimSpace(input.Province)
	districtInput := strings.TrimSpace(input.District)
	if fullName == "" || phoneRaw == "" || addressLine == "" || provinceInput == "" || districtInput == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Full name, phone, address, province, and district are required")
		return
	}

	_, nationalPhone, err := auth.NormalizeVNPhone(phoneRaw)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_phone", "Invalid phone number")
		return
	}

	provinceName, districtName, err := s.resolveProvinceDistrict(provinceInput, districtInput)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_location", "Invalid province or district")
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
  `, userID, fullName, nationalPhone, addressLine, provinceName, districtName, input.IsDefault)
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

	fullName := strings.TrimSpace(input.FullName)
	phoneRaw := strings.TrimSpace(input.Phone)
	addressLine := strings.TrimSpace(input.AddressLine)
	provinceInput := strings.TrimSpace(input.Province)
	districtInput := strings.TrimSpace(input.District)
	if fullName == "" || phoneRaw == "" || addressLine == "" || provinceInput == "" || districtInput == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Full name, phone, address, province, and district are required")
		return
	}

	_, nationalPhone, err := auth.NormalizeVNPhone(phoneRaw)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_phone", "Invalid phone number")
		return
	}

	provinceName, districtName, err := s.resolveProvinceDistrict(provinceInput, districtInput)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_location", "Invalid province or district")
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
  `, fullName, nationalPhone, addressLine, provinceName, districtName, input.IsDefault, id, userID)
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
    SELECT
      id,
      order_number,
      IFNULL(customer_name, ''),
      IFNULL(email, ''),
      IFNULL(phone, ''),
      IFNULL(address, ''),
      IFNULL(address_line, ''),
      IFNULL(province, ''),
      IFNULL(district, ''),
      IFNULL(note, ''),
      IFNULL(delivery_time, ''),
      IFNULL(promo_code, ''),
      IFNULL(shipping_method, 'standard'),
      subtotal,
      shipping_fee,
      discount_total,
      total,
      IFNULL(payment_method, 'cod'),
      IFNULL(payment_status, 'pending'),
      IFNULL(status, 'pending'),
      IFNULL(payment_proof_url, ''),
      created_at,
      IFNULL(updated_at, created_at)
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
		if err := rows.Scan(
			&order.ID,
			&order.OrderNumber,
			&order.CustomerName,
			&order.Email,
			&order.Phone,
			&order.Address,
			&order.AddressLine,
			&order.Province,
			&order.District,
			&order.Note,
			&order.DeliveryTime,
			&order.PromoCode,
			&order.ShippingMethod,
			&order.Subtotal,
			&order.ShippingFee,
			&order.DiscountTotal,
			&order.Total,
			&order.PaymentMethod,
			&order.PaymentStatus,
			&order.Status,
			&order.PaymentProof,
			&order.CreatedAt,
			&order.UpdatedAt,
		); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse orders")
			return
		}
		if order.PaymentProof != "" {
			order.PaymentProof = s.buildAssetURL(order.PaymentProof)
		}
		order.Items = make([]OrderItemSummary, 0)
		orders = append(orders, order)
		orderIDs = append(orderIDs, order.ID)
		orderMap[order.ID] = &orders[len(orders)-1]
	}

	if len(orderIDs) == 0 {
		respondOK(c, orders)
		return
	}

	query := "SELECT order_id, product_id, product_name, quantity, unit_price, IFNULL(line_total, 0) FROM order_items WHERE order_id IN (" + intsToCSV(orderIDs) + ")"
	itemRows, err := s.DB.Query(query)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order items")
		return
	}
	defer itemRows.Close()

	for itemRows.Next() {
		var orderID int
		var item OrderItemSummary
		if err := itemRows.Scan(&orderID, &item.ProductID, &item.Name, &item.Quantity, &item.UnitPrice, &item.LineTotal); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse order items")
			return
		}
		if order, ok := orderMap[orderID]; ok {
			order.Items = append(order.Items, item)
		}
	}

	respondOK(c, orders)
}

func (s *Server) GetUserOrder(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_order", "Invalid order ID")
		return
	}

	order, found, err := s.loadUserOrderByID(userID, orderID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order")
		return
	}
	if !found {
		respondError(c, http.StatusNotFound, "not_found", "Order not found")
		return
	}

	respondOK(c, order)
}

func (s *Server) UpdateUserOrder(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_order", "Invalid order ID")
		return
	}

	var input OrderNoteUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid order payload")
		return
	}

	note := strings.TrimSpace(input.Note)
	if len(note) > 2000 {
		respondError(c, http.StatusBadRequest, "note_too_long", "Order note is too long")
		return
	}

	var status string
	row := s.DB.QueryRow(`SELECT IFNULL(status, 'pending') FROM orders WHERE id = ? AND user_id = ?`, orderID, userID)
	if err := row.Scan(&status); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "Order not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order")
		return
	}

	if strings.ToLower(strings.TrimSpace(status)) != "pending" {
		respondError(c, http.StatusBadRequest, "order_locked", "Order note can only be edited while pending")
		return
	}

	if _, err := s.DB.Exec(`UPDATE orders SET note = ? WHERE id = ? AND user_id = ?`, note, orderID, userID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update order")
		return
	}

	order, found, err := s.loadUserOrderByID(userID, orderID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order")
		return
	}
	if !found {
		respondError(c, http.StatusNotFound, "not_found", "Order not found")
		return
	}

	respondOK(c, order)
}

func (s *Server) UploadUserOrderPaymentProof(c *gin.Context) {
	ipKey := rateLimitKey("payment-proof:ip", c.ClientIP())
	if !s.enforceRateLimit(c, ipKey, s.Config.PaymentProofRateLimitMax, s.Config.PaymentProofRateLimitWindow, "payment_proof_rate_limited", "Too many upload attempts") {
		return
	}

	userID := c.MustGet("user_id").(int)
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_order", "Invalid order ID")
		return
	}

	var exists int
	if err := s.DB.QueryRow(`SELECT 1 FROM orders WHERE id = ? AND user_id = ?`, orderID, userID).Scan(&exists); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "Order not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "missing_file", "Payment proof file is required")
		return
	}
	url, ok := s.saveValidatedImageUpload(c, file, "order_user")
	if !ok {
		return
	}
	if _, err := s.DB.Exec(
		"UPDATE orders SET payment_proof_url = ?, payment_status = 'proof_submitted' WHERE id = ? AND user_id = ?",
		url,
		orderID,
		userID,
	); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update payment proof")
		return
	}

	order, found, err := s.loadUserOrderByID(userID, orderID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order")
		return
	}
	if !found {
		respondError(c, http.StatusNotFound, "not_found", "Order not found")
		return
	}

	respondOK(c, order)
}

func (s *Server) loadUserOrderByID(userID, orderID int) (OrderSummary, bool, error) {
	row := s.DB.QueryRow(`
    SELECT
      id,
      order_number,
      IFNULL(customer_name, ''),
      IFNULL(email, ''),
      IFNULL(phone, ''),
      IFNULL(address, ''),
      IFNULL(address_line, ''),
      IFNULL(province, ''),
      IFNULL(district, ''),
      IFNULL(note, ''),
      IFNULL(delivery_time, ''),
      IFNULL(promo_code, ''),
      IFNULL(shipping_method, 'standard'),
      subtotal,
      shipping_fee,
      discount_total,
      total,
      IFNULL(payment_method, 'cod'),
      IFNULL(payment_status, 'pending'),
      IFNULL(status, 'pending'),
      IFNULL(payment_proof_url, ''),
      created_at,
      IFNULL(updated_at, created_at)
    FROM orders
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `, orderID, userID)

	var order OrderSummary
	if err := row.Scan(
		&order.ID,
		&order.OrderNumber,
		&order.CustomerName,
		&order.Email,
		&order.Phone,
		&order.Address,
		&order.AddressLine,
		&order.Province,
		&order.District,
		&order.Note,
		&order.DeliveryTime,
		&order.PromoCode,
		&order.ShippingMethod,
		&order.Subtotal,
		&order.ShippingFee,
		&order.DiscountTotal,
		&order.Total,
		&order.PaymentMethod,
		&order.PaymentStatus,
		&order.Status,
		&order.PaymentProof,
		&order.CreatedAt,
		&order.UpdatedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return OrderSummary{}, false, nil
		}
		return OrderSummary{}, false, err
	}

	if order.PaymentProof != "" {
		order.PaymentProof = s.buildAssetURL(order.PaymentProof)
	}

	itemRows, err := s.DB.Query(`
    SELECT product_id, product_name, quantity, unit_price, IFNULL(line_total, 0)
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
  `, order.ID)
	if err != nil {
		return OrderSummary{}, false, err
	}
	defer itemRows.Close()

	order.Items = make([]OrderItemSummary, 0)
	for itemRows.Next() {
		var item OrderItemSummary
		if err := itemRows.Scan(&item.ProductID, &item.Name, &item.Quantity, &item.UnitPrice, &item.LineTotal); err != nil {
			return OrderSummary{}, false, err
		}
		order.Items = append(order.Items, item)
	}

	return order, true, nil
}

func intsToCSV(values []int) string {
	parts := make([]string, 0, len(values))
	for _, value := range values {
		parts = append(parts, strconv.Itoa(value))
	}
	return strings.Join(parts, ",")
}
