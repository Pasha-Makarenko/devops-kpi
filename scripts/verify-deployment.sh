#!/bin/bash
set -euo pipefail

BASE_URL="${1:?usage: verify-deployment.sh <base-url e.g. http://192.168.56.10>}"
MAX_ATTEMPTS="${VERIFY_RETRIES:-30}"
RETRY_DELAY="${VERIFY_RETRY_DELAY:-2}"

wait_for_url() {
	local url="$1"
	local attempt=1
	while [[ "$attempt" -le "$MAX_ATTEMPTS" ]]; do
		if curl -sfS -o /dev/null "$url"; then
			return 0
		fi
		echo "Waiting for ${url} (attempt ${attempt}/${MAX_ATTEMPTS})..."
		sleep "$RETRY_DELAY"
		attempt=$((attempt + 1))
	done
	return 1
}

echo "==> Wait for service availability"
wait_for_url "$BASE_URL/" || {
	echo "Service not available at $BASE_URL after $((MAX_ATTEMPTS * RETRY_DELAY))s" >&2
	exit 1
}

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
