# Quiz Online Monorepo

## Demo: https://quiz-game-five-dun.vercel.app
## Swagger API Document: https://caffee-ngon.me/api


Welcome to the **Quiz Online** repository! This is a modern, real-time web application designed to create, manage, and participate in online quizzes. Built with scalability and performance in mind, this project is structured as a monorepo utilizing `pnpm` workspaces, seamlessly integrating a **Next.js** frontend and a **NestJS** backend.

---

## 🚀 Features

- **Real-time Interactions:** Powered by Socket.io and Redis for live quiz sessions, multiplayer features, and instant feedback.
- **Robust Authentication:** Secure JWT-based authentication using Passport.js with refresh token capabilities.
- **Advanced State Management:** Redux Toolkit combined with Redux Persist on the frontend for reliable state holding.
- **Media Management:** Deep integration with Cloudinary for fast and optimized image uploads (e.g., quiz thumbnails, user avatars).
- **Email Notifications:** Custom transactional emails built with React Email and dispatched via NodeMailer.
- **Background Processing:** BullMQ integration for handling heavy background jobs and scheduled tasks.
- **Modern UI/UX:** Responsive, accessible, and beautifully designed interfaces using TailwindCSS, Shadcn UI, and Framer Motion.
- **Internationalization:** Multi-language support out-of-the-box leveraging `next-intl`.
- **Comprehensive Monitoring:** Support for OpenTelemetry (OTEL) on the backend for in-depth metrics and tracing.

---

## 🛠 Tech Stack

### Workspace & Tooling
- **Package Manager:** [pnpm](https://pnpm.io/) (via Corepack)
- **Engine Requirements:** Node.js `>= 22.x`
- **Monorepo Structure:** pnpm Workspaces
- **Git Hooks:** Husky

### Frontend (`/web`)
- **Framework:** [Next.js](https://nextjs.org/) (React 19)
- **Styling:** TailwindCSS, Shadcn UI
- **Animations:** Framer Motion, Lottie Web
- **State Management:** Redux Toolkit (`@reduxjs/toolkit`), Redux Persist
- **Form Handling:** React Hook Form, Zod (Schema Validation)
- **Data Visualization:** ApexCharts, Recharts
- **Websockets:** `socket.io-client`

### Backend (`/server`)
- **Framework:** [NestJS](https://nestjs.com/) v11
- **Database ORM:** Prisma v6
- **Relational Database:** PostgreSQL (v15)
- **Caching & Queues:** Redis, BullMQ, Cache Manager
- **Authentication:** Passport.js, JWT, Bcrypt
- **Websockets:** Socket.io with Redis Adapter
- **Documentation:** Swagger (`@nestjs/swagger`)

### DevOps & Orchestration
- **Containerization:** Docker, Docker Compose
- **Reverse Proxy:** Nginx

---

## 📂 Project Structure

```text
quiz-online-project/
├── .github/          # GitHub Actions workflows & templates
├── ai-agent/         # AI integrations and tools
├── docker/           # Shared Docker scripts and configurations
├── i18n/             # Shared internationalization resources
├── server/           # Backend (NestJS, Prisma, Docker configs)
│   ├── prisma/       # Database schemas & seeds
│   ├── src/          # Source code
│   └── docker-compose.yml # Backend orchestration
├── web/              # Frontend (Next.js, Tailwind, Shadcn UI)
│   ├── src/          # React components, pages, forms
│   └── public/       # Static assets
├── pnpm-workspace.yaml # Monorepo workspace configuration
└── README.md         # This file
```

---

## ⚙️ Prerequisites

To run this project, make sure you have the following installed on your machine:

1. **Node.js**: Version `22.x` or higher.
2. **Corepack**: Used to manage the pnpm version tightly bound to the workspace.
3. **Docker Engine & Docker Compose**: (Optional but highly recommended) For quickly spinning up the database, cache, and entire stack.

---

## 💻 Local Setup & Installation

### 1. Enable Corepack & Install Dependencies
This project enforces a specific `pnpm` version via corepack. Run the following from the root directory:

```bash
# Enable corepack
corepack enable

# Activate the required pnpm version (v9.12.3)
corepack prepare pnpm@9.12.3 --activate

# Install all workspace dependencies
pnpm install
```

### 2. Environment Variables Configuration

**Backend (`server/`)**
Copy the sample environment file and configure your local settings:
```bash
cp server/env.sample server/.env
```
Ensure you provide valid values for:
- `DATABASE_URL` (PostgreSQL connection string)
- `REDIS_URL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Frontend (`web/`)**
Create an environment file for Next.js if required (e.g., API endpoint URLs).
```bash
cp web/.env.example web/.env
```

---

## 🚀 Running the Application

### Option A: Using Docker (Recommended for Database & Cache)

The easiest way to obtain a running PostgreSQL and Redis instance is by using the provided `docker-compose` file located in the `server` directory.

```bash
# Start Postgres, Redis, Nginx, and the Backend API in containers
cd server
docker compose up -d --build
```
> **Note:** To run the frontend using Docker, you can build from the `web/` directory:
> `cd web && docker build -t quiz-web . && docker run -p 3000:3000 quiz-web`

### Option B: Running Locally (Development Mode)

If you have a local PG/Redis database, you can run services directly on your host machine via the workspace from the root directory:

1. **Seed Database (if necessary):**
   ```bash
   pnpm --filter server run prisma:seed
   ```

2. **Start Backend Server:**
   ```bash
   pnpm --filter server run start:dev
   ```

3. **Start Frontend Next.js App:**
   ```bash
   pnpm --filter web run dev
   ```

The frontend will usually be accessible at `http://localhost:5173` and the backend swagger docs at `http://localhost:5000/api` (depending on your port configuration).

---

## 📜 Available Scripts (Root Directory)

You can orchestrate workspace tasks directly from the root using `pnpm --filter <package_name> <command>`.

### Backend Commands
- `pnpm --filter server run start:dev` - Starts the NestJS API with hot-reload.
- `pnpm --filter server run build` - Builds the NestJS application into `/dist`.
- `pnpm --filter server run test` - Runs unit tests.
- `pnpm --filter server run test:e2e` - Runs end-to-end tests.
- `pnpm --filter server run prisma:seed` - Runs the Prisma database seeder.

### Frontend Commands
- `pnpm --filter web run dev` - Starts the Next.js development server (Port 5173).
- `pnpm --filter web run build` - Builds the Next.js production bundle.
- `pnpm --filter web run start` - Starts the Next.js production server.

---

## 🗒 Operational Guidelines

- **Always run dependency installations (`pnpm install`) from the root directory** or use workspace roots properly so the cache and the unified `pnpm-lock.yaml` stay synced.
- **Docker Building:** The Dockerfiles are optimized to utilize corepack natively, meaning there is no need for raw `npm install` inside customized configurations.
- **Production Overrides:** Check out `server/docker-compose.prod.yml` as a template for deploying with already pushed Docker images or external ECS/ECR contexts.

---
*Happy Quizzing!* 🎯
