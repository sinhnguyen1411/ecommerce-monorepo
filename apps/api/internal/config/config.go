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
	OTPSecret             string
	MinOrderAmount        float64
	FreeShippingThreshold float64
	StandardShippingFee   float64
	ExpressShippingFee    float64
	UploadDir             string
	MigrateOnStart        bool
	SeedOnStart           bool
	PublicBaseURL         string
	FrontendBaseURL       string
	UserTokenTTL          time.Duration
	RefreshTokenTTL       time.Duration
	VerificationTokenTTL  time.Duration
	OTPTTL                time.Duration
	OTPSendWindow         time.Duration
	OTPCooldown           time.Duration
	OTPMaxAttempts        int
	OTPSendMax            int
	PasswordMinLength     int
	LoginMaxAttempts      int
	LoginLockoutDuration  time.Duration
	AuthRateLimitMax      int
	AuthRateLimitWindow   time.Duration
	APIRateLimitMax       int
	APIRateLimitWindow    time.Duration
	AdminTokenTTL         time.Duration
	AllowedOrigins        []string
	CORSAllowCredentials  bool
	TrustedProxies        []string
	SMTPHost              string
	SMTPPort              string
	SMTPUsername          string
	SMTPPassword          string
	SMTPFrom              string
	SMTPFromName          string
	VietQRImageBaseURL    string
	VietQRImageExt        string
	VietQRBaseURL         string
	VietQRClientID        string
	VietQRAPIKey          string
}

func Load() Config {
	smtpUser := getEnv("SMTP_USERNAME", getEnv("GMAIL_SMTP_USER", ""))
	smtpPassword := getEnv("SMTP_PASSWORD", getEnv("GMAIL_SMTP_APP_PASSWORD", ""))
	smtpHost := getEnv("SMTP_HOST", "")
	smtpPort := getEnv("SMTP_PORT", "")
	smtpFrom := getEnv("SMTP_FROM", "")
	smtpFromName := getEnv("SMTP_FROM_NAME", "")
	if smtpHost == "" && smtpUser != "" {
		smtpHost = "smtp.gmail.com"
	}
	if smtpPort == "" && smtpUser != "" {
		smtpPort = "587"
	}
	if smtpFrom == "" && smtpUser != "" {
		smtpFrom = smtpUser
	}

	return Config{
		AppEnv:                getEnv("APP_ENV", "local"),
		Port:                  getEnv("PORT", "8080"),
		DBHost:                getEnv("DB_HOST", "mysql"),
		DBPort:                getEnv("DB_PORT", "3306"),
		DBName:                getEnv("DB_NAME", "tambo"),
		DBUser:                getEnv("DB_USER", "tambo"),
		DBPassword:            getEnv("DB_PASSWORD", "tambo"),
		JWTSecret:             getEnv("JWT_SECRET", "change-me"),
		OTPSecret:             getEnv("OTP_SECRET", getEnv("JWT_SECRET", "change-me")),
		MinOrderAmount:        getFloat("MIN_ORDER_AMOUNT", 0),
		FreeShippingThreshold: getFloat("FREE_SHIPPING_THRESHOLD", 0),
		StandardShippingFee:   getFloat("SHIPPING_FEE_STANDARD", 30000),
		ExpressShippingFee:    getFloat("SHIPPING_FEE_EXPRESS", 50000),
		UploadDir:             getEnv("UPLOAD_DIR", "./uploads"),
		MigrateOnStart:        getBool("MIGRATE_ON_START", true),
		SeedOnStart:           getBool("SEED_ON_START", false),
		PublicBaseURL:         strings.TrimRight(getEnv("PUBLIC_BASE_URL", "http://localhost:8080"), "/"),
		FrontendBaseURL:       strings.TrimRight(getEnv("FRONTEND_BASE_URL", "http://localhost:3000"), "/"),
		UserTokenTTL:          getDuration("USER_TOKEN_TTL", 15*time.Minute),
		RefreshTokenTTL:       getDuration("REFRESH_TOKEN_TTL", 30*24*time.Hour),
		VerificationTokenTTL:  getDuration("VERIFICATION_TOKEN_TTL", 10*time.Minute),
		OTPTTL:                getDuration("OTP_TTL", 5*time.Minute),
		OTPSendWindow:         getDuration("OTP_SEND_WINDOW", 10*time.Minute),
		OTPCooldown:           getDuration("OTP_COOLDOWN", 60*time.Second),
		OTPMaxAttempts:        getInt("OTP_MAX_ATTEMPTS", 5),
		OTPSendMax:            getInt("OTP_SEND_MAX", 3),
		PasswordMinLength:     getInt("PASSWORD_MIN_LENGTH", 8),
		LoginMaxAttempts:      getInt("LOGIN_MAX_ATTEMPTS", 5),
		LoginLockoutDuration:  getDuration("LOGIN_LOCKOUT_DURATION", 15*time.Minute),
		AuthRateLimitMax:      getInt("AUTH_RATE_LIMIT_MAX", 20),
		AuthRateLimitWindow:   getDuration("AUTH_RATE_LIMIT_WINDOW", 1*time.Minute),
		APIRateLimitMax:       getInt("API_RATE_LIMIT_MAX", 300),
		APIRateLimitWindow:    getDuration("API_RATE_LIMIT_WINDOW", 1*time.Minute),
		AdminTokenTTL:         getDuration("ADMIN_TOKEN_TTL", 24*time.Hour),
		AllowedOrigins:        getList("ALLOWED_ORIGINS", "http://localhost:3000"),
		CORSAllowCredentials:  getBool("CORS_ALLOW_CREDENTIALS", false),
		TrustedProxies:        getList("TRUSTED_PROXIES", ""),
		SMTPHost:              smtpHost,
		SMTPPort:              smtpPort,
		SMTPUsername:          smtpUser,
		SMTPPassword:          smtpPassword,
		SMTPFrom:              smtpFrom,
		SMTPFromName:          smtpFromName,
		VietQRImageBaseURL:    strings.TrimRight(getEnv("VIETQR_IMAGE_BASE_URL", "https://img.vietqr.io"), "/"),
		VietQRImageExt:        strings.TrimPrefix(getEnv("VIETQR_IMAGE_EXT", "png"), "."),
		VietQRBaseURL:         strings.TrimRight(getEnv("VIETQR_BASE_URL", "https://api.vietqr.io"), "/"),
		VietQRClientID:        getEnv("VIETQR_CLIENT_ID", ""),
		VietQRAPIKey:          getEnv("VIETQR_API_KEY", ""),
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

func getInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
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
