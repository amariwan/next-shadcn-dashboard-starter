#!/usr/bin/env bash
# First-start setup for the devcontainer: dependencies, env file, database.
# Safe to re-run (all steps are idempotent).
set -euo pipefail

cd "$(dirname "$0")/.."

# 1. Create .env on first run (never committed — see .gitignore).
#    Auth.js needs a secret; generate a random one if missing.
if [ ! -f .env ]; then
  echo "Creating .env with a generated AUTH_SECRET..."
  SECRET=$(openssl rand -base64 32)
  cat > .env <<EOF
# == Authentication Configuration (Auth.js / NextAuth v5) ==
AUTH_SECRET=${SECRET}
NEXTAUTH_SECRET=${SECRET}
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# == Database Configuration ==
DATABASE_URL=file:./prisma/dev.db

# == Orgs/Teams (optional) ==
# Set to "false" to hide workspaces, or strip the feature with:
#   node scripts/cleanup.js orgs
NEXT_PUBLIC_ORGS_ENABLED=true

# == Error Tracking Configuration (Sentry) ==
NEXT_PUBLIC_SENTRY_DISABLED=true
EOF
fi

# 2. Install Bun (preferred package manager for this repo) if missing.
if ! command -v bun >/dev/null 2>&1; then
  echo "Installing Bun..."
  if ! command -v unzip >/dev/null 2>&1; then
    sudo apt-get update && sudo apt-get install -y unzip
  fi
  curl -fsSL --retry 3 https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
  # Make bun available in every shell (the installer only touches ~/.bashrc,
  # which non-interactive shells don't read).
  sudo ln -sf "$HOME/.bun/bin/bun" /usr/local/bin/bun
  [ -e "$HOME/.bun/bin/bunx" ] && sudo ln -sf "$HOME/.bun/bin/bunx" /usr/local/bin/bunx || true
  sudo ln -sf "/home/node/.bun/bin/bunx" /usr/local/bin/bunx
fi

# 3. Install dependencies (preferred package manager for this repo).
bun install

# 4. Prepare the SQLite database.
set -a
# shellcheck disable=SC1091
source .env
set +a
bunx prisma generate
bunx prisma migrate deploy

# 5. Seed demo users (idempotent upserts).
#    admin@example.com / admin123, user@example.com / admin123
if [ -f prisma/seed.ts ]; then
  bun run db:seed
fi

echo ""
echo "Setup complete. Start the dev server with: bun run dev"
