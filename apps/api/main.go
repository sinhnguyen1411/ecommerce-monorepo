package main

import (
  "log"

  "github.com/gin-contrib/cors"
  "github.com/gin-gonic/gin"

  "ecommerce-monorepo/apps/api/internal/config"
  "ecommerce-monorepo/apps/api/internal/db"
  "ecommerce-monorepo/apps/api/internal/handlers"
  "ecommerce-monorepo/apps/api/internal/migrations"
  "ecommerce-monorepo/apps/api/internal/seed"
)

func main() {
  cfg := config.Load()

  if err := migrations.EnsureDir(cfg.UploadDir); err != nil {
    log.Fatalf("failed to create upload dir: %v", err)
  }

  database, err := db.Open(cfg)
  if err != nil {
    log.Fatalf("failed to connect database: %v", err)
  }

  if cfg.MigrateOnStart {
    if err := migrations.Apply(database, "./migrations"); err != nil {
      log.Fatalf("failed to apply migrations: %v", err)
    }
  }

  if cfg.SeedOnStart {
    if err := seed.ApplyIfNeeded(database, "./seed"); err != nil {
      log.Fatalf("failed to seed data: %v", err)
    }
  }

  router := gin.New()
  router.Use(gin.Logger(), gin.Recovery())

  router.Use(cors.New(cors.Config{
    AllowOrigins:     cfg.AllowedOrigins,
    AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
    AllowCredentials: true,
  }))

  router.Static("/uploads", cfg.UploadDir)

  server := handlers.New(database, cfg)
  server.RegisterRoutes(router)

  if err := router.Run(":" + cfg.Port); err != nil {
    log.Fatalf("failed to start server: %v", err)
  }
}
