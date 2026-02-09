# Tam Bo Ecommerce + Blog Monorepo

Full-stack ecommerce + blog platform inspired by nongduoctambo.com.vn. Includes a Next.js storefront + admin UI, Go (Gin) API, and MySQL.

## Key Features
- Storefront: home, collections, filtering/sorting, product detail, quick view, related + recently viewed.
- Cart: quantity updates, notes, minimum order enforcement, free shipping progress.
- Checkout: shipping/payment selection, promo code validation, order creation, bank transfer proof upload.
- Content: blog posts and static pages (About, Q&A, Locations, Return Policy, Terms).
- User Auth: email registration, login, OTP email verification, password reset, session management.
- Account: profile, addresses, order history.
- Admin: CRUD for products, categories, posts, Q&A, payment settings, orders, uploads.

## Tech Stack
- Web: Next.js 14 (App Router) + Tailwind + shadcn/ui
- API: Go 1.22 + Gin
- DB: MySQL 8
- Infra: Docker Compose + Nginx (prod template)

## Architecture
- MySQL stores catalog, content, orders, and users.
- Go API exposes REST endpoints for storefront, checkout, and admin.
- Next.js consumes the API and handles client-side cart state.
- Uploads are stored on disk and served via `/uploads`.

## Repo Layout
```
.
|-- apps/
|   |-- api/            Go API service
|   `-- web/            Next.js storefront + admin UI
|-- infra/             docker compose, env, nginx config
|-- migrations/        SQL migrations
|-- seed/              SQL seed data (auth/admin/promotions)
|-- docs/              local/deploy/handover docs
`-- tmp_bcrypt.go      bcrypt helper
```

## Requirements
- Docker Desktop (recommended to run full stack)
- Node.js 20+ (manual web run)
- Go 1.22 (manual API run)
- MySQL 8 (if not using Docker)

## Environment Setup
Env files live in `infra/env/`. Copy from examples and update values:

```
Copy-Item infra\env\mysql.env.example infra\env\mysql.env
Copy-Item infra\env\api.env.example infra\env\api.env
Copy-Item infra\env\web.env.example infra\env\web.env
```

Important variables:
- API: `DB_*`, `JWT_SECRET`, `OTP_SECRET`, `MIGRATE_ON_START`, `SEED_ON_START`
- Business: `MIN_ORDER_AMOUNT`, `FREE_SHIPPING_THRESHOLD`
- URLs: `PUBLIC_BASE_URL`, `FRONTEND_BASE_URL`, `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`
- CORS: `ALLOWED_ORIGINS`, `CORS_ALLOW_CREDENTIALS`, `TRUSTED_PROXIES`
- SMTP/OTP: `OTP_*`, `SMTP_*`

Note: `NEXT_PUBLIC_*` values are baked into the Next.js build. If they change, rebuild the web image.

## Local Development (Docker Recommended)
```
cd infra
docker compose up -d --build
```

Verify:
```
curl http://localhost:8080/healthz
curl http://localhost:3000
```

Ports:
- Web: `http://localhost:3000`
- API: `http://localhost:8080`
- MySQL: `localhost:3007` (user/pass from `infra/env/mysql.env`)

Logs:
```
docker compose logs -f api
docker compose logs -f web
```

Reset data:
```
docker compose down -v
```

## Run Services Manually (Optional)

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

## Migrations and Seed
- Migrations run when `MIGRATE_ON_START=true`.
- Seed runs once when `SEED_ON_START=true` and DB is empty.
- Files: `migrations/`, `seed/`.

Default seed includes:
- Admin user: `admin@tambo.local` / `admin123`
- Payment settings
- Coupons: `WELCOME50`, `FRESH10`, `SAVE10`, `SAVE20`, `SAVE40`

Need a new admin? Use `tmp_bcrypt.go` to generate a password hash.

## Routes
- `/`: home
- `/products`, `/products/[slug]`
- `/cart`, `/checkout`, `/checkout/thank-you`
- `/blog`, `/blog/[slug]`
- `/pages/about-us`, `/pages/hoi-dap-cung-nha-nong`, `/pages/locations`, `/pages/return-policy`, `/pages/terms-of-service`
- `/login`, `/signup`, `/forgot-password`
- `/account`, `/account/addresses`, `/account/orders`
- `/admin`, `/admin/login`

## API Summary
See the full API contract in `docs/API.md`.

High-level groups:
- Public: catalog, content, locations/geo, checkout config, promotions, orders.
- Auth: register/login/logout/refresh, email OTP verify, password reset, sessions.
- Account: profile, addresses, order history.
- Admin: login/logout, CRUD products/categories/posts/Q&A, orders, payment settings, uploads.

## Auth Notes
- Tokens can be sent via `Authorization: Bearer <token>` or cookies set by the API.
- For cookie auth across domains: set `CORS_ALLOW_CREDENTIALS=true` and use explicit `ALLOWED_ORIGINS` (no `*`).

## Uploads
- Local (no Docker): `apps/api/uploads`
- Docker: volume `api_uploads`
- Served at `http://localhost:8080/uploads/...`

## Testing
API:
```
cd apps/api
go test ./...
```

Web:
```
cd apps/web
npm.cmd run lint
npm.cmd run test:e2e
npm.cmd run build
```

Note: Playwright requires `npx.cmd playwright install` on first run.

## Deployment
See `docs/README_DEPLOY.md`.

## Backup/Restore (MySQL)

Backup:
```
docker exec tambo_mysql mysqldump -u root -pYOUR_ROOT_PASSWORD tambo > backup.sql
```

Restore:
```
Get-Content backup.sql | docker exec -i tambo_mysql mysql -u root -pYOUR_ROOT_PASSWORD tambo
```

## Documentation
- `docs/README_LOCAL.md`: local setup details
- `docs/README_DEPLOY.md`: VPS deployment
- `docs/HANDOVER_GUIDE.md`: handover + content workflow
- `apps/web/README_UI.md`: storefront UI summary
- `docs/API.md`: full API contract

## Roadmap
- Phase 3: expanded location search, promotions, delivery slots
