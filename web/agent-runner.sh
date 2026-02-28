#!/usr/bin/env bash
set -euo pipefail

TARGET="${AGENT_TARGET:-https://takeover-bsc.vercel.app}"
COIN="${AGENT_COIN:-0x0000000000000000000000000000000000000000}"
BUDGET="${AGENT_BUDGET:-0.5}"
MAX_PRICE="${AGENT_MAX_PRICE:-0.05}"
STRATEGY="${AGENT_STRATEGY:-cheapest}"
TOKEN="${AGENT_API_TOKEN:-}"
DRY_RUN="${AGENT_DRY_RUN:-false}"

payload=$(cat <<JSON
{
  "coin": "$COIN",
  "budgetBnb": "$BUDGET",
  "maxPriceBnb": "$MAX_PRICE",
  "strategy": "$STRATEGY",
  "dryRun": $DRY_RUN
}
JSON
)

headers=(-H 'Content-Type: application/json')
if [ -n "$TOKEN" ]; then
  headers+=("-H" "Authorization: Bearer $TOKEN")
fi

echo "==> plan"
curl -sS -X POST "$TARGET/api/agent/plan" "${headers[@]}" --data "$payload" | tee /tmp/agent_plan.json

if [ "$DRY_RUN" = "true" ]; then
  echo "dry-run mode, stop after plan"
  exit 0
fi

echo "==> execute"
curl -sS -X POST "$TARGET/api/agent/execute" "${headers[@]}" --data "$payload"
