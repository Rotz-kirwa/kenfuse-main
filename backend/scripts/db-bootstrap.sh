#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CONTAINER_NAME="${CONTAINER_NAME:-kenfuse-postgres}"
DB_HOST_PORT="${DB_HOST_PORT:-5433}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-kenfuse}"
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_HOST_PORT}/${DB_NAME}?schema=public"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but was not found."
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    docker start "$CONTAINER_NAME" >/dev/null
  fi
else
  docker run -d \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "${DB_HOST_PORT}:5432" \
    postgres:16 >/dev/null
fi

# Wait until PostgreSQL is ready.
until docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  sleep 1
done

if grep -q '^DATABASE_URL=' .env; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${DB_URL}\"|" .env
else
  printf '\nDATABASE_URL="%s"\n' "$DB_URL" >> .env
fi

if [ ! -d node_modules ]; then
  npm install
fi

npm run prisma:generate
npm run db:push
npm run prisma:seed

echo "Database is ready at ${DB_URL}"
