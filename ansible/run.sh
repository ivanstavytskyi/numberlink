#!/usr/bin/env bash
# 1. Put vault.yml on the server (outside git), e.g. ~/numberlink-service/vault.yml
# 2. Then:
#    curl -fsSL https://raw.githubusercontent.com/ivanstavytskyi/Numberlink/main/ansible/run.sh | bash
set -euo pipefail

REPO="${NUMBERLINK_REPO:-https://github.com/ivanstavytskyi/Numberlink.git}"
BRANCH="${NUMBERLINK_BRANCH:-main}"
APP_DIR="${NUMBERLINK_APP_DIR:-$HOME/numberlink-service/numberlink}"
VAULT_SRC="${NUMBERLINK_VAULT:-$(dirname "$APP_DIR")/vault.yml}"

if ! command -v git >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y git
fi

mkdir -p "$(dirname "$APP_DIR")"
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

ANSIBLE_DIR="$APP_DIR/ansible"
if [[ ! -d "$ANSIBLE_DIR" ]]; then
  echo "No ansible/ in $APP_DIR — push this folder to $REPO first." >&2
  exit 1
fi

if [[ "${NUMBERLINK_BOOTSTRAPPED:-}" != "1" ]]; then
  export NUMBERLINK_BOOTSTRAPPED=1
  exec bash "$ANSIBLE_DIR/run.sh" "$@"
fi

cd "$ANSIBLE_DIR"

if [[ -f "$VAULT_SRC" ]]; then
  cp "$VAULT_SRC" vault.yml
  chmod 600 vault.yml
fi

if [[ ! -f vault.yml ]]; then
  echo "Put vault.yml on the server first: $VAULT_SRC" >&2
  echo "Then run this script again." >&2
  exit 1
fi

if ! command -v ansible-playbook >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y ansible
fi

exec ansible-playbook site.yml -i inventory/local.ini "$@"
