package handlers

import (
	"database/sql"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type AdminDashboardPoint struct {
	Key            string  `json:"key"`
	Label          string  `json:"label"`
	Orders         int     `json:"orders"`
	PaidRevenue    float64 `json:"paid_revenue"`
	Pageviews      int     `json:"pageviews"`
	UniqueVisitors int     `json:"unique_visitors"`
}

type AdminDashboardSummary struct {
	Orders            int     `json:"orders"`
	PaidRevenue       float64 `json:"paid_revenue"`
	AverageOrderValue float64 `json:"average_order_value"`
	Pageviews         int     `json:"pageviews"`
	UniqueVisitors    int     `json:"unique_visitors"`
}

type AdminDashboardStatusTotal struct {
	Status string `json:"status"`
	Count  int    `json:"count"`
}

type AdminDashboardTopProduct struct {
	ProductID    int     `json:"product_id"`
	ProductName  string  `json:"product_name"`
	QuantitySold int     `json:"quantity_sold"`
	Revenue      float64 `json:"revenue"`
}

type AdminDashboardRecentOrder struct {
	ID            int     `json:"id"`
	OrderNumber   string  `json:"order_number"`
	CustomerName  string  `json:"customer_name"`
	Total         float64 `json:"total"`
	Status        string  `json:"status"`
	PaymentStatus string  `json:"payment_status"`
	CreatedAt     string  `json:"created_at"`
}

type AdminDashboardResponse struct {
	Grain               string                      `json:"grain"`
	RangeLabel          string                      `json:"range_label"`
	Summary             AdminDashboardSummary       `json:"summary"`
	Series              []AdminDashboardPoint       `json:"series"`
	OrderStatusTotals   []AdminDashboardStatusTotal `json:"order_status_totals"`
	PaymentStatusTotals []AdminDashboardStatusTotal `json:"payment_status_totals"`
	TopProducts         []AdminDashboardTopProduct  `json:"top_products"`
	RecentOrders        []AdminDashboardRecentOrder `json:"recent_orders"`
}

type dashboardBucket struct {
	Key   string
	Label string
	Start time.Time
}

func normalizeDashboardGrain(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "month":
		return "month"
	case "year":
		return "year"
	default:
		return "day"
	}
}

func bucketKeyForTime(value time.Time, grain string) string {
	localValue := value.In(analyticsBusinessLocation)
	switch grain {
	case "month":
		return localValue.Format("2006-01")
	case "year":
		return localValue.Format("2006")
	default:
		return localValue.Format("2006-01-02")
	}
}

func buildDashboardBuckets(now time.Time, grain string) ([]dashboardBucket, string, time.Time) {
	base := now.In(analyticsBusinessLocation)

	switch grain {
	case "month":
		firstMonth := time.Date(base.Year(), base.Month(), 1, 0, 0, 0, 0, analyticsBusinessLocation).AddDate(0, -11, 0)
		buckets := make([]dashboardBucket, 0, 12)
		for index := 0; index < 12; index++ {
			current := firstMonth.AddDate(0, index, 0)
			buckets = append(buckets, dashboardBucket{
				Key:   current.Format("2006-01"),
				Label: current.Format("01/2006"),
				Start: current,
			})
		}
		return buckets, "12 thang gan nhat", firstMonth
	case "year":
		firstYear := time.Date(base.Year()-4, 1, 1, 0, 0, 0, 0, analyticsBusinessLocation)
		buckets := make([]dashboardBucket, 0, 5)
		for index := 0; index < 5; index++ {
			current := firstYear.AddDate(index, 0, 0)
			buckets = append(buckets, dashboardBucket{
				Key:   current.Format("2006"),
				Label: current.Format("2006"),
				Start: current,
			})
		}
		return buckets, "5 nam gan nhat", firstYear
	default:
		firstDay := time.Date(base.Year(), base.Month(), base.Day(), 0, 0, 0, 0, analyticsBusinessLocation).AddDate(0, 0, -29)
		buckets := make([]dashboardBucket, 0, 30)
		for index := 0; index < 30; index++ {
			current := firstDay.AddDate(0, 0, index)
			buckets = append(buckets, dashboardBucket{
				Key:   current.Format("2006-01-02"),
				Label: current.Format("02/01"),
				Start: current,
			})
		}
		return buckets, "30 ngay gan nhat", firstDay
	}
}

func (s *Server) loadDashboardOrderSeries(windowStart time.Time, grain string) (map[string]int, map[string]float64, int, float64, error) {
	rows, err := s.DB.Query(`
    SELECT created_at, total, IFNULL(payment_status, 'pending')
    FROM orders
    WHERE created_at >= ?
    ORDER BY created_at ASC
  `, windowStart)
	if err != nil {
		return nil, nil, 0, 0, err
	}
	defer rows.Close()

	counts := make(map[string]int)
	paidRevenueByBucket := make(map[string]float64)
	paidOrderCount := 0
	totalPaidRevenue := 0.0

	for rows.Next() {
		createdAt, orderTotal, paymentStatus, err := scanDashboardOrderSeriesRow(rows)
		if err != nil {
			return nil, nil, 0, 0, err
		}
		if createdAt.IsZero() {
			continue
		}
		key := bucketKeyForTime(createdAt, grain)
		counts[key]++

		if strings.EqualFold(strings.TrimSpace(paymentStatus), "paid") {
			paidRevenueByBucket[key] += orderTotal
			totalPaidRevenue += orderTotal
			paidOrderCount++
		}
	}

	if err := rows.Err(); err != nil {
		return nil, nil, 0, 0, err
	}
	return counts, paidRevenueByBucket, paidOrderCount, totalPaidRevenue, nil
}

func (s *Server) loadDashboardVisitCounts(windowStart time.Time, grain string) (map[string]int, map[string]int, error) {
	rows, err := s.DB.Query(`
    SELECT metric_date, pageviews, unique_visitors
    FROM analytics_daily_metrics
    WHERE scope = ? AND metric_date >= ?
    ORDER BY metric_date ASC
  `, analyticsScopeStorefrontPublic, windowStart.Format("2006-01-02"))
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	pageviews := make(map[string]int)
	uniqueVisitors := make(map[string]int)
	for rows.Next() {
		metricDate, metricPageviews, metricUniqueVisitors, err := scanDailyMetricsRow(rows)
		if err != nil {
			return nil, nil, err
		}
		key := bucketKeyForTime(metricDate, grain)
		pageviews[key] += metricPageviews
		uniqueVisitors[key] += metricUniqueVisitors
	}

	if err := rows.Err(); err != nil {
		return nil, nil, err
	}
	return pageviews, uniqueVisitors, nil
}

func (s *Server) loadDashboardStatusTotals(column string) ([]AdminDashboardStatusTotal, error) {
	var query string
	switch column {
	case "status":
		query = `
      SELECT IFNULL(status, 'unknown') AS status_value, COUNT(*) AS total
      FROM orders
      GROUP BY IFNULL(status, 'unknown')
      ORDER BY total DESC, status_value ASC
    `
	case "payment_status":
		query = `
      SELECT IFNULL(payment_status, 'pending') AS status_value, COUNT(*) AS total
      FROM orders
      GROUP BY IFNULL(payment_status, 'pending')
      ORDER BY total DESC, status_value ASC
    `
	default:
		return []AdminDashboardStatusTotal{}, nil
	}

	rows, err := s.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	totals := make([]AdminDashboardStatusTotal, 0)
	for rows.Next() {
		var item AdminDashboardStatusTotal
		if err := rows.Scan(&item.Status, &item.Count); err != nil {
			return nil, err
		}
		totals = append(totals, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return totals, nil
}

func (s *Server) loadDashboardTopProducts(windowStart time.Time, limit int) ([]AdminDashboardTopProduct, error) {
	rows, err := s.DB.Query(`
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
  `, windowStart, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AdminDashboardTopProduct, 0, limit)
	for rows.Next() {
		var item AdminDashboardTopProduct
		var revenue sql.NullFloat64
		if err := rows.Scan(&item.ProductID, &item.ProductName, &item.QuantitySold, &revenue); err != nil {
			return nil, err
		}
		if revenue.Valid {
			item.Revenue = revenue.Float64
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func (s *Server) loadDashboardRecentOrders(limit int) ([]AdminDashboardRecentOrder, error) {
	rows, err := s.DB.Query(`
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
  `, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AdminDashboardRecentOrder, 0, limit)
	for rows.Next() {
		var item AdminDashboardRecentOrder
		var createdAt sql.NullTime
		var total sql.NullFloat64
		if err := rows.Scan(
			&item.ID,
			&item.OrderNumber,
			&item.CustomerName,
			&total,
			&item.Status,
			&item.PaymentStatus,
			&createdAt,
		); err != nil {
			return nil, err
		}
		if total.Valid {
			item.Total = total.Float64
		}
		if createdAt.Valid {
			item.CreatedAt = createdAt.Time.In(analyticsBusinessLocation).Format(time.RFC3339)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func (s *Server) AdminDashboard(c *gin.Context) {
	grain := normalizeDashboardGrain(c.Query("grain"))
	buckets, rangeLabel, windowStart := buildDashboardBuckets(time.Now(), grain)

	orderCounts, paidRevenueByBucket, paidOrderCount, totalPaidRevenue, err := s.loadDashboardOrderSeries(windowStart, grain)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load dashboard orders")
		return
	}

	pageviewsByBucket, uniqueVisitorsByBucket, err := s.loadDashboardVisitCounts(windowStart, grain)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load dashboard traffic")
		return
	}

	orderStatusTotals, err := s.loadDashboardStatusTotals("status")
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load dashboard order status")
		return
	}

	paymentStatusTotals, err := s.loadDashboardStatusTotals("payment_status")
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load dashboard payment status")
		return
	}

	topProducts, err := s.loadDashboardTopProducts(windowStart, 5)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load dashboard top products")
		return
	}

	recentOrders, err := s.loadDashboardRecentOrders(6)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load dashboard recent orders")
		return
	}

	series := make([]AdminDashboardPoint, 0, len(buckets))
	summary := AdminDashboardSummary{}
	for _, bucket := range buckets {
		point := AdminDashboardPoint{
			Key:            bucket.Key,
			Label:          bucket.Label,
			Orders:         orderCounts[bucket.Key],
			PaidRevenue:    paidRevenueByBucket[bucket.Key],
			Pageviews:      pageviewsByBucket[bucket.Key],
			UniqueVisitors: uniqueVisitorsByBucket[bucket.Key],
		}
		summary.Orders += point.Orders
		summary.PaidRevenue += point.PaidRevenue
		summary.Pageviews += point.Pageviews
		summary.UniqueVisitors += point.UniqueVisitors
		series = append(series, point)
	}
	if paidOrderCount > 0 {
		summary.AverageOrderValue = totalPaidRevenue / float64(paidOrderCount)
	}

	respondOK(c, AdminDashboardResponse{
		Grain:               grain,
		RangeLabel:          rangeLabel,
		Summary:             summary,
		Series:              series,
		OrderStatusTotals:   orderStatusTotals,
		PaymentStatusTotals: paymentStatusTotals,
		TopProducts:         topProducts,
		RecentOrders:        recentOrders,
	})
}

func scanDashboardOrderSeriesRow(rowScanner interface {
	Scan(dest ...any) error
}) (time.Time, float64, string, error) {
	var createdAt sql.NullTime
	var total sql.NullFloat64
	var paymentStatus string
	if err := rowScanner.Scan(&createdAt, &total, &paymentStatus); err != nil {
		return time.Time{}, 0, "", err
	}
	if !createdAt.Valid {
		return time.Time{}, 0, paymentStatus, nil
	}
	if !total.Valid {
		return createdAt.Time, 0, paymentStatus, nil
	}
	return createdAt.Time, total.Float64, paymentStatus, nil
}
