#!/bin/bash
set -e

UPLOAD_ROOT="/home/u505641209/vaamkiaawaz-uploads"
APP_DIR="$HOME/domains/test.vaamkiaawaz.in/nodejs"

mkdir -p "$UPLOAD_ROOT"
cd "$APP_DIR"

for d in posts content authors resources; do
  if [ -d "$d" ]; then
    mkdir -p "$UPLOAD_ROOT/$d"
    mv -f "$d"/* "$UPLOAD_ROOT/$d/" 2>/dev/null || true
    rmdir "$d" 2>/dev/null || true
    echo "Moved $d"
  fi
done

chmod -R 755 "$UPLOAD_ROOT"
for d in posts content authors resources; do
  echo -n "$d: "
  ls "$UPLOAD_ROOT/$d" 2>/dev/null | wc -l
done
