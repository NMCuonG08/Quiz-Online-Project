#!/bin/sh
set -e

# Chờ DB ready
echo "Waiting for Postgres..."
until pg_isready -h db -p 5432 -U postgres; do
  echo "Postgres not ready, sleeping 2s..."
  sleep 2
done

# Chờ Redis ready
echo "Waiting for Redis..."
until redis-cli -h redis-cache ping | grep PONG > /dev/null; do
  echo "Redis not ready, sleeping 2s..."
  sleep 2
done

# Chạy migration
echo "Running Prisma migrate..."
npx prisma migrate deploy

# Seed data (chỉ chạy khi có biến SEED_DB=true)
if [ "$SEED_DB" = "true" ]; then
  echo "Running Prisma seed..."
  node prisma/seed.js
fi

# Start app
echo "Starting app..."
npm run start:prod