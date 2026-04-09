#!/bin/bash
set -euo pipefail
cd "${DEPLOY_APP_DIR:?}"
export NODE_ENV=production
ARGS=(
	--dbHost "${DEPLOY_DB_HOST:?}"
	--dbPort "${DEPLOY_DB_PORT:?}"
	--dbUser "${DEPLOY_DB_USER:?}"
	--dbPassword "${DB_PASSWORD:?}"
	--dbName "${DEPLOY_DB_NAME:?}"
)
case "${1:-}" in
	migrate) exec pnpm run migrate -- "${ARGS[@]}" ;;
	serve) exec node src/index.js --port "${DEPLOY_APP_PORT:?}" "${ARGS[@]}" ;;
	socket) exec node src/index.js "${ARGS[@]}" ;;
	*)
		echo "usage: $0 migrate|serve|socket" >&2
		exit 1
		;;
esac
