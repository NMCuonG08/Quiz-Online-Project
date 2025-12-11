# Quiz Online Monorepo

Monorepo gồm hai dự án:
- `server/`: Backend NestJS (Node 22, Prisma, Postgres, Redis)
- `web/`: Frontend Next.js

Trình quản lý gói: **pnpm** (workspace) qua corepack.

## Yêu cầu
- Node 22.x (khớp `engines`)
- pnpm 9 (dùng corepack, không cần cài global)
- Docker (tuỳ chọn cho build/run)

## Cài đặt (chạy ở thư mục gốc)
```bash
corepack enable
corepack prepare pnpm@9.12.3 --activate
pnpm install              # tạo pnpm-lock.yaml chung cho workspace
```

## Lệnh thường dùng (chạy tại gốc repo)
- Backend:
  - `pnpm --filter server run start:dev`
  - `pnpm --filter server run build`
  - `pnpm --filter server run test` / `test:e2e`
  - `pnpm --filter server run prisma:seed`
- Frontend:
  - `pnpm --filter web run dev` (port 5173)
  - `pnpm --filter web run build`
  - `pnpm --filter web run start`

## Docker
- Backend: `cd server && docker compose up --build` (dùng `server/docker-compose.yml`).
- Frontend: `cd web && docker build -t quiz-web . && docker run -p 3000:3000 quiz-web`.
- Sản xuất backend: `server/docker-compose.prod.yml` (build image đã push hoặc chỉnh ECR).

## Môi trường
- Sao chép `server/env.sample` thành `server/.env` và cấu hình Postgres/Redis/Cloudinary/JWT trước khi chạy backend (local hoặc Docker).
- Frontend: cấu hình biến môi trường Next theo nhu cầu (API endpoint, v.v.).

## Cấu trúc nhanh
- `pnpm-workspace.yaml` – định nghĩa packages (`server`, `web`)
- `server/` – NestJS, Prisma, Dockerfile, docker-compose
- `web/` – Next.js, Dockerfile
- `docker/` – (nếu dùng) compose phụ trợ ngoài backend

## Ghi chú
- Toàn bộ Dockerfile đã dùng pnpm (corepack). Không cần `npm install` trong build.
- Luôn chạy lệnh từ root để pnpm hoán đổi cache/lock thống nhất.***

