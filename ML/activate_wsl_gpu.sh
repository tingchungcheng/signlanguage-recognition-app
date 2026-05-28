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
