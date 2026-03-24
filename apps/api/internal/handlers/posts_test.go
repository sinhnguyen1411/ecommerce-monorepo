package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
)

type postsPaginatedResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Items      []Post          `json:"items"`
		Pagination PostsPagination `json:"pagination"`
	} `json:"data"`
}

func TestListPostsWithPaginationNoTag(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	now := time.Date(2026, time.March, 17, 9, 0, 0, 0, time.UTC)
	mock.ExpectQuery(`(?s)SELECT COUNT\(\*\).*FROM posts.*WHERE status = 'published'`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(12))
	mock.ExpectQuery(`(?s)SELECT id, title, slug, IFNULL\(excerpt, ''\), IFNULL\(cover_image, ''\), IFNULL\(tags, ''\), published_at.*ORDER BY published_at DESC, id DESC LIMIT \? OFFSET \?`).
		WithArgs(10, 0).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "title", "slug", "excerpt", "cover_image", "tags", "published_at",
		}).
			AddRow(1, "Bai 1", "bai-1", "Mo ta 1", "https://example.com/1.jpg", "mua-vu,canh-tac", now).
			AddRow(2, "Bai 2", "bai-2", "Mo ta 2", "https://example.com/2.jpg", "dat", now.Add(-time.Hour)))

	server := &Server{DB: db}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/posts?page=1&limit=10", nil)

	server.ListPosts(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response postsPaginatedResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got %s", recorder.Body.String())
	}
	if response.Data.Pagination.Page != 1 || response.Data.Pagination.Limit != 10 {
		t.Fatalf("unexpected paging page=%d limit=%d", response.Data.Pagination.Page, response.Data.Pagination.Limit)
	}
	if response.Data.Pagination.TotalItems != 12 || response.Data.Pagination.TotalPages != 2 {
		t.Fatalf("unexpected totals items=%d pages=%d", response.Data.Pagination.TotalItems, response.Data.Pagination.TotalPages)
	}
	if response.Data.Pagination.HasPrev {
		t.Fatal("expected has_prev=false")
	}
	if !response.Data.Pagination.HasNext {
		t.Fatal("expected has_next=true")
	}
	if len(response.Data.Items) != 2 {
		t.Fatalf("expected 2 items, got %d", len(response.Data.Items))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestListPostsWithPaginationTagFilter(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	now := time.Date(2026, time.March, 17, 9, 0, 0, 0, time.UTC)
	mock.ExpectQuery(`(?s)SELECT COUNT\(\*\).*WHERE status = 'published'.*AND tags LIKE \?`).
		WithArgs("%canh-tac%").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(9))
	mock.ExpectQuery(`(?s)SELECT id, title, slug, IFNULL\(excerpt, ''\), IFNULL\(cover_image, ''\), IFNULL\(tags, ''\), published_at.*AND tags LIKE \?.*ORDER BY published_at DESC, id DESC LIMIT \? OFFSET \?`).
		WithArgs("%canh-tac%", 4, 4).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "title", "slug", "excerpt", "cover_image", "tags", "published_at",
		}).AddRow(10, "Bai tag", "bai-tag", "Mo ta", "https://example.com/tag.jpg", "canh-tac", now))

	server := &Server{DB: db}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/posts?tag=canh-tac&page=2&limit=4", nil)

	server.ListPosts(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response postsPaginatedResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Data.Pagination.Page != 2 || response.Data.Pagination.TotalPages != 3 {
		t.Fatalf("unexpected page metadata %+v", response.Data.Pagination)
	}
	if !response.Data.Pagination.HasPrev || !response.Data.Pagination.HasNext {
		t.Fatalf("expected both has_prev and has_next true, got %+v", response.Data.Pagination)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestListPostsWithPaginationClampPage(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	mock.ExpectQuery(`(?s)SELECT COUNT\(\*\).*FROM posts.*WHERE status = 'published'`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(11))
	mock.ExpectQuery(`(?s)SELECT id, title, slug, IFNULL\(excerpt, ''\), IFNULL\(cover_image, ''\), IFNULL\(tags, ''\), published_at.*ORDER BY published_at DESC, id DESC LIMIT \? OFFSET \?`).
		WithArgs(10, 10).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "title", "slug", "excerpt", "cover_image", "tags", "published_at",
		}))

	server := &Server{DB: db}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/posts?page=99&limit=10", nil)

	server.ListPosts(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response postsPaginatedResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Data.Pagination.Page != 2 {
		t.Fatalf("expected clamped page=2, got %d", response.Data.Pagination.Page)
	}
	if !response.Data.Pagination.HasPrev || response.Data.Pagination.HasNext {
		t.Fatalf("unexpected prev/next %+v", response.Data.Pagination)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestListPostsWithPaginationInvalidParamsFallback(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	mock.ExpectQuery(`(?s)SELECT COUNT\(\*\).*FROM posts.*WHERE status = 'published'`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`(?s)SELECT id, title, slug, IFNULL\(excerpt, ''\), IFNULL\(cover_image, ''\), IFNULL\(tags, ''\), published_at.*ORDER BY published_at DESC, id DESC LIMIT \? OFFSET \?`).
		WithArgs(10, 0).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "title", "slug", "excerpt", "cover_image", "tags", "published_at",
		}))

	server := &Server{DB: db}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/posts?page=abc&limit=xyz", nil)

	server.ListPosts(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response postsPaginatedResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if response.Data.Pagination.Page != 1 || response.Data.Pagination.Limit != 10 {
		t.Fatalf("expected fallback page=1 limit=10, got %+v", response.Data.Pagination)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestListPostsWithoutPaginationKeepsArrayResponse(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	now := time.Date(2026, time.March, 17, 9, 0, 0, 0, time.UTC)
	mock.ExpectQuery(`(?s)SELECT id, title, slug, IFNULL\(excerpt, ''\), IFNULL\(cover_image, ''\), IFNULL\(tags, ''\), published_at.*ORDER BY published_at DESC, id DESC`).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "title", "slug", "excerpt", "cover_image", "tags", "published_at",
		}).AddRow(1, "Bai 1", "bai-1", "Mo ta", "https://example.com/1.jpg", "mua-vu", now))

	server := &Server{DB: db}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/posts", nil)

	server.ListPosts(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response struct {
		Success bool   `json:"success"`
		Data    []Post `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got %s", recorder.Body.String())
	}
	if len(response.Data) != 1 {
		t.Fatalf("expected 1 item in array response, got %d", len(response.Data))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
