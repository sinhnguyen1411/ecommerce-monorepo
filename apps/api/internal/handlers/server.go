package handlers

import (
  "database/sql"
  "net/http"
  "strings"

  "github.com/gin-gonic/gin"

  "ecommerce-monorepo/apps/api/internal/config"
)

type Server struct {
  DB     *sql.DB
  Config config.Config
}

func New(db *sql.DB, cfg config.Config) *Server {
  return &Server{DB: db, Config: cfg}
}

func (s *Server) RegisterRoutes(router *gin.Engine) {
  router.GET("/healthz", func(c *gin.Context) {
    respondOK(c, gin.H{"status": "ok"})
  })

  api := router.Group("/api")
  {
    api.GET("/categories", s.ListCategories)
    api.GET("/products", s.ListProducts)
    api.GET("/products/:slug", s.GetProduct)
    api.GET("/posts", s.ListPosts)
    api.GET("/posts/:slug", s.GetPost)
    api.GET("/pages/:slug", s.GetPage)
    api.GET("/qna", s.ListQnA)
    api.GET("/locations", s.ListLocations)
    api.POST("/orders", s.CreateOrder)
    api.POST("/orders/:id/payment-proof", s.UploadPaymentProof)
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
    return s.Config.PublicBaseURL + raw
  }

  return s.Config.PublicBaseURL + "/uploads/" + raw
}
