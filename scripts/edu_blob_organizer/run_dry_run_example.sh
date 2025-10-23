#!/usr/bin/env bash
# Quick example runner for the Cardiology Education Blob Organizer (dry run)
# Usage: edit the variables below, then execute this script.

set -euo pipefail

# Required: set your values
ACCOUNT_URL="https://<account>.blob.core.windows.net"
CONTAINER="education"
PREFIX="incoming/"

# Optional: provide SAS token (omit leading '?')
# SAS_TOKEN="sv=2020-08-04&ss=b&srt=sco&sp=rl..."

cd "$(dirname "$0")"

if [[ -n "${SAS_TOKEN:-}" ]]; then
  python3 organize_blobs.py \
    --account-url "$ACCOUNT_URL" \
    --container "$CONTAINER" \
    --prefix "$PREFIX" \
    --sas-token "$SAS_TOKEN" \
    --dry-run
else
  python3 organize_blobs.py \
    --account-url "$ACCOUNT_URL" \
    --container "$CONTAINER" \
    --prefix "$PREFIX" \
    --dry-run
fi
