#!/bin/bash
set -euo pipefail

IMAGE="${1:?usage: cd-remote-deploy.sh <ghcr.io/org/repo:tag>}"
DEPLOY_HOST="${DEPLOY_HOST:?set DEPLOY_HOST}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"

SSH_OPTS=(
	-p "$DEPLOY_PORT"
	-o StrictHostKeyChecking=accept-new
	-o BatchMode=yes
)

if [[ -n "${DEPLOY_SSH_KEY_PATH:-}" ]]; then
	SSH_OPTS+=(-i "$DEPLOY_SSH_KEY_PATH")
fi

remote_cmd="echo DOCKER_IMAGE=${IMAGE@Q} | sudo tee /etc/mywebapp/docker-image.env >/dev/null && sudo systemctl daemon-reload && sudo systemctl restart mywebapp-docker"

if [[ -n "${GHCR_TOKEN:-}" ]]; then
	ghcr_user="${GHCR_USER:-github-actions}"
	remote_cmd="echo ${GHCR_TOKEN@Q} | sudo docker login ghcr.io -u ${ghcr_user@Q} --password-stdin && ${remote_cmd}"
fi

ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "$remote_cmd"
