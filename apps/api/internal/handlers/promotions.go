package handlers

import (
	"database/sql"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type Coupon struct {
	ID            int
	Code          string
	DiscountType  string
	DiscountValue float64
	MaxDiscount   sql.NullFloat64
	MinSubtotal   float64
	StartsAt      sql.NullTime
	EndsAt        sql.NullTime
	UsageLimit    sql.NullInt64
	UsedCount     int
	Status        string
}

type PromoValidateRequest struct {
	Code     string  `json:"code"`
	Subtotal float64 `json:"subtotal"`
}

type PromoValidateResponse struct {
	PromoCode     string  `json:"promo_code"`
	DiscountTotal float64 `json:"discount_total"`
}

type PromoListItem struct {
	Code          string   `json:"code"`
	Description   string   `json:"description"`
	DiscountType  string   `json:"discount_type"`
	DiscountValue float64  `json:"discount_value"`
	MinSubtotal   float64  `json:"min_subtotal"`
	MaxDiscount   *float64 `json:"max_discount,omitempty"`
	StartsAt      *time.Time `json:"starts_at,omitempty"`
	EndsAt        *time.Time `json:"ends_at,omitempty"`
}

type promoError struct {
	code    string
	message string
}

func (err promoError) Error() string {
	return err.message
}

func (s *Server) ValidatePromotion(c *gin.Context) {
	var input PromoValidateRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid promotion payload")
		return
	}

	code := strings.TrimSpace(input.Code)
	if code == "" {
		respondError(c, http.StatusBadRequest, "missing_promo", "Promo code is required")
		return
	}

	discount, normalized, err := s.validateCoupon(nil, code, input.Subtotal, false)
	if err != nil {
		if perr, ok := err.(promoError); ok {
			respondError(c, http.StatusBadRequest, perr.code, perr.message)
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate promotion")
		return
	}

	respondOK(c, PromoValidateResponse{
		PromoCode:     normalized,
		DiscountTotal: discount,
	})
}

func (s *Server) ListPromotions(c *gin.Context) {
	now := time.Now()
	rows, err := s.DB.Query(`
    SELECT code, IFNULL(description, ''), discount_type, discount_value, min_subtotal, max_discount, starts_at, ends_at
    FROM coupons
    WHERE status = 'active'
      AND (
        discount_type != 'percent'
        OR ((starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?))
      )
    ORDER BY discount_value DESC, min_subtotal DESC
  `, now, now)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load promotions")
		return
	}
	defer rows.Close()

	items := make([]PromoListItem, 0)
	for rows.Next() {
		var item PromoListItem
		var maxDiscount sql.NullFloat64
		var startsAt sql.NullTime
		var endsAt sql.NullTime
		if err := rows.Scan(
			&item.Code,
			&item.Description,
			&item.DiscountType,
			&item.DiscountValue,
			&item.MinSubtotal,
			&maxDiscount,
			&startsAt,
			&endsAt,
		); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse promotions")
			return
		}
		if maxDiscount.Valid {
			item.MaxDiscount = &maxDiscount.Float64
		}
		if startsAt.Valid {
			item.StartsAt = &startsAt.Time
		}
		if endsAt.Valid {
			item.EndsAt = &endsAt.Time
		}
		items = append(items, item)
	}

	respondOK(c, items)
}

func (s *Server) validateCoupon(tx *sql.Tx, code string, subtotal float64, lock bool) (float64, string, error) {
	normalized := strings.ToUpper(strings.TrimSpace(code))
	if normalized == "" {
		return 0, "", nil
	}

	query := `
    SELECT id, code, discount_type, discount_value, max_discount, min_subtotal, starts_at, ends_at, usage_limit, used_count, status
    FROM coupons
    WHERE code = ?
  `
	if lock {
		query += " FOR UPDATE"
	}

	var row *sql.Row
	if tx != nil {
		row = tx.QueryRow(query, normalized)
	} else {
		row = s.DB.QueryRow(query, normalized)
	}

	var coupon Coupon
	if err := row.Scan(
		&coupon.ID,
		&coupon.Code,
		&coupon.DiscountType,
		&coupon.DiscountValue,
		&coupon.MaxDiscount,
		&coupon.MinSubtotal,
		&coupon.StartsAt,
		&coupon.EndsAt,
		&coupon.UsageLimit,
		&coupon.UsedCount,
		&coupon.Status,
	); err != nil {
		if err == sql.ErrNoRows {
			return 0, "", promoError{code: "invalid_promo", message: "Promo code is invalid"}
		}
		return 0, "", err
	}

	if coupon.Status != "active" {
		return 0, "", promoError{code: "inactive_promo", message: "Promo code is not active"}
	}

	now := time.Now()
	if coupon.StartsAt.Valid && now.Before(coupon.StartsAt.Time) {
		return 0, "", promoError{code: "promo_not_started", message: "Promo code is not active yet"}
	}
	if coupon.EndsAt.Valid && now.After(coupon.EndsAt.Time) {
		return 0, "", promoError{code: "promo_expired", message: "Promo code has expired"}
	}
	if coupon.UsageLimit.Valid && coupon.UsedCount >= int(coupon.UsageLimit.Int64) {
		return 0, "", promoError{code: "promo_limit", message: "Promo code has reached its usage limit"}
	}
	if coupon.MinSubtotal > 0 && subtotal < coupon.MinSubtotal {
		return 0, "", promoError{code: "promo_minimum", message: "Order total does not meet promo requirements"}
	}

	discount := 0.0
	switch coupon.DiscountType {
	case "percent":
		discount = subtotal * (coupon.DiscountValue / 100)
	case "amount":
		discount = coupon.DiscountValue
	default:
		return 0, "", promoError{code: "invalid_promo", message: "Promo code is invalid"}
	}

	if coupon.MaxDiscount.Valid && discount > coupon.MaxDiscount.Float64 {
		discount = coupon.MaxDiscount.Float64
	}
	if discount > subtotal {
		discount = subtotal
	}

	return discount, normalized, nil
}
