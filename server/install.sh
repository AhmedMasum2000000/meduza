#!/usr/bin/env bash
# Install or update the Meduza API on this server. Run as root on the VPS:
#   curl -fsSL https://raw.githubusercontent.com/AhmedMasum2000000/meduza/main/server/install.sh | bash
# With your own address instead of a free Cloudflare one (point the domain's A record to this server first):
#   curl -fsSL https://raw.githubusercontent.com/AhmedMasum2000000/meduza/main/server/install.sh | DOMAIN=api.example.com bash
# Running it again updates the server and keeps your password, keys and brands.
set -euo pipefail
DIR=/opt/meduza

command -v git >/dev/null || { apt-get update -qq && apt-get install -y -qq git; }
command -v openssl >/dev/null || { apt-get update -qq && apt-get install -y -qq openssl; }
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh

if [ -d "$DIR/.git" ]; then git -C "$DIR" pull -q --ff-only; else git clone -q --depth 1 https://github.com/AhmedMasum2000000/meduza "$DIR"; fi
cd "$DIR/server"

NEW=0
if [ ! -f .env ]; then
  umask 077
  {
    echo "ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
    echo "MASTER_KEY=$(openssl rand -base64 32)"
    echo "ALLOWED_ORIGINS=https://ahmedmasum2000000.github.io"
  } > .env
  NEW=1
fi
if [ -n "${DOMAIN:-}" ]; then
  if grep -q '^DOMAIN=' .env; then sed -i "s|^DOMAIN=.*|DOMAIN=$DOMAIN|" .env; else echo "DOMAIN=$DOMAIN" >> .env; fi
fi

PROFILE=tunnel
grep -q '^DOMAIN=.' .env && PROFILE=domain
docker compose --profile "$PROFILE" up -d --build --remove-orphans

URL=""
if [ "$PROFILE" = domain ]; then
  URL="https://$(grep '^DOMAIN=' .env | cut -d= -f2)"
else
  for _ in $(seq 1 30); do
    URL=$(docker compose --profile tunnel logs tunnel 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1 || true)
    [ -n "$URL" ] && break; sleep 2
  done
fi

echo
echo "Meduza API is running."
echo "  Server address: ${URL:-(not ready yet, run: cd $DIR/server && docker compose --profile tunnel logs tunnel)}"
if [ "$NEW" = 1 ]; then
  echo "  Admin password: $(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2)"
  echo "  Save this password now. It is shown only once (it stays in $DIR/server/.env)."
else
  echo "  Admin password: unchanged (it is in $DIR/server/.env)"
fi
echo "Open the site, go to Admin, and paste the address and password."
