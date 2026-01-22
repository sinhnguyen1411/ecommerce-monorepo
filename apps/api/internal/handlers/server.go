package handlers

import (
	"database/sql"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"ecommerce-monorepo/apps/api/internal/config"
)

type Server struct {
	DB                   *sql.DB
	Config               config.Config
	EmailSender          EmailSender
	vietqrBanksMu        sync.Mutex
	vietqrBanksCache     map[string]int
	vietqrBanksExpiresAt time.Time
	geoMu                sync.Mutex
	geoData              []geoProvince
	geoExpiresAt         time.Time
}

func New(db *sql.DB, cfg config.Config) (*Server, error) {
	emailSender, err := buildEmailSender(cfg)
	if err != nil {
		return nil, err
	}

	return &Server{
		DB:               db,
		Config:           cfg,
		EmailSender:      emailSender,
		vietqrBanksCache: make(map[string]int),
	}, nil
}

func (s *Server) RegisterRoutes(router *gin.Engine) {
	router.GET("/healthz", func(c *gin.Context) {
		respondOK(c, gin.H{"status": "ok"})
	})

	api := router.Group("/api")
	api.Use(s.apiRateLimitMiddleware())
	{
		auth := api.Group("/auth")
		auth.Use(s.authRateLimitMiddleware())
		{
			auth.POST("/register", s.Register)
			auth.POST("/login", s.Login)
			auth.POST("/logout", s.Logout)
			auth.POST("/refresh", s.Refresh)
			auth.POST("/send-email-otp", s.requireRole("user"), s.SendEmailOTP)
			auth.POST("/verify-email-otp", s.requireRole("user"), s.VerifyEmailOTP)
			auth.POST("/forgot-password/request-otp", s.ForgotPasswordRequestOTP)
			auth.POST("/forgot-password/verify-otp", s.ForgotPasswordVerifyOTP)
			auth.POST("/forgot-password/reset", s.ForgotPasswordReset)
			auth.POST("/change-password", s.requireRole("user"), s.ChangePassword)
			auth.GET("/sessions", s.requireRole("user"), s.ListSessions)
			auth.POST("/sessions/:id/revoke", s.requireRole("user"), s.RevokeSession)
			auth.GET("/me", s.requireRole("user"), s.GetMe)
			auth.PATCH("/me", s.requireRole("user"), s.UpdateMe)
		}

		api.GET("/account/profile", s.requireRole("user"), s.GetProfile)
		api.PATCH("/account/profile", s.requireRole("user"), s.UpdateProfile)
		api.GET("/account/addresses", s.requireRole("user"), s.ListAddresses)
		api.POST("/account/addresses", s.requireRole("user"), s.CreateAddress)
		api.PATCH("/account/addresses/:id", s.requireRole("user"), s.UpdateAddress)
		api.DELETE("/account/addresses/:id", s.requireRole("user"), s.DeleteAddress)
		api.GET("/account/orders", s.requireRole("user"), s.ListUserOrders)

		api.GET("/categories", s.ListCategories)
		api.GET("/products", s.ListProducts)
		api.GET("/products/:slug", s.GetProduct)
		api.GET("/posts", s.ListPosts)
		api.GET("/posts/:slug", s.GetPost)
		api.GET("/pages/:slug", s.GetPage)
		api.GET("/qna", s.ListQnA)
		api.GET("/locations", s.ListLocations)
		api.GET("/geo/provinces", s.ListProvinces)
		api.GET("/geo/districts", s.ListDistricts)
		api.GET("/checkout/config", s.GetCheckoutConfig)
		api.GET("/payment-settings", s.GetPaymentSettings)
		api.GET("/promotions", s.ListPromotions)
		api.POST("/promotions/validate", s.ValidatePromotion)
		api.POST("/orders", s.CreateOrder)
		api.GET("/orders/:id/summary", s.GetOrderSummary)
		api.PATCH("/orders/:id/payment-method", s.UpdateOrderPaymentMethod)
		api.GET("/orders/:id/payment/qr", s.GetOrderPaymentQR)
		api.POST("/orders/:id/payment-proof", s.UploadPaymentProof)

		api.POST("/admin/login", s.AdminLogin)
		api.POST("/admin/logout", s.AdminLogout)
		admin := api.Group("/admin", s.requireRole("admin"))
		{
			admin.GET("/me", s.AdminMe)
			admin.GET("/products", s.AdminListProducts)
			admin.POST("/products", s.AdminCreateProduct)
			admin.GET("/products/:id", s.AdminGetProduct)
			admin.PATCH("/products/:id", s.AdminUpdateProduct)
			admin.DELETE("/products/:id", s.AdminDeleteProduct)
			admin.POST("/products/:id/images", s.AdminAddProductImage)

			admin.GET("/categories", s.AdminListCategories)
			admin.POST("/categories", s.AdminCreateCategory)
			admin.GET("/categories/:id", s.AdminGetCategory)
			admin.PATCH("/categories/:id", s.AdminUpdateCategory)
			admin.DELETE("/categories/:id", s.AdminDeleteCategory)

			admin.GET("/posts", s.AdminListPosts)
			admin.POST("/posts", s.AdminCreatePost)
			admin.GET("/posts/:id", s.AdminGetPost)
			admin.PATCH("/posts/:id", s.AdminUpdatePost)
			admin.DELETE("/posts/:id", s.AdminDeletePost)

			admin.GET("/qna", s.AdminListQnA)
			admin.POST("/qna", s.AdminCreateQnA)
			admin.GET("/qna/:id", s.AdminGetQnA)
			admin.PATCH("/qna/:id", s.AdminUpdateQnA)
			admin.DELETE("/qna/:id", s.AdminDeleteQnA)

			admin.GET("/orders", s.AdminListOrders)
			admin.GET("/orders/:id", s.AdminGetOrder)
			admin.PATCH("/orders/:id", s.AdminUpdateOrder)

			admin.GET("/payment-settings", s.AdminGetPaymentSettings)
			admin.PUT("/payment-settings", s.AdminUpdatePaymentSettings)

			admin.POST("/uploads", s.AdminUpload)
		}
	}
}

func respondOK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, APIResponse{Success: true, Data: data})
}

func respondError(c *gin.Context, status int, code, message string) {
	c.JSON(status, APIResponse{Success: false, Error: &APIError{Code: code, Message: message}})
}

func (s *Server) buildAssetURL(raw string) string {
	if raw == "" {
		return ""
	}

	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}

	if strings.HasPrefix(raw, "/") {
		if strings.HasPrefix(raw, "/tam-bo/") {
			return s.Config.FrontendBaseURL + raw
		}
		return s.Config.PublicBaseURL + raw
	}

	return s.Config.PublicBaseURL + "/uploads/" + raw
}
