package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CheckoutSettings struct {
	ID                    int     `json:"-"`
	MinOrderAmount        float64 `json:"min_order_amount"`
	FreeShippingThreshold float64 `json:"free_shipping_threshold"`
	ShippingFeeStandard   float64 `json:"shipping_fee_standard"`
	ShippingFeeExpress    float64 `json:"shipping_fee_express"`
}

func (s *Server) defaultCheckoutSettings() CheckoutSettings {
	return CheckoutSettings{
		ID:                    1,
		MinOrderAmount:        s.Config.MinOrderAmount,
		FreeShippingThreshold: s.Config.FreeShippingThreshold,
		ShippingFeeStandard:   s.Config.StandardShippingFee,
		ShippingFeeExpress:    s.Config.ExpressShippingFee,
	}
}

func (s *Server) loadCheckoutSettings() (CheckoutSettings, error) {
	row := s.DB.QueryRow(`
		SELECT id, min_order_amount, free_shipping_threshold, shipping_fee_standard, shipping_fee_express
		FROM checkout_settings
		LIMIT 1
	`)

	var settings CheckoutSettings
	if err := row.Scan(
		&settings.ID,
		&settings.MinOrderAmount,
		&settings.FreeShippingThreshold,
		&settings.ShippingFeeStandard,
		&settings.ShippingFeeExpress,
	); err != nil {
		if err == sql.ErrNoRows {
			return s.defaultCheckoutSettings(), nil
		}
		return CheckoutSettings{}, err
	}

	return settings, nil
}

func validateCheckoutSettings(input CheckoutSettings) bool {
	return input.MinOrderAmount >= 0 &&
		input.FreeShippingThreshold >= 0 &&
		input.ShippingFeeStandard >= 0 &&
		input.ShippingFeeExpress >= 0
}

func (s *Server) GetCheckoutConfig(c *gin.Context) {
	settings, err := s.loadCheckoutSettings()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load checkout settings")
		return
	}

	respondOK(c, settings)
}

func (s *Server) AdminGetCheckoutSettings(c *gin.Context) {
	settings, err := s.loadCheckoutSettings()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load checkout settings")
		return
	}

	respondOK(c, settings)
}

func (s *Server) AdminUpdateCheckoutSettings(c *gin.Context) {
	var input CheckoutSettings
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid checkout settings payload")
		return
	}

	if !validateCheckoutSettings(input) {
		respondError(c, http.StatusBadRequest, "invalid_checkout_settings", "Checkout settings must be non-negative")
		return
	}

	input.ID = 1
	_, err := s.DB.Exec(`
		INSERT INTO checkout_settings (id, min_order_amount, free_shipping_threshold, shipping_fee_standard, shipping_fee_express)
		VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			min_order_amount = VALUES(min_order_amount),
			free_shipping_threshold = VALUES(free_shipping_threshold),
			shipping_fee_standard = VALUES(shipping_fee_standard),
			shipping_fee_express = VALUES(shipping_fee_express)
	`, input.ID, input.MinOrderAmount, input.FreeShippingThreshold, input.ShippingFeeStandard, input.ShippingFeeExpress)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update checkout settings")
		return
	}

	s.invalidateCache(http.MethodGet, "/api/checkout/config")
	s.AdminGetCheckoutSettings(c)
}
