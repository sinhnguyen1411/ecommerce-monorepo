SET @has_draft_content := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'pages'
    AND column_name = 'draft_content'
);

SET @sql := IF(
  @has_draft_content = 0,
  'ALTER TABLE pages ADD COLUMN draft_content LONGTEXT NULL AFTER content',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

