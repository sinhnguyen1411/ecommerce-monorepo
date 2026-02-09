package handlers

import "github.com/gin-gonic/gin"

type checkoutConfigResponse struct {
	MinOrderAmount       float64 `json:"min_order_amount"`
	FreeShippingThreshold float64 `json:"free_shipping_threshold"`
	ShippingFeeStandard  float64 `json:"shipping_fee_standard"`
	ShippingFeeExpress   float64 `json:"shipping_fee_express"`
}

func (s *Server) GetCheckoutConfig(c *gin.Context) {
	respondOK(c, checkoutConfigResponse{
		MinOrderAmount:       s.Config.MinOrderAmount,
		FreeShippingThreshold: s.Config.FreeShippingThreshold,
		ShippingFeeStandard:  s.Config.StandardShippingFee,
		ShippingFeeExpress:   s.Config.ExpressShippingFee,
	})
}
