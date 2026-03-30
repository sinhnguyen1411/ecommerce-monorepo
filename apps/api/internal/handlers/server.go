package handlers

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"ecommerce-monorepo/apps/api/internal/config"
)

type Server struct {
	DB                   *sql.DB
	Config               config.Config
	EmailSender          EmailSender
	Redis                *redis.Client
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
	var redisClient *redis.Client
	if cfg.RedisEnabled {
		redisClient = redis.NewClient(&redis.Options{
			Addr:     cfg.RedisAddr,
			Password: cfg.RedisPassword,
			DB:       cfg.RedisDB,
		})
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := redisClient.Ping(ctx).Err(); err != nil {
			log.Printf("redis_unavailable err=%v", err)
			redisClient = nil
		}
	}

	return &Server{
		DB:               db,
		Config:           cfg,
		EmailSender:      emailSender,
		Redis:            redisClient,
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
		auth.Use(s.buyerWriteRateLimitMiddleware(map[string]struct{}{
			"/api/auth/login":    {},
			"/api/auth/register": {},
		}))
		{
			auth.GET("/google/start", s.GoogleStart)
			auth.GET("/google/callback", s.GoogleCallback)
			auth.POST("/otp/request", s.RequestLoginOTP)
			auth.POST("/otp/verify", s.VerifyLoginOTP)
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

		account := api.Group("/account", s.requireRole("user"))
		{
			account.GET("/profile", s.GetProfile)
			account.GET("/addresses", s.ListAddresses)
			account.GET("/orders", s.ListUserOrders)
			account.GET("/orders/:id", s.GetUserOrder)
		}
		accountWrite := api.Group("/account", s.requireRole("user"), s.buyerWriteRateLimitMiddleware(nil))
		{
			accountWrite.POST("/onboarding/complete", s.CompleteOnboarding)
			accountWrite.PATCH("/profile", s.UpdateProfile)
			accountWrite.POST("/addresses", s.CreateAddress)
			accountWrite.PATCH("/addresses/:id", s.UpdateAddress)
			accountWrite.DELETE("/addresses/:id", s.DeleteAddress)
			accountWrite.PATCH("/orders/:id", s.UpdateUserOrder)
			accountWrite.POST("/orders/:id/payment-proof", s.UploadUserOrderPaymentProof)
		}

		api.GET("/categories", s.cacheGetMiddleware(s.Config.CacheListTTL), s.ListCategories)
		api.GET("/products", s.cacheGetMiddleware(s.Config.CacheListTTL), s.ListProducts)
		api.GET("/products/:slug", s.cacheGetMiddleware(s.Config.CacheDetailTTL), s.GetProduct)
		api.GET("/posts", s.cacheGetMiddleware(s.Config.CacheListTTL), s.ListPosts)
		api.GET("/posts/:slug", s.cacheGetMiddleware(s.Config.CacheDetailTTL), s.GetPost)
		api.GET("/pages/:slug", s.cacheGetMiddleware(s.Config.CacheDetailTTL), s.GetPage)
		api.GET("/qna", s.cacheGetMiddleware(s.Config.CacheListTTL), s.ListQnA)
		api.GET("/locations", s.cacheGetMiddleware(s.Config.CacheListTTL), s.ListLocations)
		api.GET("/geo/provinces", s.cacheGetMiddleware(s.Config.CacheStaticTTL), s.ListProvinces)
		api.GET("/geo/districts", s.cacheGetMiddleware(s.Config.CacheStaticTTL), s.ListDistricts)
		api.GET("/checkout/config", s.cacheGetMiddleware(s.Config.CacheStaticTTL), s.GetCheckoutConfig)
		api.GET("/payment-settings", s.cacheGetMiddleware(s.Config.CacheStaticTTL), s.GetPaymentSettings)
		api.GET("/promotions", s.cacheGetMiddleware(s.Config.CacheListTTL), s.ListPromotions)
		api.POST("/promotions/validate", s.ValidatePromotion)
		api.POST("/analytics/pageview", s.TrackPageView)
		api.POST("/orders", s.CreateOrder)
		api.POST("/orders/access-token", s.buyerWriteRateLimitMiddleware(nil), s.CreateOrderAccessToken)
		api.GET("/orders/:id/summary", s.GetOrderSummary)
		api.PATCH("/orders/:id/payment-method", s.buyerWriteRateLimitMiddleware(nil), s.UpdateOrderPaymentMethod)
		api.GET("/orders/:id/payment/qr", s.GetOrderPaymentQR)
		api.POST("/orders/:id/payment-proof", s.UploadPaymentProof)

		api.POST("/admin/login", s.AdminLogin)
		api.POST("/admin/logout", s.adminWriteRateLimitMiddleware(), s.AdminLogout)
		admin := api.Group("/admin", s.requireRole("admin"), s.adminWriteRateLimitMiddleware())
		{
			admin.GET("/me", s.AdminMe)
			admin.PATCH("/me/preferences", s.AdminUpdatePreferences)
			admin.GET("/products", s.AdminListProducts)
			admin.POST("/products", s.AdminCreateProduct)
			admin.GET("/products/:id", s.AdminGetProduct)
			admin.PATCH("/products/:id", s.AdminUpdateProduct)
			admin.DELETE("/products/:id", s.AdminDeleteProduct)
			admin.POST("/products/:id/images", s.AdminAddProductImage)
			admin.PUT("/products/:id/images", s.AdminReplaceProductImages)

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

			admin.GET("/pages", s.AdminListPages)
			admin.POST("/pages", s.AdminCreatePage)
			admin.GET("/pages/:id", s.AdminGetPage)
			admin.PATCH("/pages/:id", s.AdminUpdatePage)

			admin.GET("/qna", s.AdminListQnA)
			admin.POST("/qna", s.AdminCreateQnA)
			admin.GET("/qna/:id", s.AdminGetQnA)
			admin.PATCH("/qna/:id", s.AdminUpdateQnA)
			admin.DELETE("/qna/:id", s.AdminDeleteQnA)

			admin.GET("/orders", s.AdminListOrders)
			admin.GET("/orders/:id", s.AdminGetOrder)
			admin.PATCH("/orders/:id", s.AdminUpdateOrder)
			admin.GET("/dashboard", s.AdminDashboard)

			admin.GET("/payment-settings", s.AdminGetPaymentSettings)
			admin.PUT("/payment-settings", s.AdminUpdatePaymentSettings)
			admin.GET("/checkout-settings", s.AdminGetCheckoutSettings)
			admin.PUT("/checkout-settings", s.AdminUpdateCheckoutSettings)

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

func respondErrorWithRetryAt(c *gin.Context, status int, code, message string, retryAt time.Time) {
	value := retryAt.UTC().Format(time.RFC3339)
	c.JSON(status, APIResponse{Success: false, Error: &APIError{Code: code, Message: message, RetryAt: &value}})
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
