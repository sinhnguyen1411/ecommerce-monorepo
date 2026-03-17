package handlers

import (
	"database/sql"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const analyticsScopeStorefrontPublic = "storefront_public"

var analyticsBusinessLocation = time.FixedZone("ICT", 7*60*60)

type analyticsPageViewInput struct {
	Pathname string `json:"pathname"`
}

func normalizeAnalyticsPath(raw string) string {
	value := strings.TrimSpace(raw)
	if value == "" {
		return ""
	}

	if parsed, err := url.Parse(value); err == nil && parsed.Path != "" {
		value = parsed.Path
	}

	if !strings.HasPrefix(value, "/") {
		return ""
	}

	lower := strings.ToLower(value)
	blockedPrefixes := []string{
		"/admin",
		"/api",
		"/_next",
		"/account",
		"/checkout",
		"/cart",
		"/login",
		"/signup",
		"/forgot-password",
		"/complete-profile",
	}

	for _, prefix := range blockedPrefixes {
		if lower == prefix || strings.HasPrefix(lower, prefix+"/") {
			return ""
		}
	}

	return value
}

func (s *Server) TrackPageView(c *gin.Context) {
	var input analyticsPageViewInput
	if !s.bindJSONWithLimit(c, &input, "Invalid analytics payload") {
		return
	}

	pathname := normalizeAnalyticsPath(input.Pathname)
	if pathname == "" {
		respondOK(c, gin.H{"tracked": false})
		return
	}

	now := time.Now().In(analyticsBusinessLocation)
	metricDate := now.Format("2006-01-02")
	visitorHash := hashIdentifier(strings.TrimSpace(c.ClientIP()) + "|" + strings.TrimSpace(c.Request.UserAgent()) + "|" + metricDate)

	tx, err := s.DB.Begin()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to store analytics event")
		return
	}
	defer tx.Rollback()

	uniqueIncrement := 0
	result, err := tx.Exec(`
    INSERT IGNORE INTO analytics_daily_visitors (metric_date, scope, visitor_hash)
    VALUES (?, ?, ?)
  `, metricDate, analyticsScopeStorefrontPublic, visitorHash)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to store analytics event")
		return
	}

	if rowsAffected, err := result.RowsAffected(); err == nil && rowsAffected > 0 {
		uniqueIncrement = 1
	}

	if _, err := tx.Exec(`
    INSERT INTO analytics_daily_metrics (metric_date, scope, pageviews, unique_visitors)
    VALUES (?, ?, 1, ?)
    ON DUPLICATE KEY UPDATE
      pageviews = pageviews + 1,
      unique_visitors = unique_visitors + VALUES(unique_visitors),
      updated_at = CURRENT_TIMESTAMP
  `, metricDate, analyticsScopeStorefrontPublic, uniqueIncrement); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to store analytics event")
		return
	}

	if err := tx.Commit(); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to store analytics event")
		return
	}

	respondOK(c, gin.H{"tracked": true})
}

func scanDailyMetricsRow(rowScanner interface {
	Scan(dest ...any) error
}) (time.Time, int, int, error) {
	var metricDate time.Time
	var pageviews int
	var uniqueVisitors int
	if err := rowScanner.Scan(&metricDate, &pageviews, &uniqueVisitors); err != nil {
		return time.Time{}, 0, 0, err
	}
	return metricDate, pageviews, uniqueVisitors, nil
}

func scanOrderCreatedAt(rowScanner interface {
	Scan(dest ...any) error
}) (time.Time, error) {
	var createdAt sql.NullTime
	if err := rowScanner.Scan(&createdAt); err != nil {
		return time.Time{}, err
	}
	if !createdAt.Valid {
		return time.Time{}, nil
	}
	return createdAt.Time, nil
}
