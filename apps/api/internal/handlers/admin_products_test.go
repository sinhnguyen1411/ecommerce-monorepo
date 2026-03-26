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

func TestAdminReplaceProductImages(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	mock.ExpectBegin()
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT id FROM product_images WHERE product_id = ?`)).
		WithArgs(15).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(11).AddRow(12).AddRow(13))
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE product_images SET url = ?, sort_order = ? WHERE id = ? AND product_id = ?`)).
		WithArgs("https://cdn.example.com/second.jpg", 0, 12, 15).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE product_images SET url = ?, sort_order = ? WHERE id = ? AND product_id = ?`)).
		WithArgs("https://cdn.example.com/first.jpg", 1, 11, 15).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)`)).
		WithArgs(15, "https://cdn.example.com/new.jpg", 2).
		WillReturnResult(sqlmock.NewResult(21, 1))
	mock.ExpectExec(regexp.QuoteMeta(`DELETE FROM product_images WHERE id = ? AND product_id = ?`)).
		WithArgs(13, 15).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	mock.ExpectQuery(regexp.QuoteMeta(`
    SELECT id, name, slug, IFNULL(description, ''), price, compare_at_price, featured, status, IFNULL(tags, ''), sort_order
    FROM products
    WHERE id = ?
  `)).
		WithArgs(15).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "slug", "description", "price", "compare_at_price", "featured", "status", "tags", "sort_order",
		}).AddRow(15, "Product A", "product-a", "Mo ta", 100000, nil, false, "published", "tag", 1))
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT id, product_id, url, sort_order FROM product_images WHERE product_id IN (15) ORDER BY sort_order ASC`)).
		WillReturnRows(sqlmock.NewRows([]string{"id", "product_id", "url", "sort_order"}).
			AddRow(12, 15, "https://cdn.example.com/second.jpg", 0).
			AddRow(11, 15, "https://cdn.example.com/first.jpg", 1).
			AddRow(21, 15, "https://cdn.example.com/new.jpg", 2))
	mock.ExpectQuery(regexp.QuoteMeta(`
    SELECT pc.product_id, c.id, c.name, c.slug
    FROM product_categories pc
    JOIN categories c ON pc.category_id = c.id
    WHERE pc.product_id IN (15)
    ORDER BY c.sort_order ASC
  `)).
		WillReturnRows(sqlmock.NewRows([]string{"product_id", "id", "name", "slug"}).AddRow(15, 3, "Category A", "category-a"))

	server := &Server{DB: db}
	body := []byte(`{"images":[{"id":12,"url":"https://cdn.example.com/second.jpg"},{"id":11,"url":"https://cdn.example.com/first.jpg"},{"url":"https://cdn.example.com/new.jpg"}]}`)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = gin.Params{{Key: "id", Value: "15"}}
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/admin/products/15/images", bytes.NewReader(body))
	ctx.Request.Header.Set("Content-Type", "application/json")

	server.AdminReplaceProductImages(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response struct {
		Success bool         `json:"success"`
		Data    AdminProduct `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got %s", recorder.Body.String())
	}
	if len(response.Data.Images) != 3 {
		t.Fatalf("expected 3 images, got %d", len(response.Data.Images))
	}
	if response.Data.Images[0].ID != 12 || response.Data.Images[0].SortOrder != 0 {
		t.Fatalf("expected first image to be reordered, got %+v", response.Data.Images[0])
	}
	if response.Data.Images[2].ID != 21 || response.Data.Images[2].SortOrder != 2 {
		t.Fatalf("expected inserted image at index 2, got %+v", response.Data.Images[2])
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

