SET @has_ui_preferences_json := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'admin_users'
    AND column_name = 'ui_preferences_json'
);

SET @sql := IF(
  @has_ui_preferences_json = 0,
  'ALTER TABLE admin_users ADD COLUMN ui_preferences_json JSON NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
