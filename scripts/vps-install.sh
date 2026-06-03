#!/usr/bin/env bash
# SoloEnv landing page — one-shot VPS bootstrap
# Installs Docker (if needed), SoloEnv CLI, clones the landing repo, and runs soloenv up.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/fleames/soloenv-landing/main/scripts/vps-install.sh | bash
#
# Optional env vars:
#   SOLOENV_VERSION=v0.2.0     Pin CLI release (default: latest)
#   SOLOENV_DIR=/opt/soloenv-landing   Install directory (default: /opt/soloenv-landing)
#   SOLOENV_TTL=168h           Auto teardown duration (default: 168h)
#   SOLOENV_EXTRA_FLAGS="..."  Extra flags passed to soloenv up
#   SKIP_DOCKER=1              Skip Docker install check
#   SKIP_UP=1                  Clone + install only, do not run soloenv up

set -euo pipefail

SOLOENV_REPO="${SOLOENV_REPO:-https://github.com/fleames/soloenv-landing.git}"
SOLOENV_CLI_REPO="${SOLOENV_CLI_REPO:-fleames/soloenv-cli}"
SOLOENV_DIR="${SOLOENV_DIR:-/opt/soloenv-landing}"
SOLOENV_BIN="${SOLOENV_BIN:-/usr/local/bin/soloenv}"
SOLOENV_TTL="${SOLOENV_TTL:-168h}"
SOLOENV_EXTRA_FLAGS="${SOLOENV_EXTRA_FLAGS:-}"

log() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

as_root() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    die "This step needs root. Re-run as root or install sudo."
  fi
}

detect_arch() {
  local arch
  arch="$(uname -m)"
  case "$arch" in
    x86_64|amd64) echo amd64 ;;
    aarch64|arm64) echo arm64 ;;
    *) die "Unsupported CPU architecture: $arch (need amd64 or arm64)" ;;
  esac
}

install_docker() {
  if [[ "${SKIP_DOCKER:-0}" == "1" ]]; then
    log "Skipping Docker install (SKIP_DOCKER=1)"
    return
  fi
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    log "Docker already installed and running"
    return
  fi
  log "Installing Docker..."
  as_root sh -c 'curl -fsSL https://get.docker.com | sh'
  if [[ "${EUID:-$(id -u)}" -ne 0 ]] && getent group docker >/dev/null 2>&1; then
    as_root usermod -aG docker "$USER" || true
    warn "Added $USER to the docker group. You may need to log out and back in."
    warn "If soloenv up fails with permission denied, run: newgrp docker"
  fi
  as_root systemctl enable --now docker 2>/dev/null || true
}

resolve_cli_version() {
  if [[ -n "${SOLOENV_VERSION:-}" ]]; then
    echo "${SOLOENV_VERSION#v}"
    return
  fi
  need_cmd curl
  curl -fsSL "https://api.github.com/repos/${SOLOENV_CLI_REPO}/releases/latest" \
    | grep -oE '"tag_name"[[:space:]]*:[[:space:]]*"v[^"]+"' \
    | head -1 \
    | sed -E 's/.*"v([^"]+)".*/\1/' \
    || die "Could not resolve latest soloenv-cli release"
}

install_soloenv_cli() {
  if [[ -x "$SOLOENV_BIN" ]] && "$SOLOENV_BIN" version >/dev/null 2>&1; then
    log "SoloEnv CLI already installed at $SOLOENV_BIN"
    return
  fi

  local version arch asset url tmpdir
  version="$(resolve_cli_version)"
  arch="$(detect_arch)"
  asset="soloenv-cli_${version}_linux_${arch}.tar.gz"
  url="https://github.com/${SOLOENV_CLI_REPO}/releases/download/v${version}/${asset}"

  log "Downloading SoloEnv v${version} (${arch})..."
  need_cmd curl
  need_cmd tar
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "$tmpdir"' EXIT

  curl -fsSL "$url" -o "${tmpdir}/${asset}"
  tar -xzf "${tmpdir}/${asset}" -C "$tmpdir"
  as_root install -m 0755 "${tmpdir}/soloenv" "$SOLOENV_BIN"
  log "Installed $SOLOENV_BIN ($("$SOLOENV_BIN" version 2>/dev/null || echo "v${version}"))"
}

clone_landing() {
  need_cmd git
  if [[ -d "$SOLOENV_DIR/.git" ]]; then
    log "Updating existing landing repo at $SOLOENV_DIR"
    git -C "$SOLOENV_DIR" pull --ff-only
  else
    log "Cloning landing page to $SOLOENV_DIR"
    as_root mkdir -p "$(dirname "$SOLOENV_DIR")"
    if [[ ! -d "$SOLOENV_DIR" ]]; then
      as_root git clone "$SOLOENV_REPO" "$SOLOENV_DIR"
    else
      die "$SOLOENV_DIR exists but is not a git repo"
    fi
  fi
  # Allow current user to edit config without sudo
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    as_root chown -R "$USER":"$USER" "$SOLOENV_DIR" 2>/dev/null || true
  fi
}

check_config() {
  if grep -q 'YOUR_FORM_ID' "$SOLOENV_DIR/config.js" 2>/dev/null; then
    warn "config.js still has YOUR_FORM_ID — set FORM_URL before sharing the public link:"
    warn "  nano $SOLOENV_DIR/config.js"
  fi
}

run_soloenv_up() {
  if [[ "${SKIP_UP:-0}" == "1" ]]; then
    log "Skipping soloenv up (SKIP_UP=1)"
    log "When ready: cd $SOLOENV_DIR && soloenv up --detach --protect --ttl $SOLOENV_TTL"
    return
  fi

  log "Starting landing page with SoloEnv..."
  cd "$SOLOENV_DIR"

  # Tear down any previous run in this directory
  if [[ -f .soloenv/state.json ]]; then
    warn "Existing environment found — running soloenv down first"
    "$SOLOENV_BIN" down || true
  fi

  # shellcheck disable=SC2086
  "$SOLOENV_BIN" up --detach --protect --ttl "$SOLOENV_TTL" --open=false $SOLOENV_EXTRA_FLAGS

  echo
  log "Done. Run these on the VPS:"
  echo "  cd $SOLOENV_DIR"
  echo "  soloenv status    # public URL + password"
  echo "  soloenv logs -f   # container logs"
  echo "  soloenv down      # stop everything"
}

main() {
  uname -s | grep -qi linux || die "This script supports Linux VPS only"

  log "SoloEnv landing — VPS bootstrap"
  install_docker
  install_soloenv_cli
  clone_landing
  check_config
  run_soloenv_up
}

main "$@"
