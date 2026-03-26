# API Contract

Base URL (local): `http://localhost:8080`

Response envelope:
```
{ "success": true, "data": {} }
```

## Public
- `GET /api/categories`
- `GET /api/products?category=&sort=&sort_by=&featured=&limit=&q=&price_min=&price_max=&tags=`
- `GET /api/products/:slug`
- `GET /api/posts`
- `GET /api/posts/:slug`
- `GET /api/pages/:slug`
- `GET /api/qna`
- `GET /api/locations`
- `GET /api/geo/provinces`
- `GET /api/geo/districts?province_code=`
- `GET /api/checkout/config`
- `GET /api/payment-settings`
- `GET /api/promotions`
- `POST /api/promotions/validate`
- `POST /api/orders`
- `GET /api/orders/:id/summary`
- `PATCH /api/orders/:id/payment-method`
- `GET /api/orders/:id/payment/qr`
- `POST /api/orders/:id/payment-proof` (multipart field `file`)

## Auth
- `GET /api/auth/google/start` (redirects to Google)
- `GET /api/auth/google/callback` (Google OAuth callback)
- `POST /api/auth/otp/request`
- `POST /api/auth/otp/verify`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/send-email-otp`
- `POST /api/auth/verify-email-otp`
- `POST /api/auth/forgot-password/request-otp`
- `POST /api/auth/forgot-password/verify-otp`
- `POST /api/auth/forgot-password/reset`
- `POST /api/auth/change-password`
- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `GET /api/auth/sessions`
- `POST /api/auth/sessions/:id/revoke`

## Account (user token required)
- `GET /api/account/profile`
- `PATCH /api/account/profile`
- `GET /api/account/addresses`
- `POST /api/account/addresses`
- `PATCH /api/account/addresses/:id`
- `DELETE /api/account/addresses/:id`
- `GET /api/account/orders`

## Admin (admin token required)
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/me`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `GET /api/admin/products/:id`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/admin/products/:id/images`
- `PUT /api/admin/products/:id/images`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `GET /api/admin/categories/:id`
- `PATCH /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- `GET /api/admin/posts`
- `POST /api/admin/posts`
- `GET /api/admin/posts/:id`
- `PATCH /api/admin/posts/:id`
- `DELETE /api/admin/posts/:id`
- `GET /api/admin/qna`
- `POST /api/admin/qna`
- `GET /api/admin/qna/:id`
- `PATCH /api/admin/qna/:id`
- `DELETE /api/admin/qna/:id`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id`
- `GET /api/admin/payment-settings`
- `PUT /api/admin/payment-settings`
- `POST /api/admin/uploads`

## Auth Transport Notes
- Tokens can be provided via `Authorization: Bearer <token>`.
- The API also sets HTTP-only cookies for access/refresh/admin tokens when using cookie auth.
- When `AUTH_GMAIL_ONLY=true`, email/password register/login endpoints are disabled. Use Google or Gmail OTP login.
