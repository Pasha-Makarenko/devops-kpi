#!/bin/bash
set -euo pipefail

BASE_URL="${1:?usage: verify-deployment.sh <base-url e.g. http://192.168.56.10>}"

echo "==> GET / (html)"
curl -sfS -H "Accept: text/html" "$BASE_URL/" | grep -qi '<html\|<table\|DOCTYPE\|endpoint' || {
	echo "Root should return HTML with endpoints description" >&2
	exit 1
}

echo "==> GET /tasks (json)"
curl -sfS -H "Accept: application/json" "$BASE_URL/tasks" | grep -q '\[' || {
	echo "Expected JSON array of tasks" >&2
	exit 1
}

echo "==> nginx does not return /health/* outside (404)"
code_alive="$(curl -o /dev/null -s -w '%{http_code}' "$BASE_URL/health/alive" || true)"
code_ready="$(curl -o /dev/null -s -w '%{http_code}' "$BASE_URL/health/ready" || true)"
if [[ "$code_alive" != "404" ]] || [[ "$code_ready" != "404" ]]; then
	echo "Expected HTTP 404 for /health/alive and /health/ready through nginx; got alive=$code_alive ready=$code_ready" >&2
	exit 1
fi

echo "OK: verification passed for $BASE_URL"
