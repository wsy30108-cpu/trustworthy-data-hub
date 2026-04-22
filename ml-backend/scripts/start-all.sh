#!/usr/bin/env bash
# One-shot launcher: Label Studio (port 8080) + ML backend (port 9090).
#
# Usage:
#   ./scripts/start-all.sh                 # start both in foreground (Ctrl-C stops)
#   ./scripts/start-all.sh --bg            # start both in background (logs to ./.run/)
#   ./scripts/start-all.sh --stop          # stop background processes
#
# Requirements:
#   * Python 3.9+
#   * pip
#
# After it boots:
#   Label Studio  -> http://localhost:8080          (login page: /user/login/)
#     username:     admin@example.com
#     password:     admin12345
#     API token:    0123456789abcdef0123456789abcdef01234567
#   ML backend    -> http://localhost:9090          (health: /health)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
LS_LOG="$RUN_DIR/label-studio.log"
ML_LOG="$RUN_DIR/ml-backend.log"
LS_PID="$RUN_DIR/label-studio.pid"
ML_PID="$RUN_DIR/ml-backend.pid"

LS_USER="${LS_USER:-admin@example.com}"
LS_PASSWORD="${LS_PASSWORD:-admin12345}"
LS_TOKEN="${LS_TOKEN:-0123456789abcdef0123456789abcdef01234567}"
LS_PORT="${LS_PORT:-8080}"
ML_PORT="${ML_PORT:-9090}"

mkdir -p "$RUN_DIR"

ensure_deps() {
  echo "[*] Installing ML backend deps..."
  pip install --quiet -r "$ROOT_DIR/requirements.txt"

  if ! command -v label-studio >/dev/null 2>&1; then
    echo "[*] Installing Label Studio (this may take a minute)..."
    pip install --quiet label-studio
  fi
}

start_fg() {
  ensure_deps
  trap 'kill 0' EXIT INT TERM
  ( cd "$ROOT_DIR" && uvicorn app.main:app --host 0.0.0.0 --port "$ML_PORT" ) &
  LABEL_STUDIO_LEGACY_API_TOKEN_ENABLED=true \
  label-studio start \
    --no-browser \
    --host 0.0.0.0 \
    --port "$LS_PORT" \
    --username "$LS_USER" \
    --password "$LS_PASSWORD" \
    --user-token "$LS_TOKEN" &
  wait
}

start_bg() {
  ensure_deps
  if [[ -f "$LS_PID" ]] && kill -0 "$(cat "$LS_PID")" 2>/dev/null; then
    echo "[!] Label Studio already running (pid $(cat "$LS_PID"))"
  else
    LABEL_STUDIO_LEGACY_API_TOKEN_ENABLED=true \
    nohup label-studio start \
      --no-browser \
      --host 0.0.0.0 \
      --port "$LS_PORT" \
      --username "$LS_USER" \
      --password "$LS_PASSWORD" \
      --user-token "$LS_TOKEN" \
      > "$LS_LOG" 2>&1 &
    echo $! > "$LS_PID"
    echo "[+] Label Studio started (pid $(cat "$LS_PID")), log: $LS_LOG"
  fi

  if [[ -f "$ML_PID" ]] && kill -0 "$(cat "$ML_PID")" 2>/dev/null; then
    echo "[!] ML backend already running (pid $(cat "$ML_PID"))"
  else
    ( cd "$ROOT_DIR" && nohup uvicorn app.main:app --host 0.0.0.0 --port "$ML_PORT" \
      > "$ML_LOG" 2>&1 & echo $! > "$ML_PID" )
    echo "[+] ML backend started (pid $(cat "$ML_PID")), log: $ML_LOG"
  fi

  echo ""
  echo "    Label Studio -> http://localhost:$LS_PORT"
  echo "      login page  -> http://localhost:$LS_PORT/user/login/"
  echo "      user        -> $LS_USER"
  echo "      password    -> $LS_PASSWORD"
  echo "      token       -> $LS_TOKEN"
  echo ""
  echo "    ML backend   -> http://localhost:$ML_PORT"
  echo "      health      -> http://localhost:$ML_PORT/health"
  echo ""
  echo "Tip: register ML backend URL http://localhost:$ML_PORT in your Label Studio project."
}

stop_bg() {
  for pidfile in "$LS_PID" "$ML_PID"; do
    if [[ -f "$pidfile" ]]; then
      pid="$(cat "$pidfile")"
      if kill -0 "$pid" 2>/dev/null; then
        echo "[*] Stopping pid $pid ($(basename "$pidfile"))"
        kill "$pid" || true
      fi
      rm -f "$pidfile"
    fi
  done
}

case "${1:-}" in
  --bg)    start_bg ;;
  --stop)  stop_bg ;;
  "")      start_fg ;;
  *)
    echo "Usage: $0 [--bg|--stop]"
    exit 2
    ;;
esac
