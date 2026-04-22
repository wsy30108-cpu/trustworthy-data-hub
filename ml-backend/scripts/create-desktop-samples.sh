#!/usr/bin/env bash
# Drop Label Studio sample files onto the current user's Desktop.
#
# Works on macOS, Linux, and Windows-Git-Bash. Requires Python 3.
# ffmpeg is optional - without it, JPG / MP3 / OGG / MP4 / WEBM are skipped
# and only PNG / WAV / JSON / CSV / TXT files are produced.
#
# Usage:
#   ./scripts/create-desktop-samples.sh              # defaults to $HOME/Desktop/label-studio-samples
#   ./scripts/create-desktop-samples.sh /tmp/foo     # custom output dir

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Pick a sensible default Desktop path.
if [[ -n "${1-}" ]]; then
  OUT="$1"
elif [[ -d "$HOME/Desktop" ]]; then
  OUT="$HOME/Desktop/label-studio-samples"
elif [[ -d "$HOME/桌面" ]]; then
  OUT="$HOME/桌面/label-studio-samples"
elif [[ -n "${USERPROFILE-}" && -d "$USERPROFILE/Desktop" ]]; then
  OUT="$USERPROFILE/Desktop/label-studio-samples"
else
  OUT="$PWD/label-studio-samples"
fi

mkdir -p "$OUT"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[warn] ffmpeg not found on PATH - JPG / MP3 / OGG / MP4 / WEBM will be skipped."
fi

python3 "$SCRIPT_DIR/create_samples.py" "$OUT"

echo ""
echo "Output directory: $OUT"
echo ""
echo "To import into Label Studio:"
echo "  1. Open http://localhost:8080/"
echo "  2. Create or open a project matching one of the label configs printed in"
echo "     $OUT/README.md"
echo "  3. Project -> Import -> drag & drop the files from the matching subdir."
