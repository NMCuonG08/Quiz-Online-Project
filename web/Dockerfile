# 1) Builder stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build Next.js app (production)
RUN npm run build


# 2) Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

# Copy only what is needed to run
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]


