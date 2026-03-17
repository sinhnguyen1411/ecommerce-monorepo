# Tam Bo Ecommerce + Blog Monorepo

Full-stack ecommerce + content platform (storefront + admin) with a Next.js web app, Go/Gin API, and MySQL.

## Highlights
- Storefront: home, collections, filters/sorting, product detail, quick view, related/recently viewed.
- Cart + checkout: quantity updates, notes, promo validation, shipping/payment selection, order creation, payment-proof upload.
- Content: blog/news, Q&A, locations, About page content from API.
- Buyer auth: Google OAuth + Gmail OTP login, email verification OTP, session management.
- Buyer account: profile, addresses, order history.
- Admin: CRUD for products, categories, posts, pages, Q&A, orders, payment settings, uploads.
- Security controls: login/account lockout, endpoint/IP rate limits, upload/body size limits, cookie-first auth.
- Optional Redis for rate limiting and API GET cache.

## Tech Stack
- Web: Next.js 14 (App Router), React 18, Tailwind, shadcn-style UI primitives.
- API: Go 1.22, Gin.
- Data: MySQL 8.
- Infra: Docker Compose (local + prod template), Nginx (prod).

## Architecture
- MySQL stores catalog, content, auth/session, and order data.
- Go API exposes REST endpoints for public, auth, account, and admin flows.
- Next.js consumes API endpoints directly (`credentials: include`) and keeps cart state in browser local storage.
- Uploads are file-system based and served via `/uploads`.
- API can call external services: Google OAuth, SMTP, Vietnam geo API, VietQR.

## Repository Layout
```text
.
|-- apps/
|   |-- api/               Go API service
|   `-- web/               Next.js storefront + admin UI
|-- infra/                 Compose files, env files, nginx config
|-- migrations/            SQL migrations
|-- seed/                  SQL seed data
|-- docs/                  Local/deploy/API/security/handover docs
`-- tmp_bcrypt.go          bcrypt helper for admin password hashes
```

## Requirements
- Docker Desktop (recommended full-stack runtime)
- Node.js 20+ (manual web run)
- Go 1.22 (manual API run)
- MySQL 8 (if not using Docker)

## Environment Setup
Environment files live in `infra/env/`:

```powershell
Copy-Item infra\env\mysql.env.example infra\env\mysql.env
Copy-Item infra\env\api.env.example infra\env\api.env
Copy-Item infra\env\web.env.example infra\env\web.env
```

Key variables:
- API core: `DB_*`, `JWT_SECRET`, `OTP_SECRET`, `MIGRATE_ON_START`, `SEED_ON_START`
- Auth/OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL`, `AUTH_GMAIL_ONLY`
- Business: `MIN_ORDER_AMOUNT`, `FREE_SHIPPING_THRESHOLD`, `SHIPPING_FEE_STANDARD`, `SHIPPING_FEE_EXPRESS`
- Security/rate-limit: `LOGIN_*`, `REGISTER_RATE_LIMIT_*`, `ORDER_RATE_LIMIT_*`, `PROMO_VALIDATE_RATE_LIMIT_*`, `PAYMENT_PROOF_RATE_LIMIT_*`, `BUYER_WRITE_RATE_LIMIT_*`, `ADMIN_WRITE_RATE_LIMIT_*`, `AUTH_RATE_LIMIT_*`, `API_RATE_LIMIT_*`, `JSON_BODY_MAX_BYTES`, `UPLOAD_MAX_BYTES`
- URLs: `PUBLIC_BASE_URL`, `FRONTEND_BASE_URL`, `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`
- CORS: `ALLOWED_ORIGINS`, `CORS_ALLOW_CREDENTIALS`, `TRUSTED_PROXIES`
- SMTP/OTP: `OTP_*`, `SMTP_*`
- Cache/rate-limit optional: `REDIS_*`, `CACHE_*`
- VietQR: `VIETQR_*`

Important:
- `NEXT_PUBLIC_*` values are baked into the Next.js build. Rebuild web after changing them.
- In production, missing SMTP config causes API startup failure.
- When `CORS_ALLOW_CREDENTIALS=true`, `ALLOWED_ORIGINS` must be explicit (no `*`) or API startup fails.

## Local Development (Docker Recommended)
```powershell
cd infra
docker compose up -d --build
```

Verify:
```powershell
curl http://localhost:8080/healthz
curl http://localhost:3000
```

Ports:
- Web: `http://localhost:3000`
- API: `http://localhost:8080`
- MySQL: `localhost:3007`
- Redis: `localhost:6379`

Logs:
```powershell
docker compose logs -f api
docker compose logs -f web
```

Reset local data:
```powershell
docker compose down -v
```

### Local Docker nuance
- API container runs dev target (`go run .`) with source mounted.
- Web container runs runner target (`npm start`) rather than `next dev`.
- Redis container is started by Compose, but Redis-backed rate-limit/cache only activate when `REDIS_ENABLED=true` and `CACHE_ENABLED=true`.

## Manual Run (Optional)

### API
1. Start MySQL:
```powershell
cd infra
docker compose up -d mysql
```
2. Set in `infra/env/api.env`: `DB_HOST=localhost`, `DB_PORT=3007`.
3. Run API:
```powershell
cd apps/api
go run .
```

### Web
```powershell
cd apps/web
npm install
npm run dev
```

Ensure `NEXT_PUBLIC_API_URL=http://localhost:8080`.

## Migrations and Seed
- Migrations run when `MIGRATE_ON_START=true`.
- Seed behavior (`SEED_ON_START=true`):
  - Empty DB: all seed files run.
  - Existing products: promotions/users/content-quality seed refresh.
- Sources: `migrations/`, `seed/`.

Default seed includes:
- Admin users: `admin@tambo.local` / `admin123`, `admin2@tambo.local` / `admin123`
- Payment settings
- Coupons: `WELCOME50`, `FRESH10`, `SAVE10`, `SAVE20`, `SAVE40`
- Buyer test users (`buyer@tambo.local`, `buyer2@tambo.local`) with seeded addresses
- Content quality normalization for products/posts/pages/Q&A/locations via `seed/005_content_quality.sql`

Need a new admin password hash: use `tmp_bcrypt.go`.

## Routes
Canonical routes:
- `/`
- `/collections/all`
- `/products/[slug]`
- `/cart`, `/checkout`, `/checkout/thank-you`
- `/blogs/news`, `/blogs/news/[slug]`
- `/pages/about-us`, `/pages/hoi-dap-cung-nha-nong`, `/pages/locations`, `/pages/lien-he`
- `/locations` (alternate locations page)
- `/login`, `/signup`, `/forgot-password`
- `/account`, `/account/addresses`, `/account/orders`
- `/admin`, `/admin/login`

Route aliases/redirects:
- `/products` -> `/collections/all`
- `/blog` -> `/blogs/news`
- `/blog/[slug]` -> `/blogs/news/[slug]`
- `/pages/return-policy` -> `/pages/chinh-sach-doi-tra`
- `/pages/terms-of-service` -> `/pages/dieu-khoan-dich-vu`

## API Summary
See full contract in `docs/API.md`.

Envelope shape:
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code", "message", "retry_at?" } }`

High-level groups:
- Public: catalog, content, geo/locations, checkout config, promotions, orders, payments.
- Auth: Google start/callback, OTP request/verify, register/login/logout/refresh, email OTP verify, forgot-password, sessions.
- Account: profile, addresses, order history.
- Admin: login/logout/me, CRUD products/categories/posts/qna/pages, orders, payment settings, uploads.

## Auth Notes
- API accepts `Authorization: Bearer <token>` and HTTP-only cookies.
- Frontend currently uses cookie-first auth (`credentials: include`).
- API auth cookies: `ttc_access_token`, `ttc_refresh_token`, `ttc_admin_token`.
- For cross-origin cookie auth:
  - `CORS_ALLOW_CREDENTIALS=true`
  - explicit `ALLOWED_ORIGINS` (no `*`)
- In HTTPS/production cross-origin setups, cookie policy switches to `SameSite=None; Secure`.
- If `AUTH_GMAIL_ONLY=true`, password register/login endpoints are disabled.
- Login/admin login include temporary account lockout after repeated failures and can return `Retry-After` + `error.retry_at`.

## Uploads
- Local path (non-Docker): `apps/api/uploads`
- Docker volume: `api_uploads`
- Public path: `http://localhost:8080/uploads/...`

## Testing
API:
```powershell
cd apps/api
go test ./...
```

Web:
```powershell
cd apps/web
npm run lint
npm run test:e2e
npm run build
```

Notes:
- Playwright first run may require: `npx playwright install`.
- `npm run test:e2e` starts `mysql`, `redis`, and `api` via Docker Compose, waits for `http://localhost:8080/healthz`, runs Playwright, then stops only the services it started.
- Use `npm run test:e2e:raw` only when the backend is already running and healthy.
- Build guard via `prebuild`: `check:mojibake` + `lint:errors`.

## Encoding and Git Hooks
- Repository text files are normalized to UTF-8 + LF via `.editorconfig` and `.gitattributes`.
- Web build/commit protection uses:
  - `cd apps/web && npm run check:mojibake` (mojibake + invisible control-char guard)
  - `cd apps/web && npm run lint:errors` (parse/lint errors only)
- Bootstrap scripts set repo-local Git config: `core.hooksPath=.githooks` and `core.autocrlf=false`.

Enable repo hooks once after clone:

PowerShell:
```powershell
.\scripts\setup-git-hooks.ps1
```

sh/bash:
```sh
./scripts/setup-git-hooks.sh
```

<!-- OPENCODE_WORKFLOW:START -->
## OpenCode Rate-Limit Workflow
- Default policy for code tasks: mandatory OpenCode wrapper lifecycle (`prepare -> code+verify -> complete`).
- Workflow state/logs are repo-local under `.opencode/rate-limit/` and should stay git-ignored.

One-time setup:

PowerShell:
```powershell
.\scripts\setup-opencode-rate-limit.ps1
```

sh/bash:
```sh
./scripts/setup-opencode-rate-limit.sh
```

Defaults:
- `cheapModel=opencode/gpt-5-nano`
- `strongModel=opencode/big-pickle`
- `gateWindow=5`
- `maxExploreRuns=1` (second explore only for `runtime`/`security` or `--force`)

Code task lifecycle:
```powershell
.\scripts\oc-task.ps1 -Action prepare -Tags "runtime,ui" -Goal "..." -Context "..."
# implement + verify changes
.\scripts\oc-task.ps1 -Action complete -Prompt "..." -Label "checkpoint"
```

Fail-open path:
```powershell
.\scripts\oc-task.ps1 -Action skip -Reason "opencode unavailable"
```

Status/reset:
```powershell
.\scripts\oc-task.ps1 -Action status
.\scripts\oc-task.ps1 -Action reset
```

Enforcement roadmap:
- Sprint 1-2 (soft): no CI blocking, task updates must include `OpenCode: used` or `OpenCode: skipped (reason)`.
- After KPI stability (hard): add CI lifecycle checks (`prepare+complete` or `skip` with reason) for bootstrapped repos.

Team weekly aggregate:
```powershell
$SkillDir = Join-Path $HOME ".codex\skills\opencode-cli"
powershell -NoProfile -ExecutionPolicy Bypass -File "$SkillDir\scripts\weekly-aggregate.ps1"
```
<!-- OPENCODE_WORKFLOW:END -->

## Deployment
See `docs/README_DEPLOY.md`.

Production compose note:
- `infra/docker-compose.prod.yml` currently does not include Redis. If you need Redis-backed caching/rate limiting in prod, add a Redis service and wire `REDIS_*`.

## Backup/Restore (MySQL)
Backup:
```powershell
docker exec tambo_mysql mysqldump -u root -pYOUR_ROOT_PASSWORD tambo > backup.sql
```

Restore:
```powershell
Get-Content backup.sql | docker exec -i tambo_mysql mysql -u root -pYOUR_ROOT_PASSWORD tambo
```

## Documentation
- `docs/README_LOCAL.md`: local setup
- `docs/STARTUP.md`: startup and test workflow
- `docs/README_DEPLOY.md`: deployment
- `docs/API.md`: API contract
- `docs/AUTH_GOOGLE_OTP_SETUP.md`: Google OAuth + Gmail OTP setup
- `docs/PROJECT_CONTEXT.md`: deep internal project context
- `docs/SECURITY_ASVS_L1.md`: security gap analysis
- `docs/HANDOVER_GUIDE.md`: handover notes
- `docs/CONTENT_QUALITY_CHECKLIST.md`: editorial/content-quality checklist
- `apps/web/README_UI.md`: storefront UI summary







