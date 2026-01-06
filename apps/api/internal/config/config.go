package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppEnv                string
	Port                  string
	DBHost                string
	DBPort                string
	DBName                string
	DBUser                string
	DBPassword            string
	JWTSecret             string
	MinOrderAmount        float64
	FreeShippingThreshold float64
	UploadDir             string
	MigrateOnStart        bool
	SeedOnStart           bool
	PublicBaseURL         string
	FrontendBaseURL       string
	GoogleClientID        string
	GoogleClientSecret    string
	GoogleRedirectURL     string
	UserTokenTTL          time.Duration
	AdminTokenTTL         time.Duration
	AllowedOrigins        []string
}

func Load() Config {
	return Config{
		AppEnv:                getEnv("APP_ENV", "local"),
		Port:                  getEnv("PORT", "8080"),
		DBHost:                getEnv("DB_HOST", "mysql"),
		DBPort:                getEnv("DB_PORT", "3306"),
		DBName:                getEnv("DB_NAME", "ttc"),
		DBUser:                getEnv("DB_USER", "ttc"),
		DBPassword:            getEnv("DB_PASSWORD", "ttc"),
		JWTSecret:             getEnv("JWT_SECRET", "change-me"),
		MinOrderAmount:        getFloat("MIN_ORDER_AMOUNT", 0),
		FreeShippingThreshold: getFloat("FREE_SHIPPING_THRESHOLD", 0),
		UploadDir:             getEnv("UPLOAD_DIR", "./uploads"),
		MigrateOnStart:        getBool("MIGRATE_ON_START", true),
		SeedOnStart:           getBool("SEED_ON_START", false),
		PublicBaseURL:         strings.TrimRight(getEnv("PUBLIC_BASE_URL", "http://localhost:8080"), "/"),
		FrontendBaseURL:       strings.TrimRight(getEnv("FRONTEND_BASE_URL", "http://localhost:3000"), "/"),
		GoogleClientID:        getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:    getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:     getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback"),
		UserTokenTTL:          getDuration("USER_TOKEN_TTL", 72*time.Hour),
		AdminTokenTTL:         getDuration("ADMIN_TOKEN_TTL", 24*time.Hour),
		AllowedOrigins:        getList("ALLOWED_ORIGINS", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func getBool(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func getFloat(key string, fallback float64) float64 {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return fallback
	}
	return parsed
}

func getDuration(key string, fallback time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func getList(key, fallback string) []string {
	raw := getEnv(key, fallback)
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			values = append(values, trimmed)
		}
	}
	return values
}
