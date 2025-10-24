#!/bin/bash
# Run in bash from repo root. Requires: gh (authed), jq
set -euo pipefail; set +H

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
WF=".github/workflows/ocr-check.yml"
WF_NAME="ocr-check"

echo "Repo: $REPO  Branch: $BRANCH"

# 1) Verify required secrets exist
echo "Checking required secrets..."
MISS=0
SKIP_SECRETS=0
SECRETS_LIST_OUTPUT="$(gh secret list --repo "$REPO" 2>&1 || true)"
if echo "$SECRETS_LIST_OUTPUT" | grep -q "HTTP 403"; then
  echo "⚠️ Skipping secret presence check (gh lacks permission to list repo secrets)."
  SKIP_SECRETS=1
else
  echo "$SECRETS_LIST_OUTPUT" | awk '{print $1}' > /tmp/gh_secrets_list.txt
  for S in AZURE_CLIENT_ID AZURE_TENANT_ID AZURE_SUBSCRIPTION_ID AZURE_VISION_KEY; do
    if ! grep -qx "$S" /tmp/gh_secrets_list.txt; then
      echo "❌ Missing secret: $S"; MISS=1
    else
      echo "✅ $S present"
    fi
  done
  if [ $MISS -ne 0 ]; then
    echo "Add missing secrets in GitHub → Settings → Secrets and variables → Actions, then re-run."; exit 1;
  fi
fi

# 2) Ensure workflow_dispatch is enabled
if [ -f "$WF" ] && ! grep -qE '^\s*workflow_dispatch:' "$WF"; then
  echo "⚠️ workflow_dispatch not found in $WF. Add it to 'on:' to allow manual dispatch."
  exit 1
fi

# 3) Dispatch ocr-check on this branch and wait
if ! gh workflow run "ocr-check.yml" --repo "$REPO" --ref "$BRANCH" 2>/tmp/gh_run_err.txt; then
  if grep -q "HTTP 403" /tmp/gh_run_err.txt; then
    echo "⚠️ Your GitHub CLI token doesn't have permission to dispatch workflows for $REPO."
    echo "Open the workflow in your browser and click 'Run workflow':"
    echo "  https://github.com/$REPO/actions/workflows/ocr-check.yml"
    exit 2
  fi
fi

# Wait up to ~60s for the run to appear
ATTEMPTS=0
RUN_ID=""
while [ $ATTEMPTS -lt 20 ]; do
  RUN_ID="$(gh run list --repo "$REPO" --branch "$BRANCH" --json databaseId,name,workflowName \
           | jq -r '.[] | select(.workflowName=="'"$WF_NAME"'") | .databaseId' | head -n1)"
  if [ -n "$RUN_ID" ]; then break; fi
  ATTEMPTS=$((ATTEMPTS+1))
  sleep 3
done
[ -n "${RUN_ID:-}" ] || { echo "No run yet (GitHub scheduling). Try again in a few seconds."; exit 3; }

echo "Watching run: $RUN_ID"
gh run watch "$RUN_ID" --repo "$REPO" || true

# 4) Job summary + ocr-check logs + artifact
echo "---- JOB SUMMARY ----"
JOBS_JSON="$(gh run view "$RUN_ID" --repo "$REPO" --json jobs,conclusion)"
echo "$JOBS_JSON" | jq -r '.jobs[] | "\(.name): \(.conclusion // .status)"'

echo "---- OCR-CHECK LOG TAIL (200) ----"
gh run view "$RUN_ID" --repo "$REPO" --log | sed -n "/Job: ocr-check/,/Job: /p" | tail -n 200 || true

echo "---- OCR SUMMARY ARTIFACT ----"
TMPD="$(mktemp -d)"
if gh run download "$RUN_ID" --repo "$REPO" --name "ocr-summary" --dir "$TMPD" 2>/dev/null; then
  sed -n '1,200p' "$TMPD/ocr_summary.md" || ls -l "$TMPD"
else
  echo "(no ocr_summary artifact found)"
fi

CONC="$(echo "$JOBS_JSON" | jq -r '.conclusion')"
[ "$CONC" = "success" ] && echo "✅ CI success" || { echo "❌ CI $CONC"; exit 1; }