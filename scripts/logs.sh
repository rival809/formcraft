#!/usr/bin/env bash
# Shortcut: lihat logs semua service atau service tertentu
# Usage: ./scripts/logs.sh [service]
# Contoh: ./scripts/logs.sh api
SERVICE="${1:-}"
cd "$(dirname "${BASH_SOURCE[0]}")/.."
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=100 $SERVICE
