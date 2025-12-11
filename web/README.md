# Quiz Frontend (Next.js)

Frontend for Quiz Online built with Next.js 15, React 19. Package manager: **pnpm** (shared workspace with `server/`).

## Requirements
- Node 22.x
- pnpm 9 (via `corepack`)

## Install (workspace root)
```bash
corepack enable
corepack prepare pnpm@9.12.3 --activate
pnpm install          # run once at repo root
```

## Development
From repo root:
```bash
pnpm --filter web run dev
```
Default dev port is 5173 (configured in `package.json`).

## Production build / start
```bash
pnpm --filter web run build
pnpm --filter web run start
```

## Docker
The `web/Dockerfile` uses pnpm in both build and runtime stages. Build and run:
```bash
cd web
docker build -t quiz-web .
docker run -p 3000:3000 quiz-web
```

## Env
Configure environment variables as required by the app (e.g. API endpoints, Next auth/config) before running in production.
