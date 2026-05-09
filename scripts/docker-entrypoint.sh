#!/bin/sh
set -eu

if [ -z "${DB_HOST:-}" ] || [ -z "${DB_PORT:-}" ] || [ -z "${DB_USER:-}" ] || [ -z "${DB_PASSWORD:-}" ] || [ -z "${DB_NAME:-}" ]; then
  echo "Missing required DB_* env vars" >&2
  exit 1
fi

APP_PORT="${APP_PORT:-5200}"
NODE_ENV="${NODE_ENV:-production}"

node src/migrate.js --dbHost "${DB_HOST}" --dbPort "${DB_PORT}" --dbUser "${DB_USER}" --dbPassword "${DB_PASSWORD}" --dbName "${DB_NAME}"
exec node src/index.js --nodeEnv "${NODE_ENV}" --port "${APP_PORT}" --dbHost "${DB_HOST}" --dbPort "${DB_PORT}" --dbUser "${DB_USER}" --dbPassword "${DB_PASSWORD}" --dbName "${DB_NAME}"
