#!/bin/bash
# Prepare Ubuntu 24.04 for a GitHub Actions self-hosted runner (Lab 3).
# Runner registration is MANUAL — do not commit registration tokens to git.
set -euo pipefail

RUNNER_VERSION="${RUNNER_VERSION:-2.323.0}"
RUNNER_HOME="${RUNNER_HOME:-/opt/actions-runner}"
RUNNER_USER="${RUNNER_USER:-github-runner}"
REPO_URL="${REPO_URL:-https://github.com/Pasha-Makarenko/devops-kpi}"

echo "==> Packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y ca-certificates curl git jq openssh-client docker.io

systemctl enable docker
systemctl start docker

echo "==> Runner user"
if ! id "$RUNNER_USER" &>/dev/null; then
	useradd -m -s /bin/bash "$RUNNER_USER"
fi
usermod -aG docker "$RUNNER_USER"

echo "==> Download actions-runner v${RUNNER_VERSION}"
install -d -m755 "$RUNNER_HOME"
cd "$RUNNER_HOME"
curl -fsSLO "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
tar xzf "actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
chown -R "${RUNNER_USER}:${RUNNER_USER}" "$RUNNER_HOME"

cat <<EOF

==> Manual registration (required)

1. GitHub: ${REPO_URL} -> Settings -> Actions -> Runners -> New self-hosted runner
2. Choose Linux / x64 and copy the one-time registration token.
3. On this VM, as root:

   sudo -u ${RUNNER_USER} bash -lc '
     cd ${RUNNER_HOME}
     ./config.sh --url ${REPO_URL} --token YOUR_TOKEN --labels self-hosted,linux,deploy --unattended
   '
   ./svc.sh install ${RUNNER_USER}
   ./svc.sh start

4. From this runner VM, configure SSH access to the target node (not this VM):

   sudo -u ${RUNNER_USER} ssh-keygen -t ed25519 -N "" -f /home/${RUNNER_USER}/.ssh/id_ed25519
   sudo -u ${RUNNER_USER} ssh-copy-id -i /home/${RUNNER_USER}/.ssh/id_ed25519.pub USER@TARGET_IP

5. Add repository secrets (Settings -> Secrets and variables -> Actions):
   - DEPLOY_HOST      — target node IP/hostname
   - DEPLOY_USER      — SSH user on target (e.g. student)
   - DEPLOY_SSH_KEY   — private key from step 4
   - DEPLOY_BASE_URL  — http://TARGET_IP (nginx on port 80)
   - DEPLOY_PORT      — optional, default 22

6. Make GHCR package public: Packages -> devops-kpi -> Package settings -> Change visibility.

After the lab demo, stop the runner service and shut down this VM:

   cd ${RUNNER_HOME} && ./svc.sh stop
   ./config.sh remove --token REMOVAL_TOKEN

EOF
