#!/usr/bin/env bash
# One-time WSL2 GPU setup for this repo (run inside Ubuntu/WSL).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

VENV_DIR="${WSL_VENV_DIR:-$HOME/.venvs/signlanguage-recognition-app}"
PYTHON_VERSION="${WSL_PYTHON_VERSION:-3.12}"
ACTIVATE_HELPER="$REPO_ROOT/ML/activate_wsl_gpu.sh"

echo "==> Repo: $REPO_ROOT"
echo "==> Linux venv: $VENV_DIR (avoids broken venvs on /mnt/c)"

if [[ "$REPO_ROOT" == /mnt/* ]]; then
  echo "==> Note: project is on a Windows drive; the venv lives under \$HOME, not in the repo."
fi

if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "ERROR: nvidia-smi not found in WSL."
  echo "  - Install/update NVIDIA driver on Windows"
  echo "  - Run: wsl --update && wsl --shutdown"
  echo "  - Re-open Ubuntu and retry"
  exit 1
fi

echo "==> GPU (WSL):"
nvidia-smi --query-gpu=name,driver_version --format=csv,noheader

if [[ -d .venv-ml ]]; then
  echo "==> Removing repo .venv-ml (use $VENV_DIR instead)..."
  rm -rf .venv-ml
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "==> Installing uv (Python version manager)..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  # shellcheck disable=SC1091
  [[ -f "$HOME/.local/bin/env" ]] && source "$HOME/.local/bin/env"
  export PATH="$HOME/.local/bin:$PATH"
fi

echo "==> Installing Python $PYTHON_VERSION..."
uv python install "$PYTHON_VERSION"

if [[ ! -f "$VENV_DIR/bin/activate" ]]; then
  echo "==> Creating venv..."
  uv venv "$VENV_DIR" --python "$PYTHON_VERSION"
fi

echo "==> Installing TensorFlow with bundled CUDA..."
uv pip install --python "$VENV_DIR/bin/python" --upgrade pip
uv pip install --python "$VENV_DIR/bin/python" "tensorflow[and-cuda]>=2.16" kaggle

write_activate_helper() {
  cat >"$ACTIVATE_HELPER" <<'EOF'
#!/usr/bin/env bash
# Source this file in WSL: source ML/activate_wsl_gpu.sh
VENV_DIR="${WSL_VENV_DIR:-$HOME/.venvs/signlanguage-recognition-app}"
if [[ ! -f "$VENV_DIR/bin/activate" ]]; then
  echo "Missing venv at $VENV_DIR. Run: bash ML/setup_wsl_gpu.sh"
  return 1 2>/dev/null || exit 1
fi
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"
SP="$VENV_DIR/lib/python$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')/site-packages"
if [[ -d "$SP/nvidia" ]]; then
  NVIDIA_LIBS="$(find "$SP/nvidia" -maxdepth 2 -type d -name lib | tr '\n' ':')"
  export LD_LIBRARY_PATH="${NVIDIA_LIBS}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}:/usr/lib/wsl/lib"
fi
echo "Activated GPU venv: $VENV_DIR"
EOF
  chmod +x "$ACTIVATE_HELPER"
  sed -i 's/\r$//' "$ACTIVATE_HELPER" 2>/dev/null || true
}

write_activate_helper

echo "==> Verifying TensorFlow GPU..."
# shellcheck disable=SC1091
source "$ACTIVATE_HELPER"
python3 -c "
import tensorflow as tf
print('TensorFlow:', tf.__version__)
gpus = tf.config.list_physical_devices('GPU')
print('GPUs:', gpus)
if not gpus:
    raise SystemExit('No GPU detected. See README GPU (WSL2) section.')
print('OK — GPU ready for training.')
"

echo ""
echo "Done. Each new Ubuntu session:"
echo "  cd $REPO_ROOT"
echo "  source ML/activate_wsl_gpu.sh"
echo "  python ML/train_baseline.py --epochs 10"
