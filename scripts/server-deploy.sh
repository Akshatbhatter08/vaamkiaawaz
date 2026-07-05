#!/bin/bash
# Run on Hostinger SSH after code is deployed (hPanel Git deploy or manual upload).
# Usage: bash scripts/server-deploy.sh
set -e

export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

# Production app path (override with APP_DIR if needed)
APP_DIR="${APP_DIR:-$HOME/domains/vaamkiaawaz.in/nodejs}"

if [ ! -d "$APP_DIR" ]; then
  echo "ERROR: App directory not found: $APP_DIR"
  echo "Try: ls ~/domains/*/nodejs"
  exit 1
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "ERROR: .env not found in $APP_DIR"
  exit 1
fi

echo "==> Deploying in: $(pwd)"
echo "==> Node: $(node -v)"
echo "==> npm: $(npm -v)"

echo "==> npm install..."
npm install

echo "==> prisma db push..."
npx prisma db push

echo "==> npm run build..."
npm run build

echo ""
echo "OK: Build finished. Restart the Node.js app in hPanel:"
echo "    Websites -> vaamkiaawaz.in -> Node.js -> Restart"
