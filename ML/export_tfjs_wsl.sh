#!/usr/bin/env bash
# Export Keras model to TF.js for Expo Go (use this instead of the GPU training venv).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

VENV_DIR="${TFJS_EXPORT_VENV:-$HOME/.venvs/tfjs-export}"

if ! command -v uv >/dev/null 2>&1; then
  echo "==> Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  # shellcheck disable=SC1091
  [[ -f "$HOME/.local/bin/env" ]] && source "$HOME/.local/bin/env"
  export PATH="$HOME/.local/bin:$PATH"
fi

if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  echo "==> Creating export venv at $VENV_DIR (Python 3.11)..."
  uv python install 3.11
  uv venv "$VENV_DIR" --python 3.11
  uv pip install --python "$VENV_DIR/bin/python" "tensorflow==2.16.2" "tensorflowjs==4.17.0" "setuptools==69.5.1"
fi

echo "==> Exporting to App/assets/asl_baseline_tfjs/"
"$VENV_DIR/bin/python" ML/export_tfjs.py
echo "Done."
