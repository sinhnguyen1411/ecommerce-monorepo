CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
  metric_date DATE NOT NULL,
  scope VARCHAR(64) NOT NULL,
  pageviews INT UNSIGNED NOT NULL DEFAULT 0,
  unique_visitors INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (scope, metric_date)
);

CREATE TABLE IF NOT EXISTS analytics_daily_visitors (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  metric_date DATE NOT NULL,
  scope VARCHAR(64) NOT NULL,
  visitor_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_analytics_daily_visitor (metric_date, scope, visitor_hash),
  KEY idx_analytics_daily_visitor_scope_date (scope, metric_date)
);
