# Unicode DB Repair Runbook

This runbook applies when storefront text is broken by mojibake.

## Scope
- Tables: `categories`, `products`, `posts`, `pages`, `qna`, `locations`
- Repair migration: `migrations/012_storefront_unicode_repair.sql`
- Migration strategy: additive + idempotent (do not edit historical migration files)

## 1) Start stack
```powershell
cd infra
docker compose up -d mysql api
```

## 2) Pre-check baseline
```powershell
docker compose exec -T mysql mysql -uroot -p"$env:MYSQL_ROOT_PASSWORD" "$env:MYSQL_DATABASE" -e "
SET NAMES utf8mb4;
SET @moji_pattern := CONCAT(CHAR(195 USING utf8mb4), '|', CHAR(196 USING utf8mb4), '|', CHAR(197 USING utf8mb4), '|', CHAR(198 USING utf8mb4), '|', CHAR(194 USING utf8mb4), '|', CHAR(239 USING utf8mb4));
SELECT 'categories' AS t, COUNT(*) AS bad_rows FROM categories WHERE name REGEXP @moji_pattern OR description REGEXP @moji_pattern
UNION ALL
SELECT 'products', COUNT(*) FROM products WHERE name REGEXP @moji_pattern OR description REGEXP @moji_pattern
UNION ALL
SELECT 'posts', COUNT(*) FROM posts WHERE title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern OR content REGEXP @moji_pattern
UNION ALL
SELECT 'pages', COUNT(*) FROM pages WHERE title REGEXP @moji_pattern OR content REGEXP @moji_pattern
UNION ALL
SELECT 'qna', COUNT(*) FROM qna WHERE question REGEXP @moji_pattern OR answer REGEXP @moji_pattern
UNION ALL
SELECT 'locations', COUNT(*) FROM locations WHERE name REGEXP @moji_pattern OR province REGEXP @moji_pattern OR district REGEXP @moji_pattern OR address REGEXP @moji_pattern;
"
```

## 3) Backup text data before repair
```powershell
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path ".\\backup\\unicode-repair-$ts" | Out-Null

docker compose exec -T mysql mysqldump -uroot -p"$env:MYSQL_ROOT_PASSWORD" "$env:MYSQL_DATABASE" `
  categories products posts pages qna locations > ".\\backup\\unicode-repair-$ts\\storefront-text.sql"
```

## 4) Apply migration
The API applies migrations on start when `MIGRATE_ON_START=true`.

```powershell
docker compose restart api
docker compose logs --tail=200 api
```

Confirm `012_storefront_unicode_repair.sql` was applied in logs or `schema_migrations`.

## 5) Verify after apply
- Re-run the baseline query in step 2.
- Spot-check critical slugs:
  - `/collections/all`
  - `/blogs/news`
  - `/pages/about-us`
  - `/pages/locations`

## 6) Rollback (if needed)
```powershell
docker compose exec -T mysql mysql -uroot -p"$env:MYSQL_ROOT_PASSWORD" "$env:MYSQL_DATABASE" < ".\\backup\\unicode-repair-<timestamp>\\storefront-text.sql"
```

## Notes
- Migration engine now validates migration SQL as UTF-8 and fails fast on mojibake markers/control bytes.
- Keep frontend `fixMojibake` guard enabled as a fallback layer.
