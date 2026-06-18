#!/usr/bin/env bash
# =============================================================================
# FormCraft — GCP Compute Engine VM Setup
# Jalankan SEKALI setelah VM baru dibuat.
# OS target: Ubuntu 22.04 LTS
#
# Usage:
#   chmod +x setup-vm.sh && sudo ./setup-vm.sh
# =============================================================================
set -euo pipefail

echo "==> [1/6] Update system packages..."
apt-get update -qq && apt-get upgrade -y -qq

echo "==> [2/6] Cek Docker..."
if command -v docker &>/dev/null; then
  echo "  Docker sudah terinstall: $(docker --version)"

  # Pastikan docker compose plugin tersedia
  if ! docker compose version &>/dev/null; then
    echo "  Docker Compose plugin belum ada, install..."
    apt-get install -y -qq docker-compose-plugin
  else
    echo "  Docker Compose sudah ada: $(docker compose version)"
  fi

  # Pastikan service jalan
  systemctl enable docker --quiet
  systemctl start docker

  # Pastikan user ada di grup docker
  usermod -aG docker "${SUDO_USER:-$USER}" || true
else
  echo "  Docker belum ada, install..."
  apt-get install -y -qq ca-certificates curl gnupg lsb-release

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  systemctl enable docker
  systemctl start docker
  usermod -aG docker "${SUDO_USER:-$USER}" || true
  echo "  Docker terinstall: $(docker --version)"
fi

echo "==> [3/6] Cek git..."
if command -v git &>/dev/null; then
  echo "  Git sudah ada: $(git --version)"
else
  echo "  Install git..."
  apt-get install -y -qq git
fi

echo "==> [4/6] Create swap file (4GB) — penting untuk build Next.js..."
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap created."
else
  echo "Swap already exists, skipping."
fi

echo "==> [5/6] Configure kernel params untuk production..."
cat >> /etc/sysctl.conf << 'EOF'
# Docker / production tuning
vm.swappiness=10
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
EOF
sysctl -p

echo "==> [6/6] Install useful tools..."
apt-get install -y -qq htop iotop ncdu ufw

# Basic firewall — allow SSH, HTTP, HTTPS, MinIO (9000)
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 9000/tcp    # MinIO presigned URLs dari browser
# ufw allow 9001/tcp  # MinIO Console — uncomment jika perlu akses sementara

echo ""
echo "======================================================"
echo "  VM setup selesai!"
echo "  PENTING: Logout dan login lagi agar grup docker aktif"
echo "  Lanjutkan dengan: ./scripts/deploy.sh"
echo "======================================================"
