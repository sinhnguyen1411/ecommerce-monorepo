# Project Context

This document is an internal, implementation-driven onboarding reference for the `ecommerce-monorepo` repository. It is written for ChatGPT, Codex, or another code agent that needs to understand the codebase quickly without re-deriving the architecture from scratch.

This file reflects repository state inspected on March 10, 2026. It is intentionally grounded in the current code first, then the local docs, then seed data. If this document disagrees with older prose docs, trust the current code in `apps/api`, `apps/web`, `migrations`, `seed`, and `infra`.

## 1. Purpose and Audience

The repository is a monorepo for a Tam Bo-branded ecommerce and content site:

- A public storefront and content site built with Next.js 14 App Router.
- An admin interface built into the same Next.js app.
- A Go 1.22 API built on Gin.
- A MySQL 8 database for catalog, content, users, orders, and operational tables.
- Optional Redis support for rate limiting and GET-response caching.

Primary intended users of this document:

- Internal engineers joining the project.
- LLM agents asked to explain, review, refactor, or extend the code.
- Anyone who needs to understand what is persisted in MySQL, what is stored only in browser local storage, and which behavior is currently implemented versus only documented or planned.

This is not a public product overview. It includes internal operational details such as seeded accounts, environment groups, security caveats, and runtime constraints because that information is useful to code agents working inside this repo.

## 2. Monorepo Layout and Responsibilities

| Path | Responsibility | Notes |
| --- | --- | --- |
| `apps/web` | Next.js storefront and admin UI | Public pages, checkout flow, account pages, admin dashboard, Playwright UI tests |
| `apps/api` | Go/Gin API service | REST endpoints, auth/session logic, checkout/order logic, admin APIs, uploads |
| `infra` | Container and reverse-proxy infrastructure | Local and production Compose files, env files, Nginx config |
| `migrations` | SQL schema migrations | Applied lexicographically at API start when enabled |
| `seed` | SQL seed data | Baseline catalog/content/admin/payment data plus promo and test users |
| `docs` | Human docs | Local setup, deployment, API contract, handover notes, security gap analysis |
| `tmp_bcrypt.go` | Utility helper | Generates bcrypt hashes for admin passwords when needed |

Important repository-level observations:

- The repo contains historical phase-oriented docs. Current code is beyond the earliest phase docs.
- The repo is full-stack but frontend and backend are intentionally decoupled through REST calls, not a shared in-process API layer.
- Uploads are filesystem-backed, not object-storage-backed.

## 3. Runtime Architecture

### High-level request flow

1. Browser requests a page from the Next.js app.
2. Next.js server components and client components fetch API data from the Go service.
3. The Go API reads and writes MySQL for business data.
4. Redis may be used for rate limiting and GET response caching if enabled.
5. Uploaded files are stored on disk and served by the API under `/uploads`.

### Services and ports

Local Docker Compose (`infra/docker-compose.yml`) starts:

- `mysql` on host port `3007`
- `api` on host port `8080`
- `web` on host port `3000`
- `redis` on host port `6379`

Production Compose (`infra/docker-compose.prod.yml`) starts:

- `mysql`
- `api`
- `web`
- `nginx` on host port `80`

Notable difference: the production Compose template does not include Redis even though the API supports Redis-backed rate limiting and caching.

### Public routing in production

`infra/nginx/default.conf` proxies:

- `/api/` to `api:8080`
- `/uploads/` to `api:8080/uploads/`
- `/` to `web:3000`

### Upload storage model

- Local non-Docker default path: `apps/api/uploads`
- Docker path: mounted volume `api_uploads`
- Public URL path: `/uploads/...`

### External runtime dependencies

The API can call several external services:

- Google OAuth and token verification endpoints
- SMTP server for OTP email delivery
- `https://provinces.open-api.vn/api` for province and district data
- VietQR endpoints for bank metadata and QR generation

If the runtime environment has no outbound network access, these features degrade or fail:

- Google sign-in
- Email OTP delivery
- Geo province and district lookup
- VietQR generation and bank BIN lookup

## 4. Frontend Architecture

### Frontend stack

`apps/web` uses:

- Next.js 14 App Router
- React 18
- Tailwind CSS
- shadcn/ui-style primitives in `components/ui`
- Zustand for cart state
- Playwright for browser tests

The app root is `apps/web/app/layout.tsx`. It applies:

- global CSS
- Google fonts (`Be_Vietnam_Pro` and `Noto_Sans`)
- `Topbar`
- `Header`
- page body
- `Footer`
- `CartDrawer`
- floating social buttons
- toast notifications (`Sonner`)

The root layout exports `dynamic = "force-dynamic"`, so the app shell is intentionally dynamic rather than purely static.

### Data-fetching model

The main data access modules are:

- `apps/web/lib/api.ts` for public storefront and checkout API calls
- `apps/web/lib/account.ts` for authenticated buyer account calls
- `apps/web/lib/user-auth.ts` for auth and password/OTP actions
- `apps/web/lib/admin.ts` for admin API calls
- `apps/web/lib/auth-client.ts` for cookie-based request retry and refresh handling
- `apps/web/lib/client-content.ts` for browser-local-storage-backed admin-managed marketing content

Important implementation detail:

- Server-side fetches in `lib/api.ts` use `API_INTERNAL_URL` first, then `NEXT_PUBLIC_API_URL`.
- Browser-side fetches use `NEXT_PUBLIC_API_URL`.
- Public GET requests use either `no-store` or Next.js revalidation depending on endpoint.
- Authenticated requests use `credentials: "include"` and rely on cookies, not local bearer tokens.

### Public routes and route aliases

Current route structure includes:

- `/` home page
- `/collections/all` main catalog page
- `/products/[slug]` product detail
- `/cart`
- `/checkout`
- `/checkout/thank-you`
- `/blogs/news`
- `/blogs/news/[slug]`
- `/pages/about-us`
- `/pages/hoi-dap-cung-nha-nong`
- `/pages/locations`
- `/pages/lien-he`
- `/locations` as an alternate locations page
- `/login`
- `/signup`
- `/forgot-password`
- `/account`
- `/account/addresses`
- `/account/orders`
- `/admin`
- `/admin/login`

Intentional route aliases and redirects:

- `/products` redirects to `/collections/all`
- `/blog` redirects to `/blogs/news`
- `/blog/[slug]` redirects to `/blogs/news/[slug]`
- `/pages/return-policy` redirects to `/pages/chinh-sach-doi-tra`
- `/pages/terms-of-service` redirects to `/pages/dieu-khoan-dich-vu`

### Public storefront behavior

#### Catalog and product detail

- `apps/web/app/collections/all/page.tsx` is the main catalog entrypoint.
- It fetches categories and products from the API and passes them into `ProductsClient`.
- Product detail pages fetch a single product from `/api/products/:slug`.
- Product images and categories come from the API; there is no separate frontend aggregation layer.

#### Blog and content pages

- `/blogs/news` fetches posts from `/api/posts`.
- `/blogs/news/[slug]` fetches one post and a recent-post list.
- `/pages/about-us` is special: it fetches the `about-us` page from `/api/pages/about-us` and interprets `pages.content` as either structured JSON or raw HTML fallback.
- `/pages/hoi-dap-cung-nha-nong` is backed by `/api/qna`.
- `/pages/locations` and `/locations` are backed by `/api/locations`.

Important caveat:

- The public `pages` table exists, but the frontend currently uses it meaningfully only for `about-us`.
- The return policy, terms of service, and privacy policy pages in `apps/web/app/pages/...` are hardcoded page components, not DB-driven page rendering.

#### Contact and marketing UI

- The contact page shows a form, but the form is presentational only. There is no backend submission endpoint wired to it.
- The newsletter call-to-action on the blog page is also presentational only.
- Several top-level marketing UI elements are customizable in the browser only and are not stored in MySQL.

### Cart and checkout state

Cart state lives in `apps/web/store/cart.ts` and is stored in browser local storage under the `tambo-cart` key.

Stored cart state includes:

- line items
- note
- promo code
- delivery time
- shipping method

Cart state is client-side only until checkout submits an order to `/api/orders`.

Important behavior:

- Subtotal is computed client-side.
- Free shipping progress and minimum order messaging are shown client-side.
- Backend order validation is still authoritative.

### Authentication and account UX

#### What the current UI exposes

The current public login UX is in `apps/web/app/login/page.tsx` and exposes:

- Google OAuth
- Gmail OTP login

The current public signup page does not create accounts. It is a simple pointer to the login page and explicitly says new accounts use Google or Gmail OTP.

The forgot-password page is implemented and talks to the password reset OTP endpoints, but the main storefront login UI does not expose email/password sign-in.

#### What the API also supports

The API still supports:

- email/password register
- email/password login
- refresh token rotation
- email verification OTP
- forgot-password OTP reset
- session listing and revocation

These endpoints are real, but the current storefront UI is narrower than the backend surface.

#### Cookie-first auth

The frontend auth model is cookie-first:

- authenticated requests are made with `credentials: "include"`
- `auth-client.ts` retries `401` once by calling `/api/auth/refresh`
- cookies are the real session source

`apps/web/lib/auth.ts` looks like a token storage helper, but in current code it is effectively stubbed:

- `getUserToken`, `getRefreshToken`, and `getAdminToken` return empty strings
- setters are no-ops
- clear functions only remove local storage keys

This means:

- the real auth system is cookie-based
- some legacy-looking token checks are not authoritative
- local token helpers should not be treated as current session state

#### Account pages

Buyer account pages use:

- `/api/account/profile`
- `/api/account/addresses`
- `/api/account/orders`

Current practical behavior:

- profile page allows name edits
- phone updates are effectively blocked unless the number already matches the verified server-side number
- email verification uses OTP from `/api/auth/send-email-otp` and `/api/auth/verify-email-otp`
- address CRUD is fully implemented
- order history only shows orders that were created while a user session was present, because `orders.user_id` is filled only when `optionalUser` succeeds during checkout

Guest orders:

- can still be created
- can be viewed by order ID summary and thank-you flow
- do not appear in `/account/orders` unless the checkout request carried a valid user cookie or bearer token

### Thank-you and payment proof flow

`apps/web/app/checkout/thank-you/page.tsx`:

- first tries to read `ttc_last_order` from local storage
- falls back to `/api/orders/:id/summary` if `order_id` is in the query string
- lets the user switch payment method via `/api/orders/:id/payment-method`
- fetches QR details from `/api/orders/:id/payment/qr`
- uploads payment proof via `/api/orders/:id/payment-proof`

### Admin dashboard architecture

The admin area is mostly implemented as one very large client page: `apps/web/app/admin/page.tsx`.

It loads and manages these sections:

- overview
- products
- categories
- posts
- about
- qna
- orders
- payments
- contact
- banners
- popup
- notifications

#### Admin sections backed by the API and MySQL

These sections persist server-side:

- products
- categories
- posts
- Q&A
- orders
- payment settings
- pages, specifically the `about-us` page used for structured About page content

#### Admin sections backed only by browser local storage

These sections are not saved through the API:

- home banners
- contact settings
- promo popup settings
- notification settings

Those values live in browser local storage and are loaded through `apps/web/lib/client-content.ts`.

Implications:

- changes are browser-specific, not shared across devices or admins
- they are not replicated to the database
- they are not part of a true CMS backend

This split is one of the most important architectural facts in the repo.

#### About page content model

The About page is a hybrid:

- admin edits are stored through the admin pages API
- the `pages` row with slug `about-us` stores structured JSON in `pages.content`
- `resolveAboutContent()` accepts either valid JSON or plain HTML fallback

So `about-us` is effectively a structured JSON CMS record hidden inside a generic `pages` table.

### Frontend-only or partially wired features

Several frontend types or query parameters are broader than the current backend implementation:

- `lib/api.ts` defines optional `vendor`, `options`, `variants`, `inventory_quantity`, and similar product fields not provided by the current Go API
- catalog query params include `vendor`, `color`, and `size`, but the current API only handles category, sort, featured, limit, q, price range, and tags
- `vendor` is sent by the web client but ignored by the current Go product handler
- color and size exist in page state but are not backed by current API filtering

These are placeholders or future-facing interfaces, not fully implemented live functionality.

## 5. Backend Architecture

### Backend stack

`apps/api` uses:

- Go 1.22
- Gin
- `database/sql` with `go-sql-driver/mysql`
- JWT (`github.com/golang-jwt/jwt/v5`)
- optional Redis (`github.com/redis/go-redis/v9`)

### Boot sequence

`apps/api/main.go` starts the service in this order:

1. `config.Load()`
2. ensure upload directory exists
3. open MySQL connection
4. apply migrations if `MIGRATE_ON_START=true`
5. apply seed if `SEED_ON_START=true`
6. validate CORS configuration when credentials are enabled
7. create Gin router
8. apply logging, recovery, trusted proxies, and CORS middleware
9. serve `/uploads`
10. create `handlers.Server`
11. register routes
12. run on configured port

### Configuration model

`apps/api/internal/config/config.go` centralizes environment loading for:

- database connectivity
- JWT and OTP secrets
- checkout thresholds and shipping fees
- upload limits
- auth and login throttling
- buyer/admin write rate limits
- API-wide rate limits
- Redis and cache settings
- CORS and trusted proxies
- Google OAuth
- SMTP/email sending
- VietQR

Defaults are implementation defaults, not necessarily safe production defaults. Example: `JWT_SECRET` falls back to `change-me` if not set.

### Database connectivity

`apps/api/internal/db/db.go`:

- builds a MySQL DSN with `parseTime=true`
- enables `multiStatements=true`
- uses charset `utf8mb4,utf8`
- sets max open connections to 20 and idle connections to 10

### Migration model

`apps/api/internal/migrations/migrations.go`:

- creates/uses a `schema_migrations` table
- reads `.sql` files in lexical order
- skips already applied versions
- marks each applied file by filename

Current migration sequence:

- `001_init.sql`
- `002_phase2.sql`
- `003_auth.sql`
- `004_admin_security.sql`
- `004_promotions.sql`
- `005_vietqr.sql`
- `006_orders_address_parts.sql`

### Seed model

`apps/api/internal/seed/seed.go` has conditional behavior:

- if no products exist, it applies all SQL seed files in lexical order
- if products already exist, it skips reseeding by default
- to refresh selected seed files on existing data, set `SEED_REFRESH_ON_START=true`

This default avoids unintended content overwrite on service restart.

### Route registration

`apps/api/internal/handlers/server.go` defines:

- `/healthz`
- `/api` base group with API-wide rate limiting
- `/api/auth` with auth-specific rate limiting
- `/api/account` user-protected group
- public catalog/content/checkout endpoints
- `/api/admin/login`
- `/api/admin/logout`
- `/api/admin/...` protected admin group

### Auth and session model

#### Access and admin tokens

- access tokens and admin tokens are JWTs signed with `JWT_SECRET`
- roles are carried in JWT claims (`user` or `admin`)
- admin auth uses a separate admin cookie name but the same signing secret

#### Refresh tokens

- refresh tokens are random opaque values
- only the SHA-256 hash is stored in `refresh_sessions`
- refresh rotates the session
- refresh token reuse detection revokes all active sessions for that user

#### Accepted auth transport

The backend accepts:

- `Authorization: Bearer ...`
- HTTP-only cookies

Cookie names:

- `ttc_access_token`
- `ttc_refresh_token`
- `ttc_admin_token`

Cookie behavior:

- `Secure` is enabled when public or frontend base URL is HTTPS, or app env is production
- SameSite is `None` when cross-origin credentials are enabled over secure transport
- otherwise SameSite is `Lax`

### User auth flows

Implemented backend auth flows include:

- Google OAuth
- Gmail/email OTP login
- email/password register
- email/password login
- logout
- refresh
- email verification OTP
- forgot-password OTP request / verify / reset
- password change
- session listing
- session revocation

Important config gate:

- when `AUTH_GMAIL_ONLY=true`, register and password login are rejected and users must use Google or Gmail OTP

### Google OAuth flow

`apps/api/internal/handlers/google_auth.go`:

- starts auth at `/api/auth/google/start`
- stores temporary state and redirect path in cookies
- exchanges the code with Google
- validates the ID token through Google's tokeninfo endpoint
- can enforce Gmail-only accounts if configured
- upserts a user and auth identity
- issues cookies plus returns token payload

### OTP flow

OTP records live in `otp_verifications` and support:

- send cooldown
- send rate limiting
- expiry
- max attempts
- purpose-specific verification

OTP email delivery:

- uses SMTP in production
- falls back to a development email sender that logs the email body locally when not in production

If the app env is production and SMTP is not configured, API startup fails because `buildEmailSender()` returns an error.

### Account lockout and login throttling

There are two layers:

1. Per-IP and per-identity rate limiting for login endpoints
2. Stored failed-attempt counters and temporary lockout on users and admin users

Current lockout fields:

- users: `failed_login_attempts`, `locked_until`, `last_login_at`
- admin_users: same pattern via `004_admin_security.sql`

### Rate limiting

Rate limiting lives in `apps/api/internal/handlers/rate_limit.go`.

It supports:

- Redis-backed counters when Redis is configured and reachable
- database-backed fallback via the `rate_limits` table when Redis is unavailable

Rate-limited areas include:

- all API routes
- auth routes
- order creation
- promo validation
- payment proof upload
- buyer write operations
- admin write operations
- email OTP sending
- login endpoints

### Caching

GET-response caching lives in `apps/api/internal/handlers/cache.go`.

It only activates when:

- `CACHE_ENABLED=true`
- Redis is enabled and reachable
- a positive TTL is passed into the middleware

Current cached endpoint groups:

- categories
- products list
- product detail
- posts list
- post detail
- page detail
- Q&A
- locations
- geo provinces
- geo districts
- checkout config
- payment settings
- promotions list

Cache entries store raw HTTP response bodies keyed by method plus request URI. Cache is skipped for responses marked `no-store` or `private`.

### Upload handling

There are two main upload paths:

- admin uploads via `/api/admin/uploads`
- payment proof uploads via `/api/orders/:id/payment-proof`

Current behavior:

- upload size is enforced by byte limit only
- filenames preserve the original extension
- saved filenames are timestamp-based, not content-addressed
- there is no MIME allowlist or file signature validation

### Geo dependency

Province and district resolution depends on `https://provinces.open-api.vn/api/?depth=2`.

Implementation details:

- data is cached in memory for 24 hours
- checkout and address APIs use this dataset to validate province and district names or codes
- if the API cannot reach this external source, location-dependent flows can fail

### Promotions and coupons

Promotion logic lives in `apps/api/internal/handlers/promotions.go`.

Supported coupon rules:

- normalized uppercase code matching
- `active` status check
- optional start time
- optional end time
- optional usage limit
- optional minimum subtotal
- `percent` or `amount` discount type
- optional `max_discount`

Order creation locks the selected coupon row with `FOR UPDATE` and increments `used_count` inside the order transaction.

### Order creation

Order creation lives in `apps/api/internal/handlers/orders.go`.

Flow summary:

1. validate JSON body and rate limit
2. normalize email and Vietnamese phone number
3. validate address parts and province/district when provided
4. ensure at least one item exists
5. default missing payment method to `cod`
6. ensure payment method is enabled in `payment_settings`
7. validate shipping method (`standard` or `express`)
8. load only published products for requested product IDs
9. compute subtotal from authoritative DB prices
10. enforce minimum order amount
11. compute shipping fee
12. validate and apply promotion inside a transaction
13. create order number
14. optionally attach `user_id` from the current user cookie or bearer token
15. create `orders` row
16. create `order_items` rows
17. commit

Order number format:

- prefix `TB`
- current date as `DDMMYY`
- literal `N`
- 4-digit daily sequence

Example shape: `TB100326N0001`

### Shipping and payment behavior

- `standard` shipping uses `StandardShippingFee`
- `express` shipping uses `ExpressShippingFee`
- free shipping only applies to `standard`
- free shipping is based on subtotal before discount
- payment method availability comes from the single `payment_settings` row

### Payment QR and payment proof

QR generation lives in `orders_qr.go` plus `vietqr.go`.

Supported behavior:

- QR is only available for orders whose payment method is `bank_transfer` or `bank_qr`
- transfer content defaults to the order number, trimmed to 25 characters if needed
- if a `bank_qr_payload` preset exists, the API first tries to build a quick-link QR image URL
- otherwise it builds a quick-link from bank metadata
- if quick-link building fails and VietQR credentials are configured, it can call VietQR generate APIs
- generated QR metadata is saved back to the `orders` row

Payment proof flow:

- saves uploaded file to uploads directory
- updates `payment_proof_url`
- sets `payment_status = 'proof_submitted'`

### Admin APIs

Admin behavior is straightforward REST over MySQL-backed entities:

- admin login/logout/me
- CRUD for products
- CRUD for categories
- CRUD for posts
- list/create/get/update for pages
- CRUD for Q&A
- list/get/update for orders
- get/update for payment settings
- generic upload endpoint

Note that admin pages do not have a delete endpoint in current code.

## 6. Data Model

The following table summaries describe current schema after all migrations, not just initial table creation.

| Table | Purpose | Key fields and notes |
| --- | --- | --- |
| `schema_migrations` | Tracks applied migration filenames | `version`, `applied_at` |
| `categories` | Product categories | `name`, `slug`, `description`, `sort_order` |
| `products` | Core sellable items | `name`, `slug`, `description`, `price`, `compare_at_price`, `featured`, `status`, `tags`, `sort_order` |
| `product_images` | Images per product | FK to `products`, `url`, `sort_order` |
| `product_categories` | Many-to-many between products and categories | unique `(product_id, category_id)` |
| `posts` | Blog/news posts | `title`, `slug`, `excerpt`, `content`, `cover_image`, `status`, `published_at`, `tags`, `sort_order` |
| `pages` | Generic page content | `title`, `slug`, `content`, `updated_at`; `about-us` is currently the most important live record |
| `qna` | FAQ / Q&A content | `question`, `answer`, `status`, `sort_order` |
| `locations` | Pickup/store locations | `name`, `province`, `district`, `address`, `phone`, `hours`, `sort_order` |
| `orders` | Order header | `order_number`, customer fields, full address fields, note, delivery time, promo code, shipping method, subtotal, shipping fee, discount, total, payment method, payment status, admin note, QR metadata, timestamps, optional `user_id` |
| `order_items` | Order line items | FK to `orders`, product snapshot fields, quantity, line total |
| `users` | Buyer accounts | email, phone in E.164 and national forms, profile fields, verification flags, password hash, birthdate, status, login lockout fields |
| `user_addresses` | Saved buyer addresses | FK to `users`, default flag, normalized province and district names |
| `admin_users` | Admin accounts | email, bcrypt password hash, role, failed login attempts, lockout fields, last login |
| `payment_settings` | Single-row payment config | COD toggle, bank transfer toggle, bank QR toggle, bank details, QR preset, bank ID, QR template |
| `auth_identities` | OAuth/external identity mapping | FK to `users`, provider plus provider user ID |
| `otp_verifications` | OTP send/verify records | channel, destination, code hash, purpose, expiry, attempts, send timestamps, completion state |
| `refresh_sessions` | Hashed refresh-token sessions | FK to `users`, user agent, IP, device ID, expiry, revoked state |
| `audit_logs` | Basic audit trail | optional `user_id`, `action`, `ip`, `meta_json`, `created_at` |
| `rate_limits` | DB fallback for rate limiting | `rate_key`, `window_start`, `count` |
| `coupons` | Promotion codes | code, type, value, max discount, min subtotal, start/end, usage limit, used count, status |

Important relationships:

- products -> product_images: one-to-many
- products -> categories: many-to-many through `product_categories`
- users -> user_addresses: one-to-many
- users -> refresh_sessions: one-to-many
- users -> auth_identities: one-to-many
- users -> orders: optional one-to-many
- orders -> order_items: one-to-many

## 7. API Surface

All API responses use the same envelope shape:

```json
{
  "success": true,
  "data": {}
}
```

Error responses use:

```json
{
  "success": false,
  "error": {
    "code": "string_code",
    "message": "Human readable message",
    "retry_at": "optional RFC3339 timestamp"
  }
}
```

### Public endpoints

| Endpoint group | Notes |
| --- | --- |
| `GET /api/categories` | Published category list |
| `GET /api/products` | Catalog list with category, featured, q, price, sort, tags filters |
| `GET /api/products/:slug` | Product detail |
| `GET /api/posts` | Post list, optional tag filter |
| `GET /api/posts/:slug` | Post detail |
| `GET /api/pages/:slug` | Generic page lookup; currently used mainly for `about-us` |
| `GET /api/qna` | Published FAQ entries |
| `GET /api/locations` | Store / pickup locations |
| `GET /api/geo/provinces` | Province list from external geo source |
| `GET /api/geo/districts?province_code=` | Districts for one province |
| `GET /api/checkout/config` | Minimum order and shipping thresholds from backend config |
| `GET /api/payment-settings` | Public payment settings snapshot |
| `GET /api/promotions` | Active promotions list |
| `POST /api/promotions/validate` | Validates promo code against subtotal |
| `POST /api/orders` | Creates guest or authenticated order |
| `GET /api/orders/:id/summary` | Minimal order summary for thank-you page |
| `PATCH /api/orders/:id/payment-method` | Changes payment method while order is still pending |
| `GET /api/orders/:id/payment/qr` | Returns QR metadata and QR image/data URL |
| `POST /api/orders/:id/payment-proof` | Uploads payment proof file |

### Auth endpoints

| Endpoint group | Notes |
| --- | --- |
| `GET /api/auth/google/start` | Starts Google OAuth |
| `GET /api/auth/google/callback` | Completes OAuth and issues cookies |
| `POST /api/auth/otp/request` | Requests login OTP |
| `POST /api/auth/otp/verify` | Verifies login OTP |
| `POST /api/auth/register` | Password registration; may be disabled by `AUTH_GMAIL_ONLY` |
| `POST /api/auth/login` | Password login; may be disabled by `AUTH_GMAIL_ONLY` |
| `POST /api/auth/logout` | Revokes refresh token and clears cookies |
| `POST /api/auth/refresh` | Rotates refresh session and reissues access token |
| `POST /api/auth/send-email-otp` | Logged-in email verification send |
| `POST /api/auth/verify-email-otp` | Logged-in email verification confirm |
| `POST /api/auth/forgot-password/request-otp` | Starts password reset |
| `POST /api/auth/forgot-password/verify-otp` | Returns verification token |
| `POST /api/auth/forgot-password/reset` | Resets password |
| `POST /api/auth/change-password` | Logged-in password change |
| `GET /api/auth/me` | Current user summary |
| `PATCH /api/auth/me` | Current user update |
| `GET /api/auth/sessions` | Lists refresh sessions |
| `POST /api/auth/sessions/:id/revoke` | Revokes one refresh session |

### Account endpoints

| Endpoint group | Notes |
| --- | --- |
| `GET /api/account/profile` | Buyer profile |
| `PATCH /api/account/profile` | Buyer profile update |
| `GET /api/account/addresses` | Saved addresses |
| `POST /api/account/addresses` | Create address |
| `PATCH /api/account/addresses/:id` | Update address |
| `DELETE /api/account/addresses/:id` | Delete address |
| `GET /api/account/orders` | Orders linked to authenticated user |

### Admin endpoints

| Endpoint group | Notes |
| --- | --- |
| `POST /api/admin/login` | Admin login using email and password |
| `POST /api/admin/logout` | Admin logout |
| `GET /api/admin/me` | Current admin profile |
| `GET/POST/GET/PATCH/DELETE /api/admin/products...` | Product CRUD |
| `POST /api/admin/products/:id/images` | Adds product image record |
| `GET/POST/GET/PATCH/DELETE /api/admin/categories...` | Category CRUD |
| `GET/POST/GET/PATCH/DELETE /api/admin/posts...` | Post CRUD |
| `GET/POST/GET/PATCH /api/admin/pages...` | Page list/create/get/update only |
| `GET/POST/GET/PATCH/DELETE /api/admin/qna...` | Q&A CRUD |
| `GET /api/admin/orders` | Order list |
| `GET /api/admin/orders/:id` | Order detail |
| `PATCH /api/admin/orders/:id` | Update status, payment status, note, and buyer fields |
| `GET /api/admin/payment-settings` | Payment settings |
| `PUT /api/admin/payment-settings` | Update payment settings |
| `POST /api/admin/uploads` | Generic admin upload endpoint |

## 8. Business Rules

### Checkout and order rules

- The backend is authoritative for price, subtotal, shipping fee, payment availability, and promo application.
- Minimum order amount is enforced in the API using `Config.MinOrderAmount`.
- Free shipping applies only to `standard` shipping, never to `express`.
- Shipping is calculated on subtotal before discount.
- Only `standard` and `express` shipping methods are valid.
- Only published products can be ordered.

### Payment rules

- Valid payment methods depend on the current `payment_settings` row.
- `cod` is allowed only when `cod_enabled=true`.
- `bank_transfer` is allowed only when `bank_transfer_enabled=true`.
- `bank_qr` is allowed only when `bank_qr_enabled=true`.
- The thank-you page normalizes `bank_qr` to `bank_transfer` in the UI.
- Payment method can only be changed while the order status is still `pending` and payment is not already marked paid.

### Promotion rules

- Codes are uppercased before validation.
- A coupon must be active and within its date window.
- `usage_limit` is enforced against `used_count`.
- `min_subtotal` is enforced.
- `percent` discounts can be capped by `max_discount`.
- Discount never exceeds subtotal.

### Auth rules

- `AUTH_GMAIL_ONLY=true` disables email/password register and login at the API layer.
- Google OAuth can also enforce Gmail-only accounts.
- User and admin logins are both protected by IP and identifier rate limits.
- Failed password logins increment counters and can temporarily lock the account.
- Refresh-token reuse causes global refresh-session revocation for that user.

### Email verification rules

- Logged-in users can request email verification OTP.
- OTP send is subject to cooldown and rate limit.
- Email verification status is exposed as `VERIFIED` or `UNVERIFIED`.

### Cookie and session rules

- Cookies are HTTP-only.
- Access and refresh cookies are the primary session transport for the frontend.
- SameSite changes depending on whether credentialed cross-origin mode is enabled with secure transport.

### Upload rules

- JSON request bodies and uploads are byte-limited by config.
- Current code does not validate MIME type or magic bytes.

## 9. Seeded and Demo Data

### Baseline content seed

`seed/001_seed.sql` creates baseline demo content:

- categories
- products
- product images
- product/category mappings
- posts
- pages
- Q&A entries
- locations

This seed is a mix of English demo content and Vietnamese content, with UTF-8 content quality checks enforced during seed execution.

### Payment settings seed

`seed/002_phase2.sql` seeds payment settings roughly equivalent to:

- bank: Vietcombank
- account number: `0123456789`
- holder: Tam Bo Ecommerce name
- bank QR enabled

### Admin seed accounts

Also in `seed/002_phase2.sql`:

- `admin@tambo.local` / `admin123`
- `admin2@tambo.local` / `admin123`

Both are bcrypt-backed admin accounts intended for local or internal use.

### Promotion seed

`seed/003_promotions.sql` seeds these promo codes:

- `WELCOME50`
- `FRESH10`
- `SAVE10`
- `SAVE20`
- `SAVE40`

They cover both amount and percent discount examples with different minimums and windows.

### Buyer test users

`seed/004_users.sql` creates:

- `buyer@tambo.local`
- `buyer2@tambo.local`

Important caveat:

- the repo includes Argon2 password hashes for these buyer users
- plaintext passwords are not documented in the seed files
- both users receive default saved addresses

### Other seeded operational defaults

- `about-us`, `return-policy`, and `terms-of-service` page rows
- sample blog posts
- sample locations
- sample Q&A

### Password helper

`tmp_bcrypt.go` exists to generate bcrypt hashes for admin password seeding or manual DB user creation.

## 10. Operations and Configuration

### Environment files

Environment templates and active local env files live under `infra/env`.

Main groups:

- `mysql.env` for database credentials
- `api.env` for API config
- `web.env` for Next.js build/runtime config

### API env groups

Major API env clusters include:

- database: `DB_*`
- auth: `JWT_SECRET`, `OTP_SECRET`, token TTLs
- business rules: `MIN_ORDER_AMOUNT`, `FREE_SHIPPING_THRESHOLD`, shipping fees
- boot behavior: `MIGRATE_ON_START`, `SEED_ON_START`
- network: `PUBLIC_BASE_URL`, `FRONTEND_BASE_URL`, `ALLOWED_ORIGINS`, `CORS_ALLOW_CREDENTIALS`, `TRUSTED_PROXIES`
- limits: body size, upload size, auth rate, API rate, buyer/admin write rates
- Redis/cache: `REDIS_*`, `CACHE_*`
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL`
- SMTP: `SMTP_*`
- VietQR: `VIETQR_*`

### Web env groups

Major frontend env clusters include:

- API base URLs: `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`
- site identity and contact: `NEXT_PUBLIC_SITE_NAME`, phone, email, address
- storefront defaults: `NEXT_PUBLIC_FREE_SHIPPING`, `NEXT_PUBLIC_MIN_ORDER`
- bank display info: bank name, account, holder
- social links and site URL
- locale and currency

### Build-time caveat for frontend env

`NEXT_PUBLIC_*` values are baked into the Next.js build. Changing them requires rebuilding the web app or image.

This matters for:

- site branding
- social/contact info
- public API URL
- bank display info
- free shipping and minimum order fallback values used by frontend UI

### Local development flow

Recommended path from docs:

```powershell
cd infra
docker compose up -d --build
```

Implementation-level nuance:

- the API container uses the `dev` target and runs `go run .` with the source tree mounted
- the web container uses the `runner` target and runs `npm start`, not `next dev`

So the local Docker stack is not symmetric:

- API is relatively development-oriented
- web is closer to a production runtime image

### Production flow

Production docs use:

```powershell
docker compose --env-file infra\env\web.env -f infra\docker-compose.prod.yml up -d --build
```

Production expectations:

- set real secrets
- set real domains
- configure SMTP
- update Nginx `server_name`
- add TLS separately

### Uploads and persistence

Persistent volumes:

- `mysql_data`
- `api_uploads`
- `redis_data` in local Compose

Uploads are not externalized to cloud storage in current code.

### Operational docs already in repo

- `docs/README_LOCAL.md`
- `docs/README_DEPLOY.md`
- `docs/HANDOVER_GUIDE.md`
- `docs/API.md`
- `docs/SECURITY_ASVS_L1.md`

`docs/SECURITY_ASVS_L1.md` is especially useful because it documents current API security gaps, including missing upload allowlists, session revocation gaps after password reset, and missing security headers.

## 11. Testing and Quality Checks

### API tests

Current Go tests are narrow and focused:

- `internal/auth/email_test.go`
- `internal/auth/otp_test.go`
- `internal/auth/phone_test.go`
- `internal/auth/tokens_test.go`
- `internal/handlers/vietqr_test.go`

What this means:

- auth helper logic has direct unit coverage
- VietQR helper behavior has direct unit coverage
- most HTTP handlers do not have full endpoint-level automated tests

### Web tests

`apps/web/tests/e2e` contains Playwright tests for:

- public UI smoke behavior
- admin UI rendering and interaction behavior

Important detail:

- Playwright runs the web app on port `3002`
- admin API calls are mocked in tests
- some public test setup relies on seeding local storage rather than a real backend

So these are UI-oriented tests, not full real-stack end-to-end tests.

### Standard commands

API:

```powershell
cd apps/api
go test ./...
```

Web:

```powershell
cd apps/web
npm run lint
npm run build
npm run test:e2e
```

### Mojibake guardrails

The web app has dedicated encoding checks:

- `npm run check:mojibake`
- `npm run fix:mojibake`

`npm run build` triggers `prebuild`, which runs the mojibake checker before building.

`apps/web/lib/format.ts` also includes runtime text repair helpers used by browser-local-storage-backed content settings.

## 12. Known Implementation Quirks and Caveats

### 1. Auth is cookie-first; token helpers are mostly legacy stubs

The real session system uses cookies. `apps/web/lib/auth.ts` does not currently store or return meaningful tokens.

Consequence:

- do not build new features assuming local storage access tokens are authoritative
- use cookie-aware fetch with `credentials: "include"`

### 2. Admin-managed content is split across DB and browser local storage

DB-backed admin content:

- products
- categories
- posts
- Q&A
- orders
- payment settings
- pages / about content

Browser-local-storage-backed admin content:

- banners
- contact settings
- promo popup
- notifications

Consequence:

- this is not a single-source CMS
- marketing settings are local to one browser profile unless manually re-entered elsewhere

### 3. Public `pages` support exists in the API, but most frontend pages do not consume it

Only `about-us` meaningfully uses the `pages` table in the public UI. Return policy, terms, and privacy are hardcoded page components today.

### 4. Some frontend types and query params are wider than the backend

Examples:

- vendor filters are sent by the frontend but ignored by the current Go product handler
- color and size query params are present in catalog routing state but are not handled server-side
- product type definitions include option/variant/inventory-style fields not currently returned by the Go API

These should be treated as placeholders, not live contract.

### 5. Contact and newsletter forms are not wired to a backend

They render UI only.

### 6. Guest orders are separate from account order history

Orders only appear under `/account/orders` if `orders.user_id` was populated during checkout, which only happens when a user cookie or bearer token was present.

### 7. The web Docker local path is not true hot-reload development

Local Compose uses the built `runner` image for web, not the `dev` target. Expect rebuild-based iteration rather than live Next.js dev server behavior in Docker.

### 8. Production Compose currently omits Redis

The API supports Redis-backed caching and rate limiting, but the production Compose template does not provision Redis. If those features are desired in production, infra changes are needed.

### 9. Upload hardening is incomplete

Current upload endpoints enforce size only. They do not enforce file type allowlists, signature checks, antivirus scanning, or unguessable content-derived names.

### 10. Some content in the repo shows mojibake or encoding artifacts

This appears in:

- seeded Vietnamese SQL content
- older hardcoded page strings
- some test fixtures and UI text

The repo contains mitigation utilities, but encoding cleanup is not complete everywhere.

### 11. Historical docs are partially stale

Examples:

- `docs/HANDOVER_GUIDE.md` still contains phase-history language from earlier project stages
- the project already has an admin UI and richer auth flows than the oldest phase docs describe

### 12. About page content uses a JSON-in-page-content pattern

This works today, but it is a convention rather than a dedicated typed content table.

### 13. Password reset and session invalidation are not fully hardened

The security gap doc calls out that session invalidation after password reset is not fully handled to ASVS expectations.

## 13. Fast-Start Notes for Future LLMs

When trying to understand or modify this codebase, start here:

### Best backend entrypoints

- `apps/api/main.go` for service bootstrap
- `apps/api/internal/config/config.go` for env and business defaults
- `apps/api/internal/handlers/server.go` for route map
- `apps/api/internal/handlers/orders.go` for checkout and order rules
- `apps/api/internal/handlers/auth_user.go` and `google_auth.go` for auth flows
- `apps/api/internal/handlers/admin_*.go` for admin behavior
- `apps/api/internal/handlers/rate_limit.go` and `cache.go` for cross-cutting middleware

### Best frontend entrypoints

- `apps/web/app/layout.tsx` for global shell
- `apps/web/app/page.tsx` for homepage composition
- `apps/web/app/collections/all/page.tsx` for catalog entry
- `apps/web/app/checkout/page.tsx` for checkout flow
- `apps/web/app/checkout/thank-you/page.tsx` for payment proof and QR flow
- `apps/web/app/account/page.tsx` for buyer account behavior
- `apps/web/app/admin/page.tsx` for admin architecture

### Best data-access files

- `apps/web/lib/api.ts`
- `apps/web/lib/account.ts`
- `apps/web/lib/user-auth.ts`
- `apps/web/lib/admin.ts`
- `apps/web/lib/auth-client.ts`
- `apps/web/lib/client-content.ts`

### Best schema and seed sources

- `migrations/*.sql` for authoritative schema evolution
- `seed/*.sql` for baseline operational data

### Best infra sources

- `infra/docker-compose.yml`
- `infra/docker-compose.prod.yml`
- `infra/nginx/default.conf`
- `infra/env/*.example`

### Best operational and risk docs

- `docs/README_LOCAL.md`
- `docs/README_DEPLOY.md`
- `docs/API.md`
- `docs/SECURITY_ASVS_L1.md`

### Heuristics for working safely in this repo

- Trust API code over frontend assumptions when business rules differ.
- Treat MySQL as the source of truth for prices, products, orders, users, and persisted content.
- Treat browser local storage as a separate, weaker source for some admin-managed marketing settings.
- Assume cookies, not local bearer tokens, are the current auth transport.
- Check migrations before extending types, because some frontend types are broader than the schema.
- Check whether a feature is truly DB-backed before proposing "CMS" changes; several admin screens are only browser-local today.
