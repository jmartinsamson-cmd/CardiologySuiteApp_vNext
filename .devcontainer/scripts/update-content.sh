#!/usr/bin/env bash
set -euo pipefail
cd "${WORKSPACE_FOLDER:-/workspaces/$(basename "$(pwd)")}"

# Re-install if package.json or lockfiles changed
if [ -f "pnpm-lock.yaml" ]; then
  echo "🔄 pnpm install (content update)..."
  pnpm install --frozen-lockfile || pnpm install
elif [ -f "package-lock.json" ]; then
  echo "🔄 npm ci (content update)..."
  npm ci || npm install
fi

# Optional: rebuild to keep dist fresh
if [ -f "package.json" ] && jq -e '.scripts.build' package.json >/devnull 2>&1; then
  echo "🏗️ Rebuilding..."
  (pnpm build || npm run build) || true
fi

echo "✅ Content update complete."

