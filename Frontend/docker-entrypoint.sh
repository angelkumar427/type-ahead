#!/bin/sh
set -e

# Create a frontend .env file from Docker environment variables if it does not already exist.
if [ ! -f .env ]; then
  cat > .env <<EOF
# Auto-generated environment file for frontend container
VITE_API_URL=${VITE_API_URL:-http://localhost:5000/api}
VITE_ENV=${VITE_ENV:-development}
EOF
fi

exec "$@"
