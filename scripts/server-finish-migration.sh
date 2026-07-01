#!/bin/bash
set -e
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
cd "$HOME/domains/test.vaamkiaawaz.in/nodejs"

if [ ! -f .env ]; then
  echo "ERROR: .env not found."
  exit 1
fi

echo "==> Generating Prisma client (for the web app)..."
npx prisma generate

echo ""
bash scripts/check-migration-status.sh
