package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppEnv                       string
	Port                         string
	DBHost                       string
	DBPort                       string
	DBName                       string
	DBUser                       string
	DBPassword                   string
	JWTSecret                    string
	OTPSecret                    string
	MinOrderAmount               float64
	FreeShippingThreshold        float64
	StandardShippingFee          float64
	ExpressShippingFee           float64
	UploadDir                    string
	MigrateOnStart               bool
	SeedOnStart                  bool
	SeedRefreshOnStart           bool
	PublicBaseURL                string
	FrontendBaseURL              string
	UserTokenTTL                 time.Duration
	RefreshTokenTTL              time.Duration
	VerificationTokenTTL         time.Duration
	OTPTTL                       time.Duration
	OTPSendWindow                time.Duration
	OTPCooldown                  time.Duration
	OTPMaxAttempts               int
	OTPSendMax                   int
	PasswordMinLength            int
	LoginWarnAttempts            int
	LoginMaxAttempts             int
	LoginLockoutDuration         time.Duration
	LoginIPRateLimitMax          int
	LoginIPRateLimitWindow       time.Duration
	LoginIDRateLimitMax          int
	LoginIDRateLimitWindow       time.Duration
	RegisterRateLimitMax         int
	RegisterRateLimitWindow      time.Duration
	OrderRateLimitMax            int
	OrderRateLimitWindow         time.Duration
	OrderAccessTokenTTL          time.Duration
	AllowLegacyOrderIDLookup     bool
	PromoValidateRateLimitMax    int
	PromoValidateRateLimitWindow time.Duration
	PaymentProofRateLimitMax     int
	PaymentProofRateLimitWindow  time.Duration
	BuyerWriteRateLimitMax       int
	BuyerWriteRateLimitWindow    time.Duration
	AdminWriteRateLimitMax       int
	AdminWriteRateLimitWindow    time.Duration
	JSONBodyMaxBytes             int64
	UploadMaxBytes               int64
	RedisEnabled                 bool
	RedisAddr                    string
	RedisPassword                string
	RedisDB                      int
	RedisPrefix                  string
	CacheEnabled                 bool
	CachePrefix                  string
	CacheListTTL                 time.Duration
	CacheDetailTTL               time.Duration
	CacheStaticTTL               time.Duration
	AuthRateLimitMax             int
	AuthRateLimitWindow          time.Duration
	APIRateLimitMax              int
	APIRateLimitWindow           time.Duration
	AdminTokenTTL                time.Duration
	AuthGmailOnly                bool
	GoogleClientID               string
	GoogleClientSecret           string
	GoogleRedirectURL            string
	AllowedOrigins               []string
	CORSAllowCredentials         bool
	TrustedProxies               []string
	SMTPHost                     string
	SMTPPort                     string
	SMTPUsername                 string
	SMTPPassword                 string
	SMTPFrom                     string
	SMTPFromName                 string
	VietQRImageBaseURL           string
	VietQRImageExt               string
	VietQRBaseURL                string
	VietQRClientID               string
	VietQRAPIKey                 string
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
		AppEnv:                       getEnv("APP_ENV", "local"),
		Port:                         getEnv("PORT", "8080"),
		DBHost:                       getEnv("DB_HOST", "mysql"),
		DBPort:                       getEnv("DB_PORT", "3306"),
		DBName:                       getEnv("DB_NAME", "tambo"),
		DBUser:                       getEnv("DB_USER", "tambo"),
		DBPassword:                   getEnv("DB_PASSWORD", "tambo"),
		JWTSecret:                    getEnv("JWT_SECRET", "change-me"),
		OTPSecret:                    getEnv("OTP_SECRET", getEnv("JWT_SECRET", "change-me")),
		MinOrderAmount:               getFloat("MIN_ORDER_AMOUNT", 0),
		FreeShippingThreshold:        getFloat("FREE_SHIPPING_THRESHOLD", 0),
		StandardShippingFee:          getFloat("SHIPPING_FEE_STANDARD", 30000),
		ExpressShippingFee:           getFloat("SHIPPING_FEE_EXPRESS", 50000),
		UploadDir:                    getEnv("UPLOAD_DIR", "./uploads"),
		MigrateOnStart:               getBool("MIGRATE_ON_START", true),
		SeedOnStart:                  getBool("SEED_ON_START", false),
		SeedRefreshOnStart:           getBool("SEED_REFRESH_ON_START", false),
		PublicBaseURL:                strings.TrimRight(getEnv("PUBLIC_BASE_URL", "http://localhost:8080"), "/"),
		FrontendBaseURL:              strings.TrimRight(getEnv("FRONTEND_BASE_URL", "http://localhost:3000"), "/"),
		UserTokenTTL:                 getDuration("USER_TOKEN_TTL", 15*time.Minute),
		RefreshTokenTTL:              getDuration("REFRESH_TOKEN_TTL", 30*24*time.Hour),
		VerificationTokenTTL:         getDuration("VERIFICATION_TOKEN_TTL", 10*time.Minute),
		OTPTTL:                       getDuration("OTP_TTL", 5*time.Minute),
		OTPSendWindow:                getDuration("OTP_SEND_WINDOW", 10*time.Minute),
		OTPCooldown:                  getDuration("OTP_COOLDOWN", 60*time.Second),
		OTPMaxAttempts:               getInt("OTP_MAX_ATTEMPTS", 5),
		OTPSendMax:                   getInt("OTP_SEND_MAX", 3),
		PasswordMinLength:            getInt("PASSWORD_MIN_LENGTH", 8),
		LoginWarnAttempts:            getInt("LOGIN_WARN_ATTEMPTS", 3),
		LoginMaxAttempts:             getInt("LOGIN_MAX_ATTEMPTS", 5),
		LoginLockoutDuration:         getDuration("LOGIN_LOCKOUT_DURATION", 30*time.Minute),
		LoginIPRateLimitMax:          getInt("LOGIN_IP_RATE_LIMIT_MAX", 10),
		LoginIPRateLimitWindow:       getDuration("LOGIN_IP_RATE_LIMIT_WINDOW", 1*time.Minute),
		LoginIDRateLimitMax:          getInt("LOGIN_ID_RATE_LIMIT_MAX", 5),
		LoginIDRateLimitWindow:       getDuration("LOGIN_ID_RATE_LIMIT_WINDOW", 10*time.Minute),
		RegisterRateLimitMax:         getInt("REGISTER_RATE_LIMIT_MAX", 5),
		RegisterRateLimitWindow:      getDuration("REGISTER_RATE_LIMIT_WINDOW", 1*time.Hour),
		OrderRateLimitMax:            getInt("ORDER_RATE_LIMIT_MAX", 5),
		OrderRateLimitWindow:         getDuration("ORDER_RATE_LIMIT_WINDOW", 10*time.Minute),
		OrderAccessTokenTTL:          getDuration("ORDER_ACCESS_TOKEN_TTL", 20*time.Minute),
		AllowLegacyOrderIDLookup:     getBool("ALLOW_LEGACY_ORDER_ID_LOOKUP", true),
		PromoValidateRateLimitMax:    getInt("PROMO_VALIDATE_RATE_LIMIT_MAX", 30),
		PromoValidateRateLimitWindow: getDuration("PROMO_VALIDATE_RATE_LIMIT_WINDOW", 10*time.Minute),
		PaymentProofRateLimitMax:     getInt("PAYMENT_PROOF_RATE_LIMIT_MAX", 3),
		PaymentProofRateLimitWindow:  getDuration("PAYMENT_PROOF_RATE_LIMIT_WINDOW", 1*time.Hour),
		BuyerWriteRateLimitMax:       getInt("BUYER_WRITE_RATE_LIMIT_MAX", 20),
		BuyerWriteRateLimitWindow:    getDuration("BUYER_WRITE_RATE_LIMIT_WINDOW", 5*time.Minute),
		AdminWriteRateLimitMax:       getInt("ADMIN_WRITE_RATE_LIMIT_MAX", 60),
		AdminWriteRateLimitWindow:    getDuration("ADMIN_WRITE_RATE_LIMIT_WINDOW", 5*time.Minute),
		JSONBodyMaxBytes:             getInt64("JSON_BODY_MAX_BYTES", 1024*1024),
		UploadMaxBytes:               getInt64("UPLOAD_MAX_BYTES", 5*1024*1024),
		RedisEnabled:                 getBool("REDIS_ENABLED", false),
		RedisAddr:                    getEnv("REDIS_ADDR", "redis:6379"),
		RedisPassword:                getEnv("REDIS_PASSWORD", ""),
		RedisDB:                      getInt("REDIS_DB", 0),
		RedisPrefix:                  getEnv("REDIS_PREFIX", "rl:"),
		CacheEnabled:                 getBool("CACHE_ENABLED", false),
		CachePrefix:                  getEnv("CACHE_PREFIX", "cache:"),
		CacheListTTL:                 getDuration("CACHE_LIST_TTL", 60*time.Second),
		CacheDetailTTL:               getDuration("CACHE_DETAIL_TTL", 5*time.Minute),
		CacheStaticTTL:               getDuration("CACHE_STATIC_TTL", 5*time.Minute),
		AuthRateLimitMax:             getInt("AUTH_RATE_LIMIT_MAX", 20),
		AuthRateLimitWindow:          getDuration("AUTH_RATE_LIMIT_WINDOW", 1*time.Minute),
		APIRateLimitMax:              getInt("API_RATE_LIMIT_MAX", 300),
		APIRateLimitWindow:           getDuration("API_RATE_LIMIT_WINDOW", 1*time.Minute),
		AdminTokenTTL:                getDuration("ADMIN_TOKEN_TTL", 24*time.Hour),
		AuthGmailOnly:                getBool("AUTH_GMAIL_ONLY", true),
		GoogleClientID:               getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:           getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:            getEnv("GOOGLE_REDIRECT_URL", ""),
		AllowedOrigins:               getList("ALLOWED_ORIGINS", "http://localhost:3000"),
		CORSAllowCredentials:         getBool("CORS_ALLOW_CREDENTIALS", false),
		TrustedProxies:               getList("TRUSTED_PROXIES", ""),
		SMTPHost:                     smtpHost,
		SMTPPort:                     smtpPort,
		SMTPUsername:                 smtpUser,
		SMTPPassword:                 smtpPassword,
		SMTPFrom:                     smtpFrom,
		SMTPFromName:                 smtpFromName,
		VietQRImageBaseURL:           strings.TrimRight(getEnv("VIETQR_IMAGE_BASE_URL", "https://img.vietqr.io"), "/"),
		VietQRImageExt:               strings.TrimPrefix(getEnv("VIETQR_IMAGE_EXT", "png"), "."),
		VietQRBaseURL:                strings.TrimRight(getEnv("VIETQR_BASE_URL", "https://api.vietqr.io"), "/"),
		VietQRClientID:               getEnv("VIETQR_CLIENT_ID", ""),
		VietQRAPIKey:                 getEnv("VIETQR_API_KEY", ""),
	}
}

func (c Config) ValidateRuntime() error {
	jwtSecret := strings.TrimSpace(c.JWTSecret)
	otpSecret := strings.TrimSpace(c.OTPSecret)
	if jwtSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	if otpSecret == "" {
		return fmt.Errorf("OTP_SECRET is required")
	}
	if c.OrderAccessTokenTTL <= 0 {
		return fmt.Errorf("ORDER_ACCESS_TOKEN_TTL must be greater than zero")
	}

	if strings.EqualFold(strings.TrimSpace(c.AppEnv), "production") {
		if isWeakSecret(jwtSecret) {
			return fmt.Errorf("JWT_SECRET is too weak for production")
		}
		if isWeakSecret(otpSecret) {
			return fmt.Errorf("OTP_SECRET is too weak for production")
		}
		if c.SeedOnStart {
			return fmt.Errorf("SEED_ON_START must be false in production")
		}
	}

	return nil
}

func isWeakSecret(value string) bool {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if len(normalized) < 24 {
		return true
	}

	switch normalized {
	case "change-me", "change-me-secret", "changeme", "secret", "default", "password":
		return true
	}
	return false
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

func getInt64(key string, fallback int64) int64 {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
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
