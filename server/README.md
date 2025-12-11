# Quiz Backend (NestJS)

Backend service for Quiz Online. Uses Node 22, NestJS 11, Prisma, Redis, Postgres. Package manager: **pnpm** (workspace shared with `web/`).

## Requirements
- Node 22.x (matches `engines`)
- pnpm 9 (via `corepack`)
- Docker (optional)

## Install (workspace root)
```bash
corepack enable
corepack prepare pnpm@9.12.3 --activate
pnpm install          # run at repo root to install all packages
```

## Useful commands (run at repo root)
- `pnpm --filter server run start:dev` – dev mode with watch
- `pnpm --filter server run build` – compile
- `pnpm --filter server run test` – unit tests
- `pnpm --filter server run test:e2e` – e2e tests
- `pnpm --filter server run prisma:seed` – seed DB

## Run with Docker (local)
In `server/`:
```bash
docker compose up --build
```
The Dockerfile now installs dependencies with pnpm; no npm is used inside images.

## Env
Copy `env.sample` to `.env` and adjust DB/Redis/Cloudinary/JWT settings before running locally or in Docker.
