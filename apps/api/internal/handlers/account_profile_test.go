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
)

func TestUpdateProfileUpdatesNameAndBirthdate(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	mock.ExpectExec(regexp.QuoteMeta(`UPDATE users SET full_name = ?, phone_e164 = ?, phone_national = ?, birthdate = ? WHERE id = ?`)).
		WithArgs("Buyer Updated", "+84900000002", "0900000002", sqlmock.AnyArg(), 42).
		WillReturnResult(sqlmock.NewResult(0, 1))

	userQuery := regexp.QuoteMeta(`
    SELECT id, email, phone_e164, phone_national, full_name, avatar_url, address, birthdate,
           is_email_verified, is_phone_verified, status, password_hash, failed_login_attempts, locked_until,
           onboarding_completed_at
    FROM users
    WHERE id = ?
  `)
	mock.ExpectQuery(userQuery).
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
			"+84900000002",
			"0900000002",
			"Buyer Updated",
			nil,
			nil,
			time.Date(2000, time.January, 2, 0, 0, 0, 0, time.UTC),
			true,
			false,
			"active",
			"argon2id$hash",
			0,
			nil,
			time.Now(),
		))

	server := &Server{DB: db}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("user_id", 42)
	ctx.Request = httptest.NewRequest(
		http.MethodPatch,
		"/api/account/profile",
		strings.NewReader(`{"name":"Buyer Updated","phone":"0900000002","birthdate":"2000-01-02"}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server.UpdateProfile(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response struct {
		Success bool `json:"success"`
		Data    struct {
			Name      string `json:"name"`
			Birthdate string `json:"birthdate"`
		} `json:"data"`
		Error *APIError `json:"error"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got %#v", response.Error)
	}
	if response.Data.Name != "Buyer Updated" {
		t.Fatalf("expected updated name, got %q", response.Data.Name)
	}
	if response.Data.Birthdate != "2000-01-02" {
		t.Fatalf("expected updated birthdate, got %q", response.Data.Birthdate)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestUpdateProfileRejectsInvalidBirthdate(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	server := &Server{}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("user_id", 42)
	ctx.Request = httptest.NewRequest(
		http.MethodPatch,
		"/api/account/profile",
		strings.NewReader(`{"name":"Buyer Demo","birthdate":"2000-31-99"}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server.UpdateProfile(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusBadRequest, recorder.Code, recorder.Body.String())
	}

	var response APIResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Error == nil || response.Error.Code != "invalid_birthdate" {
		t.Fatalf("expected invalid_birthdate error, got %#v", response.Error)
	}
}

func TestUpdateProfileRejectsUnderageBirthdate(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	underageBirthdate := time.Now().AddDate(-10, 0, 0).Format("2006-01-02")
	server := &Server{}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("user_id", 42)
	ctx.Request = httptest.NewRequest(
		http.MethodPatch,
		"/api/account/profile",
		strings.NewReader(`{"name":"Buyer Demo","birthdate":"`+underageBirthdate+`"}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server.UpdateProfile(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusBadRequest, recorder.Code, recorder.Body.String())
	}

	var response APIResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Error == nil || response.Error.Code != "invalid_birthdate" {
		t.Fatalf("expected invalid_birthdate error, got %#v", response.Error)
	}
}

func TestUpdateProfileRejectsInvalidPhone(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	server := &Server{}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("user_id", 42)
	ctx.Request = httptest.NewRequest(
		http.MethodPatch,
		"/api/account/profile",
		strings.NewReader(`{"name":"Buyer Demo","phone":"123"}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server.UpdateProfile(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusBadRequest, recorder.Code, recorder.Body.String())
	}

	var response APIResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Error == nil || response.Error.Code != "invalid_phone" {
		t.Fatalf("expected invalid_phone error, got %#v", response.Error)
	}
}
