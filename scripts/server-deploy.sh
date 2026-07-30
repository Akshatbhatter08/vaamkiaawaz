#!/bin/bash
# Run on Hostinger SSH after code is deployed via hPanel Git (not `git pull` — that folder has no .git).
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
  echo ""
  echo "This folder is deployed from hPanel Git (no local git repo). Steps:"
  echo "  1. hPanel -> Websites -> vaamkiaawaz.in -> Git -> Deploy latest main"
  echo "  2. Create .env in this folder (see below)"
  echo ""
  echo "Contents of $(pwd):"
  ls -la
  echo ""
  echo "Searching for an existing .env on this account..."
  find "$HOME/domains" "$HOME" -maxdepth 4 -name ".env" 2>/dev/null | head -10 || true
  echo ""
  if [ -f .env.example ]; then
    echo "Create .env from the example:"
    echo "  cp .env.example .env"
    echo "  nano .env    # add DATABASE_URL, JWT_SECRET, SMTP, GA4_*, UPLOAD_DIR"
  else
    echo "Create .env with at least DATABASE_URL and JWT_SECRET (min 32 chars)."
  fi
  echo ""
  echo "If .env already exists elsewhere, copy it here, e.g.:"
  echo "  cp /path/to/.env $APP_DIR/.env"
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
