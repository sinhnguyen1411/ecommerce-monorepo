# Deployment Guide (VPS)

This is a production template. Update secrets, domains, and credentials before launch.

## Environment setup

1) Copy env templates and update values:

```
Copy-Item infra\env\mysql.env.example infra\env\mysql.env
Copy-Item infra\env\api.env.example infra\env\api.env
Copy-Item infra\env\web.env.example infra\env\web.env
```

2) Update these fields:
- mysql.env: MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD
- api.env: JWT_SECRET, PUBLIC_BASE_URL (your domain), ALLOWED_ORIGINS
- web.env: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL, API_INTERNAL_URL

PUBLIC_BASE_URL should match the public API base so image URLs resolve correctly.

Note: NEXT_PUBLIC_* values are baked into the Next.js build. Rebuild the web image after changes.

## Start and stop

```
docker compose --env-file infra\env\web.env -f infra\docker-compose.prod.yml up -d --build
```

```
docker compose -f infra\docker-compose.prod.yml ps
```

```
docker compose -f infra\docker-compose.prod.yml down
```

## Nginx and SSL

1) Update server_name in infra/nginx/default.conf.
2) Use Certbot or your SSL provider to enable HTTPS.

## Backup and restore (MySQL)

Backup:

```
docker exec ttc_mysql mysqldump -u root -pYOUR_ROOT_PASSWORD ttc > backup.sql
```

Restore:

```
Get-Content backup.sql | docker exec -i ttc_mysql mysql -u root -pYOUR_ROOT_PASSWORD ttc
```
