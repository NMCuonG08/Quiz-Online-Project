# 1) Builder stage
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy only lockfile and package.json to cache dependencies
COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile=false

# Copy code (node_modules is ignored via .dockerignore)
COPY . .

# Build Next.js app 
RUN pnpm run build

# 2) Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

# Run the standalone server emitted by output: standalone.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./web/.next/static
COPY --from=builder /app/public ./web/public

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "web/server.js"]


