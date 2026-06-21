#!/bin/sh
set -e

# Create a backend .env file from Docker environment variables if it does not already exist.
if [ ! -f .env ]; then
  cat > .env <<EOF
# Auto-generated environment file for backend container
DATABASE_URL=${DATABASE_URL:-postgresql://postgres:password@postgres:5432/typeahead}
REDIS_URLS=${REDIS_URLS:-redis://redis-1:6379,redis://redis-2:6379,redis://redis-3:6379}
PORT=${PORT:-3000}
NODE_ENV=${NODE_ENV:-development}
EOF
fi

# Generate Prisma client if not already generated
if [ ! -d "src/generated" ]; then
  echo "Generating Prisma client..."
  npx prisma generate
fi

exec "$@"
