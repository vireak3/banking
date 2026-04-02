#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

echo "Installing Next.js dependencies..."
cd "$PROJECT_DIR/nextjs"
npm install

echo "Installing Laravel PHP dependencies..."
cd "$PROJECT_DIR/laravel"
composer install --no-interaction --no-progress --prefer-dist

echo "Installing Laravel JS dependencies..."
npm install

echo "All dependencies installed successfully."
