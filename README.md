# Ecommerce + Blog Monorepo

Simple ecommerce + journal stack using Next.js, Directus, and MySQL with an optional Go API placeholder.

## Structure

- apps/web - Next.js App Router storefront
- apps/api - Go Gin placeholder API
- infra - Docker Compose, env files, nginx template
- docs - Directus setup notes

## Step 1 - Infrastructure (local)

Requirements: Docker Desktop (or Docker Engine + Compose)

Commands (PowerShell):

```
cd infra
docker compose up -d
docker compose ps
```

Test:

```
curl http://localhost:8055/server/ping
```

## Step 2 - Directus setup

1) Open http://localhost:8055 and log in with the admin credentials in infra/env/directus.env.
2) Follow the schema guide in docs/DIRECTUS_SETUP.md.

Test (after enabling public access):

```
curl http://localhost:8055/items/products
```

## Step 3 - Frontend (apps/web)

Commands (PowerShell):

```
cd ..\apps\web
Copy-Item ..\..\infra\env\web.env .\.env.local
npm install
npm run dev
```

Test:

```
curl http://localhost:3000
```

## Step 4 - Go API placeholder (apps/api)

Commands:

```
cd ..\api
go mod tidy
go run .
```

Test:

```
curl http://localhost:8080/healthz
```

## Step 5 - Production readiness

- Review infra/docker-compose.prod.yml and infra/nginx/default.conf.
- See README_DEPLOY.md for environment setup, start/stop, backup/restore, and handover notes.

## Notes

- Products and posts must use status = "published" to appear on the site.
- If you do not enable Public read access in Directus, set NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN in apps/web/.env.local.
