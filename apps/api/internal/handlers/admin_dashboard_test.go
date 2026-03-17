package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
)

func TestAdminDashboardReturnsExtendedPayload(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	now := time.Date(2026, time.March, 16, 10, 0, 0, 0, analyticsBusinessLocation)
	mock.ExpectQuery(regexp.QuoteMeta(`
    SELECT created_at, total, IFNULL(payment_status, 'pending')
    FROM orders
    WHERE created_at >= ?
    ORDER BY created_at ASC
  `)).
		WithArgs(sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"created_at", "total", "payment_status"}).
			AddRow(now, 120000.0, "paid").
			AddRow(now.Add(1*time.Hour), 90000.0, "pending"))

	mock.ExpectQuery(regexp.QuoteMeta(`
    SELECT metric_date, pageviews, unique_visitors
    FROM analytics_daily_metrics
    WHERE scope = ? AND metric_date >= ?
    ORDER BY metric_date ASC
  `)).
		WithArgs(analyticsScopeStorefrontPublic, sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"metric_date", "pageviews", "unique_visitors"}).
			AddRow(now, 220, 88))

	mock.ExpectQuery(regexp.QuoteMeta(`
      SELECT IFNULL(status, 'unknown') AS status_value, COUNT(*) AS total
      FROM orders
      GROUP BY IFNULL(status, 'unknown')
      ORDER BY total DESC, status_value ASC
    `)).
		WillReturnRows(sqlmock.NewRows([]string{"status_value", "total"}).
			AddRow("pending", 4).
			AddRow("completed", 9))

	mock.ExpectQuery(regexp.QuoteMeta(`
      SELECT IFNULL(payment_status, 'pending') AS status_value, COUNT(*) AS total
      FROM orders
      GROUP BY IFNULL(payment_status, 'pending')
      ORDER BY total DESC, status_value ASC
    `)).
		WillReturnRows(sqlmock.NewRows([]string{"status_value", "total"}).
			AddRow("paid", 8).
			AddRow("pending", 3))

	mock.ExpectQuery(regexp.QuoteMeta(`
    SELECT
      oi.product_id,
      IFNULL(oi.product_name, ''),
      COALESCE(SUM(oi.quantity), 0) AS quantity_sold,
      COALESCE(SUM(oi.line_total), 0) AS revenue
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at >= ?
      AND LOWER(IFNULL(o.status, '')) <> 'cancelled'
    GROUP BY oi.product_id, IFNULL(oi.product_name, '')
    ORDER BY quantity_sold DESC, revenue DESC, oi.product_id ASC
    LIMIT ?
  `)).
		WithArgs(sqlmock.AnyArg(), 5).
		WillReturnRows(sqlmock.NewRows([]string{"product_id", "product_name", "quantity_sold", "revenue"}).
			AddRow(10, "Phan huu co", 22, 1320000.0))

	mock.ExpectQuery(regexp.QuoteMeta(`
    SELECT
      id,
      order_number,
      IFNULL(customer_name, ''),
      total,
      IFNULL(status, 'pending'),
      IFNULL(payment_status, 'pending'),
      created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT ?
  `)).
		WithArgs(6).
		WillReturnRows(sqlmock.NewRows([]string{
			"id",
			"order_number",
			"customer_name",
			"total",
			"status",
			"payment_status",
			"created_at",
		}).AddRow(55, "TB000055", "Buyer Demo", 210000.0, "pending", "proof_submitted", now))

	server := &Server{DB: db}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/admin/dashboard?grain=day", nil)

	server.AdminDashboard(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d body=%s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var response struct {
		Success bool `json:"success"`
		Data    struct {
			Grain   string `json:"grain"`
			Summary struct {
				Orders            int     `json:"orders"`
				PaidRevenue       float64 `json:"paid_revenue"`
				AverageOrderValue float64 `json:"average_order_value"`
			} `json:"summary"`
			OrderStatusTotals   []AdminDashboardStatusTotal `json:"order_status_totals"`
			PaymentStatusTotals []AdminDashboardStatusTotal `json:"payment_status_totals"`
			TopProducts         []AdminDashboardTopProduct  `json:"top_products"`
			RecentOrders        []AdminDashboardRecentOrder `json:"recent_orders"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response: %s", recorder.Body.String())
	}
	if response.Data.Grain != "day" {
		t.Fatalf("expected grain=day, got %q", response.Data.Grain)
	}
	if response.Data.Summary.PaidRevenue <= 0 {
		t.Fatalf("expected paid_revenue > 0, got %f", response.Data.Summary.PaidRevenue)
	}
	if response.Data.Summary.AverageOrderValue <= 0 {
		t.Fatalf("expected average_order_value > 0, got %f", response.Data.Summary.AverageOrderValue)
	}
	if len(response.Data.OrderStatusTotals) == 0 || len(response.Data.PaymentStatusTotals) == 0 {
		t.Fatalf("expected status totals, got order=%d payment=%d", len(response.Data.OrderStatusTotals), len(response.Data.PaymentStatusTotals))
	}
	if len(response.Data.TopProducts) == 0 {
		t.Fatal("expected top products in response")
	}
	if len(response.Data.RecentOrders) == 0 {
		t.Fatal("expected recent orders in response")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
