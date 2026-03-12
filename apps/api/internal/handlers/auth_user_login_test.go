package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"

	"ecommerce-monorepo/apps/api/internal/auth"
	"ecommerce-monorepo/apps/api/internal/config"
)

func TestLoginInvalidPasswordIncrementsAttempts(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	hash, err := auth.HashPassword("Password9", auth.DefaultPasswordParams)
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}

	userQuery := regexp.QuoteMeta(`
    SELECT id, email, phone_e164, phone_national, full_name, avatar_url, address, birthdate,
           is_email_verified, is_phone_verified, status, password_hash, failed_login_attempts, locked_until,
           onboarding_completed_at
    FROM users
    WHERE email = ?
    LIMIT 1
  `)
	mock.ExpectQuery(userQuery).
		WithArgs("buyer@gmail.com").
		WillReturnRows(sqlmock.NewRows([]string{
			"id",
			"email",
			"phone_e164",
			"phone_national",
			"full_name",
			"avatar_url",
			"address",
			"birthdate",
			"is_email_verified",
			"is_phone_verified",
			"status",
			"password_hash",
			"failed_login_attempts",
			"locked_until",
			"onboarding_completed_at",
		}).AddRow(
			7,
			"buyer@gmail.com",
			nil,
			nil,
			"Buyer Demo",
			nil,
			nil,
			nil,
			true,
			false,
			"active",
			hash,
			0,
			nil,
			nil,
		))
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`)).
		WithArgs(1, sqlmock.AnyArg(), 7).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO audit_logs (user_id, action, ip, meta_json) VALUES (?, ?, ?, ?)`)).
		WithArgs(7, "login_failed", sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	server := &Server{
		DB: db,
		Config: config.Config{
			LoginIPRateLimitMax:    0,
			LoginIDRateLimitMax:    0,
			LoginWarnAttempts:      0,
			LoginMaxAttempts:       5,
			LoginLockoutDuration:   30 * time.Minute,
			JSONBodyMaxBytes:       1024 * 1024,
			PasswordMinLength:      8,
			UserTokenTTL:           15 * time.Minute,
			RefreshTokenTTL:        24 * time.Hour,
			JWTSecret:              "test-secret",
			VerificationTokenTTL:   10 * time.Minute,
			BuyerWriteRateLimitMax: 0,
		},
	}

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(
		http.MethodPost,
		"/api/auth/login",
		strings.NewReader(`{"email":"buyer@gmail.com","password":"WrongPassword9"}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server.Login(ctx)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, recorder.Code)
	}

	var response APIResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Error == nil || response.Error.Code != "invalid_credentials" {
		t.Fatalf("expected invalid_credentials, got %#v", response.Error)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestLoginSuccessReturnsTokens(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	hash, err := auth.HashPassword("Password9", auth.DefaultPasswordParams)
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}

	userQuery := regexp.QuoteMeta(`
    SELECT id, email, phone_e164, phone_national, full_name, avatar_url, address, birthdate,
           is_email_verified, is_phone_verified, status, password_hash, failed_login_attempts, locked_until,
           onboarding_completed_at
    FROM users
    WHERE email = ?
    LIMIT 1
  `)
	mock.ExpectQuery(userQuery).
		WithArgs("buyer@gmail.com").
		WillReturnRows(sqlmock.NewRows([]string{
			"id",
			"email",
			"phone_e164",
			"phone_national",
			"full_name",
			"avatar_url",
			"address",
			"birthdate",
			"is_email_verified",
			"is_phone_verified",
			"status",
			"password_hash",
			"failed_login_attempts",
			"locked_until",
			"onboarding_completed_at",
		}).AddRow(
			7,
			"buyer@gmail.com",
			nil,
			nil,
			"Buyer Demo",
			nil,
			nil,
			nil,
			true,
			false,
			"active",
			hash,
			0,
			nil,
			time.Now(),
		))
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?`)).
		WithArgs(sqlmock.AnyArg(), 7).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(regexp.QuoteMeta(`
    INSERT INTO refresh_sessions (user_id, refresh_token_hash, user_agent, ip, device_id, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)).
		WithArgs(7, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(15, 1))
	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO audit_logs (user_id, action, ip, meta_json) VALUES (?, ?, ?, ?)`)).
		WithArgs(7, "login_success", sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	server := &Server{
		DB: db,
		Config: config.Config{
			LoginIPRateLimitMax:  0,
			LoginIDRateLimitMax:  0,
			LoginWarnAttempts:    0,
			LoginMaxAttempts:     5,
			LoginLockoutDuration: 30 * time.Minute,
			JSONBodyMaxBytes:     1024 * 1024,
			PasswordMinLength:    8,
			UserTokenTTL:         15 * time.Minute,
			RefreshTokenTTL:      24 * time.Hour,
			JWTSecret:            "test-secret",
		},
	}

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(
		http.MethodPost,
		"/api/auth/login",
		strings.NewReader(`{"email":"buyer@gmail.com","password":"Password9"}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Request.Header.Set("User-Agent", "test-agent")
	ctx.Request.Header.Set("X-Device-ID", "device-1")

	server.Login(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response struct {
		Success bool `json:"success"`
		Data    struct {
			AccessToken  string `json:"access_token"`
			RefreshToken string `json:"refresh_token"`
			User         struct {
				ID                 int  `json:"id"`
				OnboardingRequired bool `json:"onboarding_required"`
				HasPassword        bool `json:"has_password"`
			} `json:"user"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if !response.Success {
		t.Fatal("expected success response")
	}
	if response.Data.AccessToken == "" || response.Data.RefreshToken == "" {
		t.Fatal("expected both tokens in response")
	}
	if response.Data.User.ID != 7 {
		t.Fatalf("expected user id 7, got %d", response.Data.User.ID)
	}
	if response.Data.User.OnboardingRequired {
		t.Fatal("expected onboarding_required to be false")
	}
	if !response.Data.User.HasPassword {
		t.Fatal("expected has_password to be true")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
