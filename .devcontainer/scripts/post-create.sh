#!/usr/bin/env bash
set -euo pipefail

# Use pnpm if lockfile exists; otherwise npm
cd "${WORKSPACE_FOLDER:-/workspaces/$(basename "$(pwd)")}"

# Enable Corepack so pnpm is available and versioned
corepack enable || true
corepack prepare pnpm@latest --activate || true

if [ -f "pnpm-lock.yaml" ]; then
  echo "⏳ Installing dependencies with pnpm..."
  pnpm install --frozen-lockfile || pnpm install
elif [ -f "package-lock.json" ]; then
  echo "⏳ Installing dependencies with npm ci..."
  npm ci || npm install
else
  echo "ℹ️ No lockfile detected; running npm install..."
  npm install || true
fi

echo "✅ Dependencies installed."

# Optional: build once so prebuilds cache artifacts
if [ -f "package.json" ] && jq -e '.scripts.build' package.json >/dev/null 2>&1; then
  echo "🏗️ Running initial build..."
  (pnpm build || npm run build) || true
fi

echo "✨ Post-create complete."

