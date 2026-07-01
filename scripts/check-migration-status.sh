#!/bin/bash
# Lightweight migration check without Prisma (works on Hostinger shared hosting).
set -e

cd "$(dirname "$0")/.."
ENV_FILE=".env"
UPLOAD_ROOT="${UPLOAD_DIR:-/home/u505641209/vaamkiaawaz-uploads}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env not found in $(pwd)"
  exit 1
fi

DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r')
DATABASE_URL="${DATABASE_URL%\"}"
DATABASE_URL="${DATABASE_URL#\"}"
DATABASE_URL="${DATABASE_URL%\'}"
DATABASE_URL="${DATABASE_URL#\'}"

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL missing in .env"
  exit 1
fi

# mysql://user:pass@host:3306/dbname
REST="${DATABASE_URL#mysql://}"
USERPASS="${REST%%@*}"
HOSTDB="${REST#*@}"
DB_USER="${USERPASS%%:*}"
DB_PASS="${USERPASS#*:}"
HOSTPORT="${HOSTDB%%/*}"
DB_NAME="${HOSTDB#*/}"
DB_NAME="${DB_NAME%%\?*}"

if [[ "$HOSTPORT" == *:* ]]; then
  DB_HOST="${HOSTPORT%%:*}"
  DB_PORT="${HOSTPORT##*:}"
else
  DB_HOST="$HOSTPORT"
  DB_PORT="3306"
fi

if [ -z "$DB_USER" ] || [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ]; then
  echo "ERROR: Could not parse DATABASE_URL"
  exit 1
fi

echo "==> Upload folder: $UPLOAD_ROOT"
for d in posts content authors resources; do
  if [ -d "$UPLOAD_ROOT/$d" ]; then
    echo "$d: $(ls "$UPLOAD_ROOT/$d" 2>/dev/null | wc -l) files"
  else
    echo "$d: MISSING"
  fi
done

echo ""
echo "==> Database checks (via mysql CLI)..."

run_sql() {
  MYSQL_PWD="$DB_PASS" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" -N -B -e "$1"
}

POST_BASE64=$(run_sql "SELECT COUNT(*) FROM BlogPost WHERE postImage LIKE 'data:%';")
POST_MEDIA=$(run_sql "SELECT COUNT(*) FROM BlogPost WHERE postImage LIKE '/api/media/%';")
CONTENT_BASE64=$(run_sql "SELECT COUNT(*) FROM BlogPost WHERE content LIKE '%data:image%';")
AVATAR_BASE64=$(run_sql "SELECT COUNT(*) FROM User WHERE permissions LIKE '%data:image%';")
PDF_BASE64=$(run_sql "SELECT COUNT(*) FROM Resource WHERE type = 'pdf' AND fileData LIKE 'data:%';")
PDF_MEDIA=$(run_sql "SELECT COUNT(*) FROM Resource WHERE type = 'pdf' AND url LIKE '/api/media/%';")
TOTAL_POSTS=$(run_sql "SELECT COUNT(*) FROM BlogPost;")

echo "totalPosts: $TOTAL_POSTS"
echo "postImageBase64: $POST_BASE64"
echo "postImageMediaUrl: $POST_MEDIA"
echo "contentWithBase64Images: $CONTENT_BASE64"
echo "base64Avatars: $AVATAR_BASE64"
echo "mediaPdfs: $PDF_MEDIA"
echo "base64Pdfs: $PDF_BASE64"

echo ""
if [ "$POST_BASE64" = "0" ] && [ "$CONTENT_BASE64" = "0" ] && [ "$AVATAR_BASE64" = "0" ] && [ "$PDF_BASE64" = "0" ]; then
  echo "OK: Migration looks complete. Restart the Node.js app in hPanel."
else
  echo "WARNING: Some base64 data remains. Do NOT run migrate:blobs without checking first."
fi
