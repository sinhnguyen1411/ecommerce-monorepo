# Deployment Guide

This is a production template intended for handover. Adjust domains, secrets, and credentials before launch.

## Environment setup

1) Copy env templates and update values:

```
Copy-Item infra\env\mysql.env.example infra\env\mysql.env
Copy-Item infra\env\directus.env.example infra\env\directus.env
Copy-Item infra\env\web.env.example infra\env\web.env
```

2) Update these fields:
- mysql.env: MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD
- directus.env: KEY, SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, PUBLIC_URL
- web.env: NEXT_PUBLIC_DIRECTUS_URL (public URL of Directus)

Note: NEXT_PUBLIC_* values are baked into the Next.js build. Rebuild the web image after changes.

## Start and stop

Build and start:

```
docker compose --env-file infra\env\web.env -f infra\docker-compose.prod.yml up -d --build
```

Check status:

```
docker compose -f infra\docker-compose.prod.yml ps
```

Stop:

```
docker compose -f infra\docker-compose.prod.yml down
```

## Backup and restore (MySQL)

Backup:

```
docker exec ecommerce_mysql mysqldump -u root -pYOUR_ROOT_PASSWORD directus > backup.sql
```

Restore:

```
Get-Content backup.sql | docker exec -i ecommerce_mysql mysql -u root -pYOUR_ROOT_PASSWORD directus
```

## Client handover notes

- Directus is the single source of truth for products and posts.
- Set status = "published" for records you want visible on the site.
- Use product_images.sort to control gallery order.
- Cover images and product images are managed in the Directus Files library.
- Rotate the Directus admin password and update env files after handover.
