# TTC Ecommerce + Blog (Phase 1)

Monorepo for a production-ready ecommerce + blog website inspired by nongnghiepttc.com.vn.

## Stack
- Frontend: Next.js App Router + Tailwind CSS
- Backend: Go (Gin)
- Database: MySQL 8
- Local & prod: Docker Compose

## Structure
- apps/api - Go API
- apps/web - Next.js frontend
- infra - Docker Compose, env files, nginx
- migrations - SQL migrations
- seed - seed scripts
- docs - local/deploy/handover guides

## Quick start

```
cd infra
docker compose up -d --build
```

## Documentation
- docs/README_LOCAL.md
- docs/README_DEPLOY.md
- docs/HANDOVER_GUIDE.md
