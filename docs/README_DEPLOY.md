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
- api.env: JWT_SECRET, PUBLIC_BASE_URL (your domain), ALLOWED_ORIGINS, FRONTEND_BASE_URL
- web.env: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL, API_INTERNAL_URL

PUBLIC_BASE_URL should match the public API base so image URLs resolve correctly.
FRONTEND_BASE_URL should match the public web domain for OAuth redirects.

Note: NEXT_PUBLIC_* values are baked into the Next.js build. Rebuild the web image after changes.

## Google OAuth

Set the following in `infra/env/api.env`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://your-domain.com/api/auth/google/callback
```

Make sure the redirect URL is registered in Google Cloud Console.

## Admin account

Seeded admin is only created on first seed. If you need a new admin:

```
INSERT INTO admin_users (email, password_hash, name, role)
VALUES ('admin@yourdomain.com', '<bcrypt_hash>', 'Admin', 'admin');
```

Use bcrypt to generate the password hash.

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

## Admin access

- Admin login URL: `https://your-domain.com/admin/login`
- Create admin users directly in MySQL (see Admin account section above).

## Backup and restore (MySQL)

Backup:

```
docker exec ttc_mysql mysqldump -u root -pYOUR_ROOT_PASSWORD ttc > backup.sql
```

Restore:

```
Get-Content backup.sql | docker exec -i ttc_mysql mysql -u root -pYOUR_ROOT_PASSWORD ttc
```
