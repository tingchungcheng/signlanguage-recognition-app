# Machine learning guide

Train an ASL A–Z classifier and export artifacts for the mobile app.

Dataset: [ayuraj/asl-dataset](https://www.kaggle.com/datasets/ayuraj/asl-dataset) (~2,515 images, 36 classes A–Z + 0–9).

## Prerequisites

- Python 3.10+ (3.12 recommended for TensorFlow)
- [Kaggle API token](https://www.kaggle.com/settings) at `~/.kaggle/kaggle.json` (or `%USERPROFILE%\.kaggle\kaggle.json` on Windows)

## CPU training (Windows / macOS / Linux)

```bash
python -m venv .venv-ml
# Windows: .\.venv-ml\Scripts\activate
# macOS/Linux: source .venv-ml/bin/activate
pip install -r ML/requirements.txt
```

### Download dataset

```bash
kaggle datasets download -d ayuraj/asl-dataset -p dataset --unzip
```

### Prepare splits (A–Z only)

```bash
python ML/prepare_dataset.py --overwrite
```

Include digits:

```bash
python ML/prepare_dataset.py --overwrite --include-digits
```

Output: `dataset/processed/train` and `dataset/processed/val`.

### Train

```bash
python ML/train_baseline.py --epochs 10
```

Artifacts (gitignored, copy to app manually):

- `ML/artifacts/asl_baseline.keras`
- `ML/artifacts/asl_baseline.tflite`
- `ML/artifacts/labels.txt`

```bash
npm run copy-ml-assets
```

## GPU training (Windows + WSL2)

TensorFlow GPU on native Windows is not supported. Use WSL2 + Ubuntu.

**One-time (Administrator PowerShell):**

```powershell
.\ML\install_wsl.ps1
```

Reboot if prompted, finish Ubuntu setup, then in Ubuntu:

```bash
cd /mnt/c/path/to/signlanguage-recognition-app
bash ML/setup_wsl_gpu.sh
```

**Train:**

```bash
source ML/activate_wsl_gpu.sh
python ML/prepare_dataset.py --overwrite
python ML/train_baseline.py --epochs 10
```

Kaggle credentials in WSL:

```bash
mkdir -p ~/.kaggle
cp /mnt/c/Users/YOUR_USER/.kaggle/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
```

Use `source ML/activate_wsl_gpu.sh` — not `.venv-ml` on `/mnt/c` (NTFS breaks Linux venvs). The setup script uses `~/.venvs/signlanguage-recognition-app`.

## Export TF.js (optional, web / Expo Go experiments)

Do **not** use the GPU training venv for export (protobuf conflicts).

```bash
bash ML/export_tfjs_wsl.sh
```

Or:

```bash
~/.venvs/tfjs-export/bin/python ML/export_tfjs.py
```

Output: `App/assets/asl_baseline_tfjs/`

## ML scripts

| Script | Purpose |
|--------|---------|
| `ML/prepare_dataset.py` | Kaggle → train/val split |
| `ML/train_baseline.py` | Train CNN, save Keras + TFLite |
| `ML/export_tfjs.py` | Export TF.js bundle for app |
| `ML/setup_wsl_gpu.sh` | WSL GPU venv setup |
| `ML/activate_wsl_gpu.sh` | Activate WSL GPU env |

## Troubleshooting

- **Kaggle fails** — Check `kaggle.json` and dataset access.
- **WSL: no distributions** — Run `ML/install_wsl.ps1` as Administrator.
- **WSL: ensurepip / venv on `/mnt/c`** — Use `bash ML/setup_wsl_gpu.sh` (venv in `~/.venvs/...`).
- **WSL: `set: pipefail` invalid** — CRLF line endings: `perl -pi -e 's/\r$//' ML/*.sh`
- **WSL: no GPU** — `nvidia-smi` must work in Ubuntu; run `wsl --update` then `wsl --shutdown`.
- **Python 3.14** — Setup script installs Python 3.12 via `uv`.

App install and realtime camera: [app.md](./app.md).
