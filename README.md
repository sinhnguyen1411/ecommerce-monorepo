# Tam Bo Ecommerce + Blog Monorepo (Phase 1-2)

Monorepo full-stack cho website thuong mai dien tu + blog, lay cam hung tu nongduoctambo.com.vn. Repo gom storefront Next.js, API Go (Gin) va MySQL, kem admin dashboard va he thong auth (OTP + Google OAuth). Phu hop demo nhanh, ban giao khach hang va trien khai production.

## Tinh nang chinh
- Storefront: trang chu, danh muc, loc/sap xep, chi tiet san pham, quick view, san pham lien quan, recently viewed.
- Gio hang: cap nhat so luong, ghi chu, kiem tra don toi thieu, tien trinh free shipping.
- Checkout: chon shipping/payment, ap ma khuyen mai, tao don, upload bang chung chuyen khoan.
- Blog + trang tinh: bai viet, About, Q&A, Locations, Return Policy, Terms.
- Auth nguoi dung: dang ky OTP email/SMS, dang nhap email/phone + mat khau, Google OAuth, refresh token.
- Tai khoan: thong tin ca nhan, dia chi giao hang, lich su don.
- Admin: CRUD san pham, danh muc, bai viet, Q&A, payment settings, quan ly don hang, upload assets.

## Tech stack
- Web: Next.js 14 (App Router) + Tailwind + shadcn/ui
- API: Go 1.22 + Gin
- DB: MySQL 8
- Infra: Docker Compose + Nginx (prod template)

## Kien truc
- MySQL luu catalog, bai viet, don hang, nguoi dung.
- Go API cung cap REST endpoints cho storefront, checkout va admin.
- Next.js consume API, render trang va xu ly cart client-side.
- Uploads duoc luu o disk va public qua `/uploads`.

## Cau truc repo
```
.
+-- apps/
|   +-- api/            Go API service
|   +-- web/            Next.js storefront + admin UI
+-- infra/              docker compose, env, nginx config
+-- migrations/         SQL migrations
+-- seed/               SQL seed data (auth/admin/promotions)
+-- docs/               huong dan local, deploy, handover
+-- tmp_bcrypt.go       tool tao bcrypt hash nhanh
```

## Yeu cau
- Docker Desktop (khuyen nghi de chay full stack)
- Node.js 20+ (neu chay web thu cong)
- Go 1.22 (neu chay API thu cong)
- MySQL 8 (neu khong dung Docker)

## Cau hinh moi truong
Env files nam trong `infra/env/`. Sao chep tu `.example` va cap nhat gia tri:

```
Copy-Item infra\env\mysql.env.example infra\env\mysql.env
Copy-Item infra\env\api.env.example infra\env\api.env
Copy-Item infra\env\web.env.example infra\env\web.env
```

Bien quan trong:
- API: `DB_*`, `JWT_SECRET`, `OTP_SECRET`, `MIGRATE_ON_START`, `SEED_ON_START`
- Kinh doanh: `MIN_ORDER_AMOUNT`, `FREE_SHIPPING_THRESHOLD`
- URL: `PUBLIC_BASE_URL`, `FRONTEND_BASE_URL`, `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`
- Auth: `GOOGLE_CLIENT_*`, `GOOGLE_REDIRECT_URL`
- CORS: `ALLOWED_ORIGINS`, `CORS_ALLOW_CREDENTIALS`, `TRUSTED_PROXIES`
- OTP/SMTP/SMS: `OTP_*`, `SMTP_*`, `SMS_PROVIDER`

Luu y: `NEXT_PUBLIC_*` duoc bake vao build Next.js. Doi gia tri -> rebuild web image.

## Chay local bang Docker (khuyen nghi)

```
cd infra
docker compose up -d --build
```

Kiem tra:
```
curl http://localhost:8080/healthz
curl http://localhost:3000
```

Ports:
- Web: `http://localhost:3000`
- API: `http://localhost:8080`
- MySQL: `localhost:3007` (user/pass theo `infra/env/mysql.env`)

Logs:
```
docker compose logs -f api
docker compose logs -f web
```

Reset data:
```
docker compose down -v
```

## Chay rieng tung dich vu (tuy chon)

### API
1) Bat MySQL bang Docker:
```
cd infra
docker compose up -d mysql
```
2) Chinh `infra/env/api.env`: `DB_HOST=localhost`, `DB_PORT=3007`.
3) Chay API:
```
cd apps/api
go run .
```

### Web
```
cd apps/web
npm install
npm run dev
```
Dam bao `NEXT_PUBLIC_API_URL=http://localhost:8080` (hoac set qua env).

## Migrations va seed
- Migrations tu dong chay khi `MIGRATE_ON_START=true`.
- Seed chay 1 lan khi `SEED_ON_START=true` va bang trong.
- File nam o `migrations/` va `seed/`.

Seed mac dinh gom:
- Admin user: `admin@tambo.local` / `admin123`
- Payment settings
- Coupons: `WELCOME50`, `FRESH10`, `SAVE10`, `SAVE20`, `SAVE40`

Can tao admin moi? Dung `tmp_bcrypt.go` de tao hash:
```
go run tmp_bcrypt.go
```

## Giao dien (routes)
- `/`: home
- `/products`, `/products/[slug]`
- `/cart`, `/checkout`, `/checkout/thank-you`
- `/blog`, `/blog/[slug]`
- `/pages/about-us`, `/pages/hoi-dap-cung-nha-nong`, `/pages/locations`, `/pages/return-policy`, `/pages/terms-of-service`
- `/login`, `/signup`, `/forgot-password`
- `/account`, `/account/addresses`, `/account/orders`
- `/admin`, `/admin/login`

## API
Base URL: `http://localhost:8080`

Response:
```
{ "success": true, "data": {} }
```

Public:
- `GET /api/categories`
- `GET /api/products?category=&sort=&featured=&limit=`
- `GET /api/products/:slug`
- `GET /api/posts`
- `GET /api/posts/:slug`
- `GET /api/pages/:slug`
- `GET /api/qna`
- `GET /api/locations`
- `GET /api/payment-settings`
- `GET /api/promotions`
- `POST /api/promotions/validate`
- `POST /api/orders`
- `POST /api/orders/:id/payment-proof` (multipart field `file`)

Auth:
- `POST /api/auth/signup/request-otp`
- `POST /api/auth/signup/verify-otp`
- `POST /api/auth/signup/complete`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password/request-otp`
- `POST /api/auth/forgot-password/verify-otp`
- `POST /api/auth/forgot-password/reset`
- `POST /api/auth/change-password`
- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `GET /api/auth/sessions`
- `POST /api/auth/sessions/:id/revoke`
- `POST /api/auth/link-email/request-otp`
- `POST /api/auth/link-email/verify-otp`
- `POST /api/auth/link-email/complete`
- `POST /api/auth/link-phone/request-otp`
- `POST /api/auth/link-phone/verify-otp`
- `POST /api/auth/link-phone/complete`
- `POST /api/auth/google/start`
- `GET /api/auth/google/login`
- `GET /api/auth/google/callback`

Account (user token):
- `GET /api/account/profile`
- `PATCH /api/account/profile`
- `GET /api/account/addresses`
- `POST /api/account/addresses`
- `PATCH /api/account/addresses/:id`
- `DELETE /api/account/addresses/:id`
- `GET /api/account/orders`

Admin:
- `POST /api/admin/login`
- `GET /api/admin/me`
- `GET/POST/PATCH/DELETE /api/admin/products`
- `POST /api/admin/products/:id/images`
- `GET/POST/PATCH/DELETE /api/admin/categories`
- `GET/POST/PATCH/DELETE /api/admin/posts`
- `GET/POST/PATCH/DELETE /api/admin/qna`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id`
- `GET /api/admin/payment-settings`
- `PUT /api/admin/payment-settings`
- `POST /api/admin/uploads`

## Auth notes
- Access token gui qua `Authorization: Bearer <token>`.
- Refresh token tra ve trong response JSON.
- OTP duoc log ra console khi `APP_ENV` khac production.
- Neu dung cookie auth: set `CORS_ALLOW_CREDENTIALS=true` va `ALLOWED_ORIGINS` phai cu the (khong duoc `*`).

## Uploads
- Local (khong Docker): `apps/api/uploads`
- Docker: volume `api_uploads`
- Truy cap qua `http://localhost:8080/uploads/...`

## Kiem thu

### Tu dong
```
cd apps/api
go test ./...
```

```
cd apps/web
npm run lint
```

### Manual QA checklist
- Storefront: mo home, vao danh muc, loc/sap xep san pham, mo chi tiet.
- Cart: them san pham, cap nhat so luong, kiem tra min order + free shipping.
- Checkout: chon shipping/payment, ap coupon (`WELCOME50`, `FRESH10`), tao don.
- Payment proof: upload file o trang thank-you, kiem tra file trong `/uploads`.
- Blog: xem list va detail, related posts.
- Auth: dang ky OTP (email/SMS), dang nhap, quen mat khau.
- Account: cap nhat profile, them dia chi, xem lich su don.
- Admin: dang nhap, CRUD san pham/danh muc/bai viet/Q&A, cap nhat don hang va payment settings.

## Deploy (VPS)
Xem `docs/README_DEPLOY.md`. Tom tat:
```
docker compose --env-file infra\env\web.env -f infra\docker-compose.prod.yml up -d --build
```
Nginx config o `infra/nginx/default.conf`.

## Backup/Restore MySQL
Backup:
```
docker exec tambo_mysql mysqldump -u root -pYOUR_ROOT_PASSWORD tambo > backup.sql
```

Restore:
```
Get-Content backup.sql | docker exec -i tambo_mysql mysql -u root -pYOUR_ROOT_PASSWORD tambo
```

## Tai lieu
- `docs/README_LOCAL.md`: local setup chi tiet
- `docs/README_DEPLOY.md`: trien khai VPS
- `docs/HANDOVER_GUIDE.md`: quy trinh ban giao + content
- `apps/web/README_UI.md`: tom tat UI storefront

## Roadmap
- Phase 3: mo rong tim kiem dia diem, promotions, delivery slots
