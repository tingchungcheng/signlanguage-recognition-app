# Machine learning guide (optional)

Training is **optional**. The repo ships pretrained files in **`App/assets/`** so you can clone and run the app without this guide. Use this doc when you want to **retrain** or replace the classifier.

Dataset: [ayuraj/asl-dataset](https://www.kaggle.com/datasets/ayuraj/asl-dataset) (~2,515 images, 36 classes A–Z + 0–9).

## After training: update the app and GitHub

Training writes to **`ML/artifacts/`** (gitignored). Copy into the app and commit if you want others to pull your new model:

```bash
npm run copy-ml-assets
git add App/assets/asl_baseline.tflite App/assets/labels.txt
git commit -m "Update ASL classifier model"
git push
```

`hand_landmarker.task` is unchanged by training; only commit it once if it is not already in the repo.

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

Output: `dataset/processed/train` and `dataset/processed/val` (gitignored).

### Train

```bash
python ML/train_baseline.py --epochs 10
```

Outputs in `ML/artifacts/` (gitignored):

- `asl_baseline.keras`
- `asl_baseline.tflite`
- `labels.txt`

Then:

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
npm run copy-ml-assets
```

Kaggle credentials in WSL:

```bash
mkdir -p ~/.kaggle
cp /mnt/c/Users/YOUR_USER/.kaggle/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
```

Use `source ML/activate_wsl_gpu.sh` — not `.venv-ml` on `/mnt/c` (NTFS breaks Linux venvs). The setup script uses `~/.venvs/signlanguage-recognition-app`.

## ML scripts

| Script | Purpose |
|--------|---------|
| `ML/prepare_dataset.py` | Kaggle → train/val split |
| `ML/train_baseline.py` | Train CNN, save Keras + TFLite |
| `ML/export_tfjs.py` | Optional TF.js export (not used by dev client app) |
| `ML/setup_wsl_gpu.sh` | WSL GPU venv setup |
| `ML/activate_wsl_gpu.sh` | Activate WSL GPU env |

## Troubleshooting

- **`ModuleNotFoundError: No module named 'tensorflow'`** — You ran system `python`, not the venv. In PowerShell from the repo root:
  ```powershell
  .\.venv-ml\Scripts\Activate.ps1
  pip install -r ML/requirements.txt
  python ML/train_baseline.py --epochs 10
  ```
  Or without activating: `.\.venv-ml\Scripts\python.exe ML/train_baseline.py --epochs 10`
- **`pip` conflict with `tensorflowjs`** — Training only needs `ML/requirements.txt`. TF.js is optional: `ML/requirements-tfjs.txt`.
- **Kaggle fails** — Check `kaggle.json` and dataset access.
- **WSL: no distributions** — Run `ML/install_wsl.ps1` as Administrator.
- **WSL: ensurepip / venv on `/mnt/c`** — Use `bash ML/setup_wsl_gpu.sh` (venv in `~/.venvs/...`).
- **WSL: `set: pipefail` invalid** — CRLF line endings: `perl -pi -e 's/\r$//' ML/*.sh`
- **WSL: no GPU** — `nvidia-smi` must work in Ubuntu; run `wsl --update` then `wsl --shutdown`.
- **Python 3.14** — Setup script installs Python 3.12 via `uv`.

App install and realtime camera: [app.md](./app.md).
