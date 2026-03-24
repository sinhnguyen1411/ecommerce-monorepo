package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
)

func TestAdminUpdateOrderRejectsInvalidOrderStatus(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = gin.Params{{Key: "id", Value: "22"}}
	ctx.Request = httptest.NewRequest(
		http.MethodPatch,
		"/api/admin/orders/22",
		strings.NewReader(`{"status":"unknown_status","payment_status":"pending"}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server := &Server{}
	server.AdminUpdateOrder(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, recorder.Code)
	}

	var response APIResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Error == nil || response.Error.Code != "invalid_status" {
		t.Fatalf("expected invalid_status error, got %#v", response.Error)
	}
}

func TestAdminUpdateOrderRejectsInvalidPaymentStatus(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = gin.Params{{Key: "id", Value: "22"}}
	ctx.Request = httptest.NewRequest(
		http.MethodPatch,
		"/api/admin/orders/22",
		strings.NewReader(`{"status":"pending","payment_status":"weird"}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server := &Server{}
	server.AdminUpdateOrder(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, recorder.Code)
	}

	var response APIResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Error == nil || response.Error.Code != "invalid_status" {
		t.Fatalf("expected invalid_status error, got %#v", response.Error)
	}
}

func TestUpdateUserOrderRejectsWhenNotPending(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT IFNULL(status, 'pending') FROM orders WHERE id = ? AND user_id = ?`)).
		WithArgs(10, 7).
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("confirmed"))

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = gin.Params{{Key: "id", Value: "10"}}
	ctx.Set("user_id", 7)
	ctx.Request = httptest.NewRequest(
		http.MethodPatch,
		"/api/account/orders/10",
		strings.NewReader(`{"note":"Giao sau 18h"}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server := &Server{DB: db}
	server.UpdateUserOrder(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusBadRequest, recorder.Code, recorder.Body.String())
	}

	var response APIResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Error == nil || response.Error.Code != "order_locked" {
		t.Fatalf("expected order_locked error, got %#v", response.Error)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestUpdateUserOrderOwnerOnlyNotFound(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT IFNULL(status, 'pending') FROM orders WHERE id = ? AND user_id = ?`)).
		WithArgs(10, 7).
		WillReturnError(sql.ErrNoRows)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = gin.Params{{Key: "id", Value: "10"}}
	ctx.Set("user_id", 7)
	ctx.Request = httptest.NewRequest(
		http.MethodPatch,
		"/api/account/orders/10",
		strings.NewReader(`{"note":"abc"}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	server := &Server{DB: db}
	server.UpdateUserOrder(ctx)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusNotFound, recorder.Code, recorder.Body.String())
	}

	var response APIResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Error == nil || response.Error.Code != "not_found" {
		t.Fatalf("expected not_found error, got %#v", response.Error)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
