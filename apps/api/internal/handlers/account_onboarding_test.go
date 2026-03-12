package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"

	"ecommerce-monorepo/apps/api/internal/config"
)

func TestCompleteOnboardingRejectsPasswordMismatch(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("user_id", 42)
	ctx.Request = httptest.NewRequest(
		http.MethodPost,
		"/api/account/onboarding/complete",
		strings.NewReader(`{
			"full_name":"Buyer Demo",
			"phone":"0901234567",
			"birthdate":"2000-01-02",
			"address_line":"123 Demo Street",
			"province":"Ho Chi Minh",
			"district":"District 1",
			"password":"Password9",
			"password_confirm":"Password8"
		}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server := &Server{
		Config: config.Config{PasswordMinLength: 8},
	}
	server.CompleteOnboarding(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, recorder.Code)
	}

	var response APIResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Error == nil || response.Error.Code != "password_mismatch" {
		t.Fatalf("expected password_mismatch error, got %#v", response.Error)
	}
}

func TestCompleteOnboardingCreatesPasswordAndDefaultAddress(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	server := &Server{
		DB: db,
		Config: config.Config{
			PasswordMinLength: 8,
			JSONBodyMaxBytes:  1024 * 1024,
		},
		geoData: []geoProvince{
			{
				Code: 79,
				Name: "Ho Chi Minh",
				Districts: []geoDistrict{
					{Code: 760, Name: "District 1"},
				},
			},
		},
		geoExpiresAt: time.Now().Add(time.Hour),
	}

	initialUserQuery := regexp.QuoteMeta(`
    SELECT id, email, phone_e164, phone_national, full_name, avatar_url, address, birthdate,
           is_email_verified, is_phone_verified, status, password_hash, failed_login_attempts, locked_until,
           onboarding_completed_at
    FROM users
    WHERE id = ?
  `)
	finalUserQuery := initialUserQuery

	mock.ExpectQuery(initialUserQuery).
		WithArgs(42).
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
			42,
			"buyer@gmail.com",
			nil,
			nil,
			nil,
			nil,
			nil,
			nil,
			true,
			false,
			"active",
			nil,
			0,
			nil,
			nil,
		))

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta(`
    UPDATE users
    SET full_name = ?, phone_e164 = ?, phone_national = ?, birthdate = ?, address = ?, password_hash = ?, onboarding_completed_at = ?
    WHERE id = ?
  `)).
		WithArgs(
			"Buyer Demo",
			"+84901234567",
			"0901234567",
			sqlmock.AnyArg(),
			"123 Demo Street, District 1, Ho Chi Minh",
			sqlmock.AnyArg(),
			sqlmock.AnyArg(),
			42,
		).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery(regexp.QuoteMeta(`
    SELECT id
    FROM user_addresses
    WHERE user_id = ? AND is_default = TRUE
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE
  `)).
		WithArgs(42).
		WillReturnError(sql.ErrNoRows)
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?`)).
		WithArgs(42).
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec(regexp.QuoteMeta(`
      INSERT INTO user_addresses (user_id, full_name, phone, address_line, province, district, is_default)
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `)).
		WithArgs(42, "Buyer Demo", "0901234567", "123 Demo Street", "Ho Chi Minh", "District 1").
		WillReturnResult(sqlmock.NewResult(15, 1))
	mock.ExpectCommit()
	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO audit_logs (user_id, action, ip, meta_json) VALUES (?, ?, ?, ?)`)).
		WithArgs(42, "onboarding_completed", sqlmock.AnyArg(), nil).
		WillReturnResult(sqlmock.NewResult(1, 1))

	mock.ExpectQuery(finalUserQuery).
		WithArgs(42).
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
			42,
			"buyer@gmail.com",
			"+84901234567",
			"0901234567",
			"Buyer Demo",
			nil,
			"123 Demo Street, District 1, Ho Chi Minh",
			time.Date(2000, time.January, 2, 0, 0, 0, 0, time.UTC),
			true,
			false,
			"active",
			"argon2id$hash",
			0,
			nil,
			time.Now(),
		))

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("user_id", 42)
	ctx.Request = httptest.NewRequest(
		http.MethodPost,
		"/api/account/onboarding/complete",
		strings.NewReader(`{
			"full_name":"Buyer Demo",
			"phone":"0901234567",
			"birthdate":"2000-01-02",
			"address_line":"123 Demo Street",
			"province":"Ho Chi Minh",
			"district":"District 1",
			"password":"Password9",
			"password_confirm":"Password9"
		}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server.CompleteOnboarding(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response struct {
		Success bool `json:"success"`
		Data    struct {
			Email              string `json:"email"`
			Name               string `json:"name"`
			Phone              string `json:"phone"`
			Birthdate          string `json:"birthdate"`
			HasPassword        bool   `json:"has_password"`
			OnboardingRequired bool   `json:"onboarding_required"`
		} `json:"data"`
		Error *APIError `json:"error"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got %#v", response.Error)
	}
	if response.Data.Email != "buyer@gmail.com" {
		t.Fatalf("expected email to be preserved, got %q", response.Data.Email)
	}
	if response.Data.Name != "Buyer Demo" {
		t.Fatalf("expected updated name, got %q", response.Data.Name)
	}
	if response.Data.Phone != "0901234567" {
		t.Fatalf("expected normalized phone, got %q", response.Data.Phone)
	}
	if response.Data.Birthdate != "2000-01-02" {
		t.Fatalf("expected birthdate to round-trip, got %q", response.Data.Birthdate)
	}
	if !response.Data.HasPassword {
		t.Fatal("expected has_password to be true")
	}
	if response.Data.OnboardingRequired {
		t.Fatal("expected onboarding_required to be false")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
