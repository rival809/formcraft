#!/usr/bin/env bash
# =============================================================================
# FormCraft — Deploy / Update
# Jalankan untuk pertama kali deploy ATAU setiap ada update kode.
#
# Usage:
#   chmod +x scripts/deploy.sh && ./scripts/deploy.sh
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> [1] Cek .env file..."
if [ ! -f .env ]; then
  echo ""
  echo "ERROR: .env tidak ditemukan!"
  echo "Salin dulu: cp .env.example .env && nano .env"
  echo ""
  exit 1
fi

echo "==> [2] Pull latest code..."
git pull origin main

echo "==> [3] Build Docker images..."
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  build --parallel

echo "==> [4] Start / recreate services..."
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --remove-orphans

echo "==> [5] Tunggu database siap..."
until docker compose exec -T postgres pg_isready -U formcraft -d formcraft_db; do
  echo "  Postgres belum siap, tunggu..."
  sleep 2
done

echo "==> [6] Jalankan database migrations..."
docker compose exec -T api sh -c \
  "cd /app && npx prisma migrate deploy --schema packages/db/prisma/schema.prisma" || \
echo "  (Skip migration — jalankan manual: docker compose exec api sh -c 'cd /app && npx prisma migrate deploy --schema packages/db/prisma/schema.prisma')"

echo "==> [7] Setup MinIO bucket (jika belum ada)..."
sleep 3
docker compose exec -T minio sh -c "
  mc alias set local http://localhost:9000 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD 2>/dev/null || true
  mc mb local/formcraft --ignore-existing 2>/dev/null || true
  mc anonymous set download local/formcraft 2>/dev/null || true
" 2>/dev/null || echo "  (MinIO bucket setup skip — cek manual di console :9001)"

echo "==> [8] Cek status services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
echo "======================================================"
echo "  Deploy selesai!"
echo ""
VM_IP=$(curl -sf http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" 2>/dev/null || echo "<VM_IP>")
echo "  App:   http://${VM_IP}"
echo "  MinIO: http://${VM_IP}:9000"
echo ""
echo "  Logs: docker compose logs -f web api"
echo "======================================================"
