# Local Development

This monorepo runs MySQL, the Go API, and the Next.js frontend with Docker Compose.

## Requirements
- Docker Desktop (or Docker Engine + Compose)

## Setup

1) Review env files:

```
infra\env\mysql.env
infra\env\api.env
infra\env\web.env
```

2) Configure Phase 2 auth (optional for local):

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/google/callback
FRONTEND_BASE_URL=http://localhost:3000
```

If Google OAuth is not configured, user login will be unavailable.

3) Start the stack:

```
cd infra
docker compose up -d --build
```

4) Verify services:

```
curl http://localhost:8080/healthz
curl http://localhost:3000
```

## Notes
- Migrations run on API start (MIGRATE_ON_START=true).
- Seed data loads on first start (SEED_ON_START=true).
- Uploaded files are stored in the api_uploads volume.
- Admin seed account (local): `admin@ttc.local` / `admin123`

## Reset data

```
docker compose down -v
```

Then start again to re-run migrations and seeds.

## Useful commands

```
docker compose ps
docker compose logs -f api
docker compose logs -f web
```

## Phase 2 manual checks

User account:
- Visit `http://localhost:3000/login` and sign in with Google.
- After redirect, confirm profile loads on `/account`.
- Add an address in `/account/addresses`.
- Confirm order history in `/account/orders` after placing an order.

Admin:
- Visit `http://localhost:3000/admin/login`.
- Login with `admin@ttc.local` / `admin123`.
- Create a category and product, then verify it appears on the storefront.
- Update order status and payment status in Admin > Orders.
