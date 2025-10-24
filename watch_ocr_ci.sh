#!/bin/bash
# Run in bash from repo root. Watches the latest 'ocr-check.yml' run on this branch,
# prints job statuses + ocr-check log tail, and downloads the summary artifact.

set -euo pipefail; set +H

command -v gh >/dev/null || { echo "Need GitHub CLI (gh) installed & authed"; exit 2; }
command -v jq >/dev/null || { echo "Need jq installed"; exit 2; }

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
WF_PATH=".github/workflows/ocr-check.yml"

echo "Repo: $REPO  Branch: $BRANCH"
echo "Tip: if you haven't already, trigger the workflow here:"
echo "https://github.com/$REPO/actions/workflows/ocr-check.yml"

# 1) Find the latest run for this workflow on this branch
get_run() {
  gh run list --repo "$REPO" --branch "$BRANCH" --json databaseId,workflowName,createdAt \
    | jq -r '
        map(select(.workflowName=="ocr-check" or .workflowName==".github/workflows/ocr-check.yml"))
        | sort_by(.createdAt) | reverse | (.[0].databaseId // empty)'
}
RUN_ID="$(get_run || true)"
[ -n "${RUN_ID:-}" ] || { echo "No run found yet (maybe still scheduling). Re-run this after clicking 'Run workflow'."; exit 3; }

echo "Watching run: $RUN_ID"
gh run watch "$RUN_ID" --repo "$REPO" || true

# 2) Job summary
echo "---- JOB SUMMARY ----"
JOBS_JSON="$(gh run view "$RUN_ID" --repo "$REPO" --json jobs,conclusion)"
echo "$JOBS_JSON" | jq -r '.jobs[] | "\(.name): \(.conclusion // .status)"'

# 3) ocr-check logs (tail 200)
echo "---- OCR-CHECK LOG TAIL (200) ----"
gh run view "$RUN_ID" --repo "$REPO" --log | sed -n "/Job: ocr-check/,/Job: /p" | tail -n 200 || true

# 4) Artifact: try 'ocr-summary' (primary), fallback to any *.md
echo "---- OCR SUMMARY ARTIFACT ----"
TMPD="$(mktemp -d)"
if gh run download "$RUN_ID" --repo "$REPO" --name "ocr-summary" --dir "$TMPD" 2>/dev/null; then
  sed -n '1,200p' "$TMPD"/ocr_summary.md 2>/dev/null || sed -n '1,200p' "$TMPD"/*.md 2>/dev/null || ls -l "$TMPD"
else
  echo "(no 'ocr-summary' artifact found yet; check Actions UI for details)"
fi

CONC="$(echo "$JOBS_JSON" | jq -r '.conclusion')"
[ "$CONC" = "success" ] && echo "✅ CI success" || { echo "❌ CI $CONC"; exit 1; }
