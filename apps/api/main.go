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
	if err := cfg.ValidateRuntime(); err != nil {
		log.Fatalf("invalid runtime config: %v", err)
	}

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
		if err := seed.ApplyIfNeeded(database, "./seed", cfg.SeedRefreshOnStart); err != nil {
			log.Fatalf("failed to seed data: %v", err)
		}
	}

	if cfg.CORSAllowCredentials {
		for _, origin := range cfg.AllowedOrigins {
			if origin == "*" {
				log.Fatal("CORS_ALLOW_CREDENTIALS requires explicit ALLOWED_ORIGINS (no wildcard)")
			}
		}
	}

	router := gin.New()
	if cfg.UploadMaxBytes > 0 {
		router.MaxMultipartMemory = cfg.UploadMaxBytes
	}
	router.Use(gin.Logger(), gin.Recovery())

	trustedProxies := cfg.TrustedProxies
	if len(trustedProxies) == 0 {
		trustedProxies = nil
	}
	if err := router.SetTrustedProxies(trustedProxies); err != nil {
		log.Fatalf("failed to set trusted proxies: %v", err)
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Device-ID"},
		AllowCredentials: cfg.CORSAllowCredentials,
	}))

	router.Static("/uploads", cfg.UploadDir)

	server, err := handlers.New(database, cfg)
	if err != nil {
		log.Fatalf("failed to initialize handlers: %v", err)
	}
	server.RegisterRoutes(router)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
