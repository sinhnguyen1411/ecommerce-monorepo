package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
)

func TestAdminUpdatePageSaveModeDraft(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	mock.ExpectExec(regexp.QuoteMeta(`
    UPDATE pages
    SET title = ?, slug = ?, draft_content = ?
    WHERE id = ?
  `)).
		WithArgs("Trang chủ", "home", `{"intro":{"headline":"Draft headline"}}`, 9).
		WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectQuery(regexp.QuoteMeta(`
    SELECT id, title, slug, IFNULL(content, ''), IFNULL(draft_content, ''), updated_at
    FROM pages WHERE id = ?
  `)).
		WithArgs(9).
		WillReturnRows(sqlmock.NewRows([]string{
			"id",
			"title",
			"slug",
			"content",
			"draft_content",
			"updated_at",
		}).AddRow(
			9,
			"Trang chủ",
			"home",
			`{"intro":{"headline":"Published headline"}}`,
			`{"intro":{"headline":"Draft headline"}}`,
			"2026-03-24 10:00:00",
		))

	server := &Server{DB: db}
	body := []byte(`{"title":"Trang chủ","slug":"home","content":"{\"intro\":{\"headline\":\"Draft headline\"}}","save_mode":"draft"}`)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = gin.Params{{Key: "id", Value: "9"}}
	ctx.Request = httptest.NewRequest(http.MethodPatch, "/api/admin/pages/9", bytes.NewReader(body))
	ctx.Request.Header.Set("Content-Type", "application/json")

	server.AdminUpdatePage(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response struct {
		Success bool `json:"success"`
		Data    struct {
			Content      string `json:"content"`
			DraftContent string `json:"draft_content"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got %s", recorder.Body.String())
	}
	if response.Data.Content != `{"intro":{"headline":"Published headline"}}` {
		t.Fatalf("expected published content unchanged, got %s", response.Data.Content)
	}
	if response.Data.DraftContent != `{"intro":{"headline":"Draft headline"}}` {
		t.Fatalf("expected draft content updated, got %s", response.Data.DraftContent)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestAdminUpdatePageSaveModePublish(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	mock.ExpectExec(regexp.QuoteMeta(`
    UPDATE pages
    SET title = ?, slug = ?, content = ?, draft_content = ?
    WHERE id = ?
  `)).
		WithArgs(
			"Trang chủ",
			"home",
			`{"intro":{"headline":"Published now"}}`,
			`{"intro":{"headline":"Published now"}}`,
			9,
		).
		WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectQuery(regexp.QuoteMeta(`
    SELECT id, title, slug, IFNULL(content, ''), IFNULL(draft_content, ''), updated_at
    FROM pages WHERE id = ?
  `)).
		WithArgs(9).
		WillReturnRows(sqlmock.NewRows([]string{
			"id",
			"title",
			"slug",
			"content",
			"draft_content",
			"updated_at",
		}).AddRow(
			9,
			"Trang chủ",
			"home",
			`{"intro":{"headline":"Published now"}}`,
			`{"intro":{"headline":"Published now"}}`,
			"2026-03-24 10:00:00",
		))

	server := &Server{DB: db}
	body := []byte(`{"title":"Trang chủ","slug":"home","content":"{\"intro\":{\"headline\":\"Published now\"}}","save_mode":"publish"}`)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = gin.Params{{Key: "id", Value: "9"}}
	ctx.Request = httptest.NewRequest(http.MethodPatch, "/api/admin/pages/9", bytes.NewReader(body))
	ctx.Request.Header.Set("Content-Type", "application/json")

	server.AdminUpdatePage(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response struct {
		Success bool `json:"success"`
		Data    struct {
			Content      string `json:"content"`
			DraftContent string `json:"draft_content"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got %s", recorder.Body.String())
	}
	if response.Data.Content != `{"intro":{"headline":"Published now"}}` {
		t.Fatalf("expected published content updated, got %s", response.Data.Content)
	}
	if response.Data.DraftContent != `{"intro":{"headline":"Published now"}}` {
		t.Fatalf("expected draft content synchronized, got %s", response.Data.DraftContent)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestAdminUpdatePageDefaultSaveModePublish(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	mock.ExpectExec(regexp.QuoteMeta(`
    UPDATE pages
    SET title = ?, slug = ?, content = ?, draft_content = ?
    WHERE id = ?
  `)).
		WithArgs("Trang chủ", "home", `{"content":"next"}`, `{"content":"next"}`, 2).
		WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectQuery(regexp.QuoteMeta(`
    SELECT id, title, slug, IFNULL(content, ''), IFNULL(draft_content, ''), updated_at
    FROM pages WHERE id = ?
  `)).
		WithArgs(2).
		WillReturnRows(sqlmock.NewRows([]string{
			"id",
			"title",
			"slug",
			"content",
			"draft_content",
			"updated_at",
		}).AddRow(2, "Trang chủ", "home", `{"content":"next"}`, `{"content":"next"}`, "2026-03-24 10:00:00"))

	server := &Server{DB: db}
	body := []byte(`{"title":"Trang chủ","slug":"home","content":"{\"content\":\"next\"}"}`)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = gin.Params{{Key: "id", Value: "2"}}
	ctx.Request = httptest.NewRequest(http.MethodPatch, "/api/admin/pages/2", bytes.NewReader(body))
	ctx.Request.Header.Set("Content-Type", "application/json")

	server.AdminUpdatePage(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
