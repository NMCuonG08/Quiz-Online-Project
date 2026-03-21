# 1. Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy package files và tsconfig
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies (workspace lock may live at repo root; allow missing lock)
RUN pnpm install --frozen-lockfile=false

# Copy source code
COPY . .

# Generate Prisma Client
RUN pnpm exec prisma generate

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && \
    sed -i 's/\r$//' /app/entrypoint.sh

# Build NestJS app
RUN pnpm run build

# Prune dev dependencies to keep only production deps for final image
RUN pnpm prune --prod --ignore-scripts

# 2. Production stage  
FROM node:22-alpine AS production

# Install wget for healthcheck, redis-cli for entrypoint, and postgresql-client for pg_isready
RUN apk add --no-cache wget redis postgresql-client

WORKDIR /app

# Step 1: Create user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Step 2: Copy with ownership
COPY --chown=nestjs:nodejs package*.json ./
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist
COPY --chown=nestjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nestjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=builder /app/entrypoint.sh ./entrypoint.sh

# Step 3: Permissions & User
RUN chmod +x /app/entrypoint.sh && sed -i 's/\r$//' /app/entrypoint.sh
USER nestjs

# Expose port
EXPOSE 5000

ENTRYPOINT ["/app/entrypoint.sh"]

# Start application
CMD ["node", "dist/src/main.js"]