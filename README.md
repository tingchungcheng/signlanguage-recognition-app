# Sign Language Recognition App

ASL letter recognition on mobile (realtime dev build), plus Python training for a custom A–Z model.

## Documentation

| Guide | Contents |
|--------|----------|
| **[docs/app.md](docs/app.md)** | Install, dev build, realtime camera + TFLite, app layout |
| **[docs/ml.md](docs/ml.md)** | Dataset, training, WSL GPU, TF.js export |

## Quick start

**App (realtime on device):**

```bash
npm install --legacy-peer-deps
npm run setup:app
npm run copy-ml-assets
npm run android:dev
```

**ML (train model):**

```bash
pip install -r ML/requirements.txt
python ML/prepare_dataset.py --overwrite
python ML/train_baseline.py --epochs 10
npm run copy-ml-assets
```

## Repository layout

```text
App/          # React Native / Expo app
ML/           # Dataset prep, training, export scripts
docs/         # App and ML documentation
dataset/      # Downloaded data (gitignored)
scripts/      # copy-ml-assets.js
```

## Notes

- **Expo Go** does not support realtime recognition; use a [development build](docs/app.md).
- Large files (`dataset/`, `ML/artifacts/`) are gitignored; `App/assets/*.tflite` is committed for the app.
