Getting Started
===============

This repository contains:
- `apps/api`: Go/Gin API service
- `apps/web`: Next.js storefront and admin UI
- `infra`: Docker Compose setup for MySQL, Redis, API, and web

Prerequisites
- Docker Desktop for full-stack local runtime and Playwright E2E
- Node.js 20+
- Go 1.22 if you run the API outside Docker

Recommended local runtime
1. Start the full stack:
   - `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-env.ps1`
   - review `infra/env/*.env` if you need local overrides
   - `cd infra`
   - `docker compose up -d --build`
2. Restart web with fresh code (rebuild only web service):
   - `powershell -ExecutionPolicy Bypass -File .\infra\restart-web.ps1`
   - manual equivalent:
     - `docker compose -f infra/docker-compose.yml up -d --build web`
     - `docker compose -f infra/docker-compose.yml ps`
     - `curl.exe http://localhost:3000`
     - `curl.exe http://localhost:8080/healthz`
3. Verify:
   - `http://localhost:8080/healthz`
   - `http://localhost:3000`

Manual runtime
1. Bootstrap env files first:
   - `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-env.ps1`
2. API:
   - if MySQL runs via Docker, set `DB_HOST=localhost` and `DB_PORT=3007` in `infra/env/api.env`
   - `cd apps/api`
   - `go run .`
3. Web:
   - `cd apps/web`
   - `npm install`
   - `npm run dev`

E2E workflow
1. Standard command:
   - `cd apps/web`
   - `npm run test:e2e`
2. What it does:
   - starts `mysql`, `redis`, and `api` with Docker Compose
   - waits for `http://localhost:8080/healthz`
   - runs Playwright against the Next.js dev server
   - stops only the backend services it started
3. Raw Playwright mode:
   - `npm run test:e2e:raw`
   - use this only if backend services are already running and healthy

Notes
- The E2E suite is no longer intended to run backendless.
- The wrapper keeps database volumes intact because it uses `docker compose stop`, not `down -v`.
- For production-like local checks, refer to `infra/docker-compose.prod.yml`.
