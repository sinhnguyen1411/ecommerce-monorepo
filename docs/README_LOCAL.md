# Local Development

This monorepo runs MySQL, the Go API, and the Next.js frontend with Docker Compose.

## Requirements
- Docker Desktop (or Docker Engine + Compose)

## Setup

1) Review env files:

```
infra\env\mysql.env
infra\env\api.env
infra\env\web.env
```

2) Start the stack:

```
cd infra
docker compose up -d --build
```

3) Verify services:

```
curl http://localhost:8080/healthz
curl http://localhost:3000
```

## Notes
- Migrations run on API start (MIGRATE_ON_START=true).
- Seed data loads on first start (SEED_ON_START=true).
- Uploaded files are stored in the api_uploads volume.

## Reset data

```
docker compose down -v
```

Then start again to re-run migrations and seeds.

## Useful commands

```
docker compose ps
docker compose logs -f api
docker compose logs -f web
```
