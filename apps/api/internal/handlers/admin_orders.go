package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type AdminOrder struct {
	ID            int                `json:"id"`
	OrderNumber   string             `json:"order_number"`
	CustomerName  string             `json:"customer_name"`
	Email         string             `json:"email"`
	Phone         string             `json:"phone"`
	Address       string             `json:"address"`
	Note          string             `json:"note"`
	DeliveryTime  string             `json:"delivery_time"`
	Subtotal      float64            `json:"subtotal"`
	ShippingFee   float64            `json:"shipping_fee"`
	DiscountTotal float64            `json:"discount_total"`
	Total         float64            `json:"total"`
	PaymentMethod string             `json:"payment_method"`
	PaymentStatus string             `json:"payment_status"`
	Status        string             `json:"status"`
	PaymentProof  string             `json:"payment_proof_url"`
	AdminNote     string             `json:"admin_note"`
	CreatedAt     string             `json:"created_at"`
	Items         []OrderItemSummary `json:"items"`
}

type AdminOrderUpdateInput struct {
	Status        string `json:"status"`
	PaymentStatus string `json:"payment_status"`
	AdminNote     string `json:"admin_note"`
}

func (s *Server) AdminListOrders(c *gin.Context) {
	status := c.Query("status")
	paymentStatus := c.Query("payment_status")

	query := strings.Builder{}
	query.WriteString(`SELECT id, order_number, customer_name, email, phone, address, IFNULL(note, ''), IFNULL(delivery_time, ''), subtotal, shipping_fee, discount_total, total, payment_method, IFNULL(payment_status, 'pending'), status, IFNULL(payment_proof_url, ''), IFNULL(admin_note, ''), created_at FROM orders`)
	args := make([]any, 0)

	filters := make([]string, 0)
	if status != "" {
		filters = append(filters, "status = ?")
		args = append(args, status)
	}
	if paymentStatus != "" {
		filters = append(filters, "payment_status = ?")
		args = append(args, paymentStatus)
	}
	if len(filters) > 0 {
		query.WriteString(" WHERE ")
		query.WriteString(strings.Join(filters, " AND "))
	}
	query.WriteString(" ORDER BY created_at DESC")

	rows, err := s.DB.Query(query.String(), args...)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load orders")
		return
	}
	defer rows.Close()

	orders := make([]AdminOrder, 0)
	orderIDs := make([]int, 0)
	orderMap := make(map[int]*AdminOrder)
	for rows.Next() {
		var order AdminOrder
		if err := rows.Scan(&order.ID, &order.OrderNumber, &order.CustomerName, &order.Email, &order.Phone, &order.Address, &order.Note, &order.DeliveryTime, &order.Subtotal, &order.ShippingFee, &order.DiscountTotal, &order.Total, &order.PaymentMethod, &order.PaymentStatus, &order.Status, &order.PaymentProof, &order.AdminNote, &order.CreatedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse orders")
			return
		}
		if order.PaymentProof != "" {
			order.PaymentProof = s.buildAssetURL(order.PaymentProof)
		}
		orders = append(orders, order)
		orderIDs = append(orderIDs, order.ID)
		orderMap[order.ID] = &orders[len(orders)-1]
	}

	if len(orderIDs) == 0 {
		respondOK(c, orders)
		return
	}

	queryItems := "SELECT order_id, product_id, product_name, quantity, unit_price FROM order_items WHERE order_id IN (" + intsToCSV(orderIDs) + ")"
	itemRows, err := s.DB.Query(queryItems)
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

func (s *Server) AdminGetOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_order", "Invalid order ID")
		return
	}

	row := s.DB.QueryRow(`
    SELECT id, order_number, customer_name, email, phone, address, IFNULL(note, ''), IFNULL(delivery_time, ''), subtotal, shipping_fee, discount_total, total, payment_method, IFNULL(payment_status, 'pending'), status, IFNULL(payment_proof_url, ''), IFNULL(admin_note, ''), created_at
    FROM orders WHERE id = ?
  `, id)
	var order AdminOrder
	if err := row.Scan(&order.ID, &order.OrderNumber, &order.CustomerName, &order.Email, &order.Phone, &order.Address, &order.Note, &order.DeliveryTime, &order.Subtotal, &order.ShippingFee, &order.DiscountTotal, &order.Total, &order.PaymentMethod, &order.PaymentStatus, &order.Status, &order.PaymentProof, &order.AdminNote, &order.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "Order not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order")
		return
	}

	if order.PaymentProof != "" {
		order.PaymentProof = s.buildAssetURL(order.PaymentProof)
	}

	items := make([]OrderItemSummary, 0)
	rows, err := s.DB.Query(`SELECT product_id, product_name, quantity, unit_price FROM order_items WHERE order_id = ?`, id)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var item OrderItemSummary
			if err := rows.Scan(&item.ProductID, &item.Name, &item.Quantity, &item.UnitPrice); err == nil {
				items = append(items, item)
			}
		}
	}
	order.Items = items

	respondOK(c, order)
}

func (s *Server) AdminUpdateOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_order", "Invalid order ID")
		return
	}

	var input AdminOrderUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid order payload")
		return
	}

	_, err = s.DB.Exec(`
    UPDATE orders
    SET status = COALESCE(NULLIF(?, ''), status),
        payment_status = COALESCE(NULLIF(?, ''), payment_status),
        admin_note = ?
    WHERE id = ?
  `, input.Status, input.PaymentStatus, input.AdminNote, id)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update order")
		return
	}

	s.AdminGetOrder(c)
}
