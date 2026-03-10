# OWASP ASVS Level 1 Gap Analysis (API)

## Overview
- Assessment date: 2026-03-08
- ASVS version: 5.0.0 (latest at the time of assessment)
- Scope: API (Go/Gin) + API-related deployment/config
- Out of scope: Next.js frontend (unless directly impacting API)
- Method: code/config/docs review, no pentest

## Legend
- Pass: meets L1 requirement
- Partial: partially meets requirement
- Fail: not evidenced
- N/A: not applicable

## ASVS L1 Checklist (API)

### V1 — Architecture, Design and Threat Modeling
| ASVS ID | Control (summary) | Status | Evidence | Notes |
|---|---|---|---|---|
| V1.2.4 | Separate data and commands in DB queries (parameterized queries) | Partial | `apps/api/internal/handlers/auth_user.go:564`, `apps/api/internal/handlers/auth_user.go:1103` | Uses `?` placeholders, not fully audited |
| V1.5.1 | Secure XML parsing to prevent XXE | N/A | — | No XML parsing observed in API |

### V2 — Data Validation, Sanitization and Encoding
| ASVS ID | Control (summary) | Status | Evidence | Notes |
|---|---|---|---|---|
| V2.1.1 | Document input validation rules | Fail | — | No API-wide validation documentation found |
| V2.2.1 | Validate inputs before business decisions | Partial | `apps/api/internal/handlers/auth_user.go:92-146`, `apps/api/internal/handlers/orders.go:81-193` | Many validations exist, not centralized |
| V2.2.2 | Server-side validation enforced | Pass | `apps/api/internal/handlers/limits.go:17-36`, `apps/api/internal/handlers/auth_user.go:84-116` | `bindJSONWithLimit` + required fields |
| V2.3.1 | Enforce business workflow order | Fail | — | No general workflow enforcement beyond OTP reset |
| V2.4.1 | Automated abuse protection for sensitive endpoints | Pass | `apps/api/internal/handlers/rate_limit.go:15-37`, `apps/api/internal/handlers/auth_user.go:460-472` | Rate limits by IP/ID |

### V3 — Communication Security
| ASVS ID | Control (summary) | Status | Evidence | Notes |
|---|---|---|---|---|
| V3.2.1 | Prevent browsers from interpreting data as executable content | Fail | — | `X-Content-Type-Options` not set |
| V3.3.1 | Session cookies with `Secure` and safe prefix | Partial | `apps/api/internal/handlers/auth_cookies.go:16-35` | Uses `Secure`, no `__Secure-` prefix |
| V3.4.1 | Enable HSTS | Fail | — | HSTS header not configured |
| V3.4.2 | CORS allowlist + no `*` when credentials enabled | Pass | `apps/api/main.go:40-66`, `infra/env/api.env.example:54-56` | Allowlist + wildcard check |
| V3.4.4 | `X-Content-Type-Options: nosniff` | Fail | — | Not configured |

### V5 — File Handling
| ASVS ID | Control (summary) | Status | Evidence | Notes |
|---|---|---|---|---|
| V5.2.1 | Limit upload size/count | Partial | `apps/api/internal/handlers/limits.go:38-45`, `apps/api/internal/config/config.go:144-145` | Size limit exists, count limit not seen |
| V5.2.6 | Verify file signature by type | Fail | — | No signature/MIME allowlist checks |
| V5.2.7 | Store files with unguessable names | Partial | `apps/api/internal/handlers/admin_uploads.go:18-25` | Timestamp-based name is guessable |
| V5.2.9 | Allowlist upload file types | Fail | — | No file type constraints seen |

### V6 — Authentication
| ASVS ID | Control (summary) | Status | Evidence | Notes |
|---|---|---|---|---|
| V6.2.1 | Minimum password length (>= 8) | Pass | `apps/api/internal/config/config.go:124`, `apps/api/internal/auth/validate.go:10-20` | `PASSWORD_MIN_LENGTH=8` |
| V6.4.1 | MFA for privileged roles | Fail | — | No MFA for admin |
| V6.5.2 | Login uses POST | Pass | `apps/api/internal/handlers/server.go:57-59`, `apps/api/internal/handlers/server.go:105-108` | `/auth/login`, `/admin/login` |
| V6.5.5 | Consistent auth error messaging to reduce enumeration | Partial | `apps/api/internal/handlers/auth_user.go:520-523` | Largely consistent, some differentiation remains |

### V7 — Session Management
| ASVS ID | Control (summary) | Status | Evidence | Notes |
|---|---|---|---|---|
| V7.1.2 | Unique, unguessable session tokens | Pass | `apps/api/internal/auth/tokens.go:10-19`, `apps/api/internal/handlers/middleware.go:31-32` | Random refresh token + signed JWT |
| V7.2.2 | Invalidate sessions after password reset | Fail | `apps/api/internal/handlers/auth_user.go:712-739` | Password reset does not revoke sessions |
| V7.3.1 | Logout explicitly invalidates session | Pass | `apps/api/internal/handlers/auth_user.go:548-567` | Revoke refresh token + clear cookies |
| V7.3.2 | Session timeout/expiry | Pass | `apps/api/internal/config/config.go:116-118`, `apps/api/internal/handlers/auth_user.go:597-618` | TTL + expiry checks |

### V8 — Authorization
| ASVS ID | Control (summary) | Status | Evidence | Notes |
|---|---|---|---|---|
| V8.1.1 | Deny by default, allow by role | Partial | `apps/api/internal/handlers/middleware.go:52-79`, `apps/api/internal/handlers/server.go:60-108` | `requireRole` present, no resource-level checks |

### V9 — Data Protection
| ASVS ID | Control (summary) | Status | Evidence | Notes |
|---|---|---|---|---|
| V9.1.2 | Minimize storage of sensitive data | Fail | — | No explicit minimization policy |
| V9.2.1 | Encrypt sensitive data at rest | Fail | — | No at-rest encryption mechanism seen |

### V12 — API and Web Service
| ASVS ID | Control (summary) | Status | Evidence | Notes |
|---|---|---|---|---|
| V12.1.1 | API endpoints documented | Pass | `docs/API.md` | API documentation exists |

## Priority Gaps (high impact, low effort)
1. Add **security headers**: `HSTS`, `X-Content-Type-Options`, `Content-Security-Policy` (if appropriate).
2. **Remove default secrets** like `change-me` and require env configuration (`JWT_SECRET`, `OTP_SECRET`).
3. **Revoke sessions on password reset/change** to reduce session fixation risk.
4. **Harden uploads**: file type allowlist + signature checks (magic bytes) + block executable uploads.
5. **MFA for admin** or at least OTP/email second factor.

## Configuration Risks
- `JWT_SECRET` defaults to `change-me` if not set (`apps/api/internal/config/config.go:105`, `infra/env/api.env.example:8`).
- `CORS_ALLOW_CREDENTIALS=true` requires strict `ALLOWED_ORIGINS` (`apps/api/main.go:40-43`).
- Cookie `Secure` depends on HTTPS `PUBLIC_BASE_URL`/`FRONTEND_BASE_URL` (`apps/api/internal/handlers/auth_cookies.go:16-35`).

## Roadmap to L2/L3
1. Formalize validation documentation, threat modeling, and sensitive data handling.
2. Add monitoring/alerting and a complete audit trail.
3. Implement object-level authorization.
4. Enhance file upload verification (antivirus/MIME+signature allowlists).
5. Reassess against ASVS L2/L3 after L1 completion.
