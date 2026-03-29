#!/bin/bash
set -euxo pipefail

cd /opt/banking
git fetch origin main
git reset --hard origin/main
chmod +x laravel/docker-entrypoint.sh

docker run --rm \
  -v /opt/banking/laravel:/app \
  -w /app \
  composer:2 \
  install --no-interaction --prefer-dist --optimize-autoloader

if docker compose version >/dev/null 2>&1; then
  docker compose up -d --build
else
  docker-compose up -d --build
fi
