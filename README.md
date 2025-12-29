# TTC Ecommerce + Blog (Phase 1)

Production-ready ecommerce + blog monorepo inspired by nongnghiepttc.com.vn.
Phase 1 focuses on a clean API-driven storefront with cart and checkout, MySQL
migrations, and seed data for immediate local demos and client handover.

## Tech Stack
- Frontend: Next.js App Router + Tailwind CSS
- Backend: Go (Gin)
- Database: MySQL 8
- Local and production: Docker Compose + Nginx (prod template)

## Architecture
- MySQL stores all catalog, content, and order data.
- Go API exposes REST endpoints for storefront and checkout.
- Next.js consumes the API directly and renders all storefront pages.
- Uploads (payment proofs) are stored on disk and served via /uploads.

## Repository Layout
- apps/api - Go API service
- apps/web - Next.js storefront
- infra - docker compose, env files, nginx templates
- migrations - SQL migrations
- seed - seed data SQL
- docs - local, deploy, and handover guides

## Project Tree
```
/
├─ apps/
│  ├─ api/
│  │  ├─ internal/
│  │  ├─ Dockerfile
│  │  └─ main.go
│  └─ web/
│     ├─ app/
│     ├─ components/
│     ├─ lib/
│     ├─ public/
│     ├─ Dockerfile
│     └─ package.json
├─ docs/
│  ├─ README_LOCAL.md
│  ├─ README_DEPLOY.md
│  └─ HANDOVER_GUIDE.md
├─ infra/
│  ├─ env/
│  │  ├─ api.env.example
│  │  ├─ mysql.env.example
│  │  └─ web.env.example
│  ├─ nginx/
│  │  └─ default.conf
│  ├─ docker-compose.yml
│  └─ docker-compose.prod.yml
├─ migrations/
├─ seed/
├─ README.md
└─ .gitignore
```

## Key Features (Phase 1)
- Home page with category overview, featured products, latest posts, newsletter, and contact
- Products listing with filtering and sorting
- Product detail with related + recently viewed
- Cart with min order enforcement and free shipping progress
- Checkout with shipping/payment methods and order creation
- Bank transfer thank you page with QR and proof upload
- Blog listing and detail with related posts
- Static pages for About, QnA, Locations, Return Policy, Terms

## Environment Configuration
Env files live in `infra/env/`. Values with spaces should be quoted.

Required files:
- `infra/env/mysql.env`
- `infra/env/api.env`
- `infra/env/web.env`

Key variables:
- `DB_*`: database connection (api)
- `JWT_SECRET`: reserved for Phase 2 admin auth
- `MIN_ORDER_AMOUNT`: minimum order total (api, frontend)
- `FREE_SHIPPING_THRESHOLD`: free shipping threshold (api, frontend)
- `PUBLIC_BASE_URL`: public API base used for image URLs
- `ALLOWED_ORIGINS`: CORS origin list for the API
- `NEXT_PUBLIC_API_URL`: API base for the browser
- `API_INTERNAL_URL`: API base for server-side fetches (Docker: `http://api:8080`)
- `NEXT_PUBLIC_SITE_URL`: base URL for sitemap/robots

## Local Development (Docker)

```
cd infra
docker compose up -d --build
```

Verify:
```
curl http://localhost:8080/healthz
curl http://localhost:3000
```

Logs:
```
docker compose logs -f api
docker compose logs -f web
```

Reset data:
```
docker compose down -v
```

## Migrations and Seed Data
- Migrations run on API start if `MIGRATE_ON_START=true`.
- Seeds run once if `SEED_ON_START=true` and products table is empty.
- SQL files live in `migrations/` and `seed/`.

## API Summary (Phase 1)
Base URL: `http://localhost:8080`

Response format:
```
{
  "success": true,
  "data": {}
}
```

Endpoints:
- `GET /api/categories`
- `GET /api/products?category=&sort=&featured=&limit=`
- `GET /api/products/:slug`
- `GET /api/posts`
- `GET /api/posts/:slug`
- `GET /api/pages/:slug`
- `GET /api/qna`
- `GET /api/locations`
- `POST /api/orders`
- `POST /api/orders/:id/payment-proof` (multipart form, field name `file`)

Uploads:
- Stored under `apps/api/uploads` (mapped to Docker volume).
- Served publicly via `/uploads/...`.

## Frontend Routes
- `/` home
- `/products` listing
- `/products/[slug]` detail
- `/blog` listing
- `/blog/[slug]` detail
- `/blogs/news` redirect to `/blog`
- `/cart` cart
- `/checkout` checkout
- `/checkout/thank-you` bank transfer summary
- `/pages/about-us`
- `/pages/hoi-dap-cung-nha-nong`
- `/pages/locations`
- `/pages/return-policy`
- `/pages/terms-of-service`

## Business Rules
- Minimum order: `MIN_ORDER_AMOUNT`
- Free shipping threshold: `FREE_SHIPPING_THRESHOLD`
- Cart state stored in localStorage
- Latest order stored in localStorage for thank you screen

## Production Deployment

1) Update env files:
```
Copy-Item infra\env\mysql.env.example infra\env\mysql.env
Copy-Item infra\env\api.env.example infra\env\api.env
Copy-Item infra\env\web.env.example infra\env\web.env
```

2) Build and run:
```
docker compose --env-file infra\env\web.env -f infra\docker-compose.prod.yml up -d --build
```

3) Configure Nginx:
- Edit `infra/nginx/default.conf` (server_name, TLS).
- Add SSL via Certbot or your hosting provider.

Note: `NEXT_PUBLIC_*` values are baked into the Next.js build. Rebuild the web
image after changing them.

## Backup and Restore (MySQL)
Backup:
```
docker exec ttc_mysql mysqldump -u root -pYOUR_ROOT_PASSWORD ttc > backup.sql
```

Restore:
```
Get-Content backup.sql | docker exec -i ttc_mysql mysql -u root -pYOUR_ROOT_PASSWORD ttc
```

## Documentation
- `docs/README_LOCAL.md` local setup
- `docs/README_DEPLOY.md` VPS deployment
- `docs/HANDOVER_GUIDE.md` client handover and content edits

## Roadmap
- Phase 2: Google OAuth, user accounts, admin dashboard, payment verification
- Phase 3: store location search improvements, promotions, delivery slots
