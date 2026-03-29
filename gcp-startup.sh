#!/bin/bash
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y docker.io git curl
apt-get install -y docker-compose-plugin || apt-get install -y docker-compose

systemctl enable docker
systemctl start docker

if [ ! -d /opt/banking ]; then
  git clone https://github.com/vireak3/banking.git /opt/banking
else
  cd /opt/banking
  git pull --rebase || true
fi

cd /opt/banking
chmod +x scripts/deploy-vm.sh
./scripts/deploy-vm.sh
