# Google Login + Gmail OTP Setup Guide

This guide explains how to configure buyer authentication with:

- Google OAuth login (`/api/auth/google/start` -> `/api/auth/google/callback`)
- Gmail OTP login (`/api/auth/otp/request` + `/api/auth/otp/verify`)

It covers both local Docker and production deployment.

## 1. Scope and Current Behavior

- Google OAuth login is handled by the API and issues HTTP-only auth cookies on success.
- OTP login supports Gmail addresses only (`@gmail.com`, `@googlemail.com`).
- If `AUTH_GMAIL_ONLY=true`, password register/login endpoints are disabled:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- This document is for buyer auth only (not admin login).

## 2. Local Setup (Docker + localhost)

### 2.1 Create Google OAuth credentials

1. Open Google Cloud Console -> `APIs & Services` -> `Credentials`.
2. Create (or reuse) an OAuth 2.0 Client ID of type **Web application**.
3. Add redirect URI exactly:
   - `http://localhost:8080/api/auth/google/callback`
4. Save and copy:
   - `Client ID`
   - `Client Secret`

### 2.2 Update API env

Set these values in `infra/env/api.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/google/callback
```

Recommended related values for local:

```env
PUBLIC_BASE_URL=http://localhost:8080
FRONTEND_BASE_URL=http://localhost:3000
CORS_ALLOW_CREDENTIALS=true
ALLOWED_ORIGINS=http://localhost:3000
```

### 2.3 Rebuild/restart stack

```bash
cd infra
docker compose up -d --build
```

### 2.4 Quick verification

Open:

`http://localhost:8080/api/auth/google/start?redirect=/account`

Expected result:

- API responds with HTTP `302` redirect to `https://accounts.google.com/...`
- You should no longer see `google_not_configured`

## 3. Gmail OTP Email Delivery

### 3.1 Local behavior without SMTP

In non-production environments, if SMTP is not configured, OTP emails are not sent to Gmail inbox.  
The API logs the email content to the API logs (`[DEV] Email to ...`), which is intended for local testing.

To inspect OTP in local Docker:

```bash
cd infra
docker compose logs -f api
```

### 3.2 Gmail SMTP setup (recommended for real delivery)

Use a Gmail account with 2-Step Verification enabled, then generate an App Password.

Set in `infra/env/api.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_gmail_address
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM=your_gmail_address
SMTP_FROM_NAME=Your App Name
```

Compatibility fallback is also supported by config loader:

```env
GMAIL_SMTP_USER=your_gmail_address
GMAIL_SMTP_APP_PASSWORD=your_16_char_app_password
```

Notes:

- `SMTP_*` values take priority.
- In production, missing SMTP config causes API startup failure.

## 4. Production Setup

### 4.1 URLs and HTTPS

Use HTTPS for all public URLs:

```env
PUBLIC_BASE_URL=https://api.your-domain.com
FRONTEND_BASE_URL=https://www.your-domain.com
GOOGLE_REDIRECT_URL=https://api.your-domain.com/api/auth/google/callback
```

In Google Cloud OAuth client, add the same production callback URI exactly.

### 4.2 CORS and cookie prerequisites

For cross-origin cookie auth (`web` and `api` on different origins):

```env
CORS_ALLOW_CREDENTIALS=true
ALLOWED_ORIGINS=https://www.your-domain.com
```

Requirements from current backend behavior:

- `ALLOWED_ORIGINS` must be explicit (no `*`) when credentials are enabled.
- Cookies are `Secure` in production/HTTPS and must be sent with browser credentialed requests.
- Frontend requests must use `credentials: include` (already implemented in auth client flow).

### 4.3 Consent screen checklist

- Configure OAuth consent screen app info.
- Add support email and authorized domain(s).
- If app is in **Testing** mode, add test users.
- Publish to **Production** when ready for public users.

## 5. Troubleshooting by API Error Code

### `google_not_configured`
- Cause: Missing `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, or `GOOGLE_REDIRECT_URL`.
- Fix: Set env vars in `infra/env/api.env`, restart API container.

### `invalid_state`
- Cause: OAuth state cookie missing/mismatch (expired cookie, callback opened in different browser/session, blocked cookies).
- Fix: Start login again from frontend and complete flow in same browser/session; verify cookie policy and domain consistency.

### `google_exchange_failed`
- Cause: Google code exchange failed (wrong client secret, redirect URI mismatch, expired/used code).
- Fix: Verify client secret and callback URI match exactly in Google Cloud and API env; retry login.

### `google_token_invalid`
- Cause: ID token verification failed or token audience does not match your client ID.
- Fix: Ensure OAuth client ID in API env is the same one used by callback flow.

### `gmail_only`
- Cause: Account email is not Gmail, or endpoint is blocked by `AUTH_GMAIL_ONLY=true`.
- Fix: Use Gmail for Google/OTP login; set `AUTH_GMAIL_ONLY=false` only if you want to re-enable password flows.

### `otp_cooldown`
- Cause: OTP was requested too recently.
- Fix: Wait for cooldown and retry (check `Retry-After` header if present).

### `otp_rate_limited`
- Cause: OTP send attempts exceeded rate limit window.
- Fix: Wait until rate-limit window resets; reduce retries from same user/IP.

### `email_send_failed`
- Cause: SMTP delivery failed.
- Fix: Verify SMTP host/port/credentials/app password, sender address, and network egress to SMTP server.

## 6. Verification Checklist

Use this checklist after configuration:

1. Google start endpoint redirects to Google (not `google_not_configured`).
2. Google callback sets auth cookies and returns user to frontend target path.
3. OTP request (`POST /api/auth/otp/request`) returns `request_id` and `cooldown_seconds`.
4. OTP verify (`POST /api/auth/otp/verify`) logs user in and sets auth cookies.
5. In local non-production without SMTP, OTP appears in API logs.
6. In production, SMTP is configured and API starts successfully.

## 7. Minimal Local Test Commands

Request OTP:

```bash
curl -X POST http://localhost:8080/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"yourname@gmail.com\"}"
```

Verify OTP:

```bash
curl -X POST http://localhost:8080/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d "{\"request_id\":123,\"code\":\"123456\"}" \
  -i
```

Check health:

```bash
curl http://localhost:8080/healthz
```
