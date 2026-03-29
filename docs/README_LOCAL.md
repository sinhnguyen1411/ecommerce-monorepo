# Local Development

This monorepo runs MySQL, the Go API, and the Next.js frontend with Docker Compose.

## Requirements
- Docker Desktop (or Docker Engine + Compose)

## Setup

1) Create local env files from tracked templates:

```
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-env.ps1
```

2) Review env files:

```
infra\env\mysql.env
infra\env\api.env
infra\env\web.env
```

3) Start the stack:

```
cd infra
docker compose up -d --build
```

Quick restart (always pick latest web code):

```
powershell -ExecutionPolicy Bypass -File .\infra\restart-web.ps1
```

Equivalent manual steps:

```
docker compose -f infra/docker-compose.yml up -d --build web
docker compose -f infra/docker-compose.yml ps
curl.exe http://localhost:3000
curl.exe http://localhost:8080/healthz
```

Admin Home Editor freshness checks (after restart):
- `Topbar & Lien he` action is visible.
- Banner editor has `Eyebrow`.
- CTA link uses picker/select (not free text URL input).
- Banner image editor supports separate `Desktop` and `Mobile`.
- Media picker no longer has a `RECENT` tab.

4) Verify services:

```
curl http://localhost:8080/healthz
curl http://localhost:3000
```

## Notes
- Migrations run on API start (`MIGRATE_ON_START=true`).
- Seed data loads on first start (`SEED_ON_START=true`).
- Existing databases are not reseeded by default; set `SEED_REFRESH_ON_START=true` only when explicit refresh is needed.
- Uploaded files are stored in the `api_uploads` volume.
- Admin seed account (local): `admin@tambo.local` / `admin123`.
- If SMTP is not configured, OTP emails are logged to the API console in non-production environments.

## Further Reading
- Google OAuth + Gmail OTP setup: `docs/AUTH_GOOGLE_OTP_SETUP.md`
- Unicode DB repair runbook: `docs/UNICODE_DB_REPAIR.md`

## Reset data

```
docker compose down -v
```

Then start again to re-run migrations and seeds.

## Run services manually (optional)

### API
1) Start MySQL:
```
cd infra
docker compose up -d mysql
```
2) Update `infra/env/api.env`: `DB_HOST=localhost`, `DB_PORT=3007`.
3) Run API:
```
cd apps/api
go run .
```

### Web
```
cd apps/web
npm.cmd install
npm.cmd run dev
```

Ensure `NEXT_PUBLIC_API_URL=http://localhost:8080`.

## Useful commands

```
docker compose ps
docker compose logs -f api
docker compose logs -f web
```

## Manual QA checklist
- Storefront: open home, browse collections, filter/sort products, view detail.
- Cart: add products, update quantity, verify min order + free shipping thresholds.
- Checkout: select shipping/payment, apply coupon (`WELCOME50`, `FRESH10`), place order.
- Payment proof: upload file on thank-you page and confirm `/uploads`.
- Blog: view list and detail pages.
- Auth: login via Google or Gmail OTP.
- Account: update profile, add address, view order history.
- Admin: login, CRUD products/categories/posts/Q&A, update orders and payment settings.
