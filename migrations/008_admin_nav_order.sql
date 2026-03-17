SET @has_nav_order_json := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'admin_users'
    AND column_name = 'nav_order_json'
);

SET @sql := IF(
  @has_nav_order_json = 0,
  'ALTER TABLE admin_users ADD COLUMN nav_order_json JSON NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
