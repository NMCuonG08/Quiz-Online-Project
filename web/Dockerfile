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

# Copy necessary files for Next.js execution
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

ENV NODE_ENV=production

# Re-enable pnpm for the runner stage if needed (for start script)
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

EXPOSE 3000

CMD ["pnpm", "run", "start"]


