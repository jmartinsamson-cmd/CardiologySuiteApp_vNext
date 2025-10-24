#!/bin/bash
set -euo pipefail

# 1) Preflight: need gh CLI + repo auth
if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI first." >&2
  exit 2
fi
gh auth status >/dev/null || { echo "GitHub CLI not authenticated." >&2; exit 2; }

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "Repo: $REPO"
echo "Branch: $BRANCH"

# 2) Find latest workflow run for this branch (workflow name 'CI Pipeline' preferred; fallback to most recent)
RUN_ID="$(gh run list --repo "$REPO" --branch "$BRANCH" --json databaseId,status,conclusion,displayTitle,name,createdAt \
          --jq '[ .[] | select(.name=="CI Pipeline") ] | sort_by(.createdAt) | reverse | .[0].databaseId' 2>/dev/null)"
if [ -z "${RUN_ID:-}" ]; then
  RUN_ID="$(gh run list --repo "$REPO" --branch "$BRANCH" --json databaseId,status,conclusion,displayTitle,name \
            --jq '.[0].databaseId' | head -n1)"
fi
if [ -z "${RUN_ID:-}" ]; then
  echo "No workflow runs found for $BRANCH" >&2
  exit 3
fi
echo "Workflow run id: $RUN_ID"

# 3) Wait for completion
echo "Waiting for workflow to complete..."
gh run watch "$RUN_ID" --repo "$REPO"

# 4) Summarize jobs
echo ""
echo "=== Job Summary ==="
JOBS_JSON="$(gh run view "$RUN_ID" --repo "$REPO" --json jobs)"
echo "$JOBS_JSON" | jq -r '.jobs[] | "\(.name): \(.conclusion // .status)"'

CONCLUSION="$(gh run view "$RUN_ID" --repo "$REPO" --json conclusion -q .conclusion)"

# 5) If ocr-check exists, print last 200 log lines; also show failed job logs
OCR_JOB_ID="$(echo "$JOBS_JSON" | jq -r '.jobs[] | select(.name=="ocr-check" or .name=="OCR Diagnostic Check") | .id' | head -n1)"
if [ -n "$OCR_JOB_ID" ]; then
  echo ""
  echo "=== ocr-check logs (tail 200) ==="
  # gh doesn't expose job-tail directly; fetch full logs and tail
  gh run view "$RUN_ID" --repo "$REPO" --log | sed -n "/Job: OCR Diagnostic Check/,/Job: /p" | tail -n 200 || true
else
  echo ""
  echo "Note: ocr-check job not found (may be skipped if main CI failed)."
fi

# Show logs for any failed jobs
FAILED_JOBS="$(echo "$JOBS_JSON" | jq -r '.jobs[] | select(.conclusion=="failure") | .name' | head -n1)"
if [ -n "$FAILED_JOBS" ]; then
  echo ""
  echo "=== Failed job logs: $FAILED_JOBS (tail 200) ==="
  gh run view "$RUN_ID" --repo "$REPO" --log | sed -n "/Job: $FAILED_JOBS/,/Job: /p" | tail -n 200 || true
fi

# 6) Comment summary to PR (if PR exists)
PR_NUM="$(gh pr view --repo "$REPO" --json number -q .number 2>/dev/null || true)"
if [ -n "${PR_NUM:-}" ]; then
  PASSFAIL="❌ Failed"
  [ "$CONCLUSION" = "success" ] && PASSFAIL="✅ Passed"
  SUMMARY_MD=$(
    cat <<EOF
**CI Summary for \`$BRANCH\`**  
Run: \`$RUN_ID\` — $PASSFAIL

Jobs:
$(echo "$JOBS_JSON" | jq -r '.jobs[] | "- " + .name + ": " + (.conclusion // .status)')

$(if [ -n "$OCR_JOB_ID" ]; then echo "OCR logs (last 200 lines shown in Actions UI)."; else echo "_ocr-check skipped or not present_."; fi)
EOF
  )
  gh pr comment "$PR_NUM" --repo "$REPO" --body "$SUMMARY_MD" || true
  echo ""
  echo "Posted PR comment to #$PR_NUM."
fi

# 7) Exit code mirrors CI result
if [ "$CONCLUSION" != "success" ]; then
  echo "CI did not succeed: $CONCLUSION" >&2
  exit 1
fi

echo "Done."