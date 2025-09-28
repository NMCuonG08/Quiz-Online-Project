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

# Chạy seed data
echo "Running Prisma seed..."
npm run prisma:seed

# Start app
echo "Starting app..."
npm run start:prod