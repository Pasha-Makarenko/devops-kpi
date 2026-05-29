#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f /vagrant/deploy/deployment.defaults ]]; then
	REPO_ROOT=/vagrant
elif [[ -f "$SCRIPT_DIR/../deploy/deployment.defaults" ]]; then
	REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
	echo "Cannot find repo (deploy/deployment.defaults)" >&2
	exit 1
fi
source "$REPO_ROOT/deploy/deployment.defaults"

export DEBIAN_FRONTEND=noninteractive
DB_PASSWORD="${DB_PASSWORD:-mywebapp_secret_change_me}"
export DB_PASSWORD
DEFAULT_PW=12345678
N="${GRADE_BOOK_N:-16}"

DEPLOY_GHCR_IMAGE="${DEPLOY_GHCR_IMAGE:-ghcr.io/pasha-makarenko/devops-kpi:latest}"

TMPL_DIR="$REPO_ROOT/deploy/templates"
LAUNCH_SRC="$REPO_ROOT/deploy/launch-mywebapp.sh"
for f in "$TMPL_DIR/nginx-mywebapp.conf.template" "$TMPL_DIR/mywebapp-docker.service.template" "$LAUNCH_SRC"; do
	[[ -f "$f" ]] || {
		echo "Missing $f" >&2
		exit 1
	}
done

_envsubst_nginx='${DEPLOY_UNIT} ${DEPLOY_APP_USER} ${DEPLOY_APP_DIR} ${DEPLOY_APP_CONFIG} ${DEPLOY_APP_PORT} ${DEPLOY_APP_BIND} ${DEPLOY_DB_HOST} ${DEPLOY_DB_PORT} ${DEPLOY_DB_USER} ${DEPLOY_DB_NAME} ${DEPLOY_NGINX_ACCESS_LOG} ${DEPLOY_NGINX_ERROR_LOG}'

render_nginx_template() {
	envsubst "$_envsubst_nginx" <"$TMPL_DIR/nginx-mywebapp.conf.template" >/etc/nginx/sites-available/"${DEPLOY_UNIT}"
}

echo "==> Packages"
apt-get update -qq
apt-get install -y ca-certificates curl gnupg mariadb-server nginx gettext-base docker.io docker-compose-v2

systemctl enable docker
systemctl start docker

echo "==> Users"
for u in student teacher; do
	if ! id "$u" &>/dev/null; then
		useradd -m -s /bin/bash "$u"
		echo "$u:$DEFAULT_PW" | chpasswd
		chage -d 0 "$u"
		usermod -aG sudo "$u"
	fi
done
if ! id operator &>/dev/null; then
	useradd -m -s /bin/bash operator 2>/dev/null || useradd -m -s /bin/bash -g operator operator 2>/dev/null || useradd -m -s /bin/bash operator
	echo "operator:$DEFAULT_PW" | chpasswd
	chage -d 0 operator
fi
if ! id "$DEPLOY_APP_USER" &>/dev/null; then
	useradd -r -s /usr/sbin/nologin -d "$DEPLOY_APP_DIR" "$DEPLOY_APP_USER"
fi
install -d -m755 /etc/mywebapp
echo "operator ALL=(root) NOPASSWD: /bin/systemctl start mywebapp-docker, /bin/systemctl stop mywebapp-docker, /bin/systemctl restart mywebapp-docker, /bin/systemctl status mywebapp-docker, /bin/systemctl reload nginx" >/etc/sudoers.d/operator-mywebapp-docker
chmod 440 /etc/sudoers.d/operator-mywebapp-docker

echo "==> MariaDB"
systemctl enable mariadb
systemctl start mariadb || true
mysql -e "CREATE DATABASE IF NOT EXISTS ${DEPLOY_DB_NAME};"
mysql -e "CREATE USER IF NOT EXISTS '${DEPLOY_DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -e "ALTER USER '${DEPLOY_DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DEPLOY_DB_NAME}.* TO '${DEPLOY_DB_USER}'@'127.0.0.1'; FLUSH PRIVILEGES;"

echo "==> App dir (for documentation / launch if needed)"
mkdir -p "$DEPLOY_APP_DIR"
install -m755 "$LAUNCH_SRC" "$DEPLOY_APP_DIR/launch.sh"
chown "${DEPLOY_APP_USER}:" "$DEPLOY_APP_DIR/launch.sh"

umask 077
cat >/etc/mywebapp/docker-app.env <<EOF
NODE_ENV=production
APP_PORT=${DEPLOY_APP_PORT}
DB_HOST=${DEPLOY_DB_HOST}
DB_PORT=${DEPLOY_DB_PORT}
DB_USER=${DEPLOY_DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DEPLOY_DB_NAME}
EOF
chmod 600 /etc/mywebapp/docker-app.env

echo "DOCKER_IMAGE=${DEPLOY_GHCR_IMAGE}" >/etc/mywebapp/docker-image.env
chmod 644 /etc/mywebapp/docker-image.env

install -m644 "$TMPL_DIR/mywebapp-docker.service.template" /etc/systemd/system/mywebapp-docker.service
systemctl daemon-reload
systemctl enable mywebapp-docker

echo "==> Nginx"
render_nginx_template
rm -f /etc/nginx/sites-enabled/default
ln -sf "/etc/nginx/sites-available/${DEPLOY_UNIT}" /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "==> Start container"
systemctl restart mywebapp-docker || systemctl start mywebapp-docker

echo "==> Finish"
install -d -m755 /home/student
echo "$N" >/home/student/gradebook
chown student:student /home/student/gradebook
passwd -l ubuntu 2>/dev/null || true
echo "Done. Update /etc/mywebapp/docker-image.env to image from GHCR (latest/stable). Nginx -> ${DEPLOY_APP_BIND}:${DEPLOY_APP_PORT}. Users: student, teacher, operator (pw ${DEFAULT_PW})."
