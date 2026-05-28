# Sign Language Recognition App

React Native (Expo + TypeScript) app for sign-language recognition, word building, and TTS output.

## Project Layout

This repository is split into two main modules:

- `App/` - mobile app code (React Native/Expo)
- `ML/` - dataset prep and training scripts

```text
.
├── App
│   ├── App.tsx
│   └── src
│       ├── components
│       ├── screens
│       ├── services
│       ├── state
│       ├── theme
│       └── types
├── ML
│   ├── prepare_dataset.py
│   ├── train_baseline.py
│   └── requirements.txt
├── dataset/
├── index.js
├── app.json
├── package.json
└── tsconfig.json
```

## Current Status

- Step 1 app scaffold is complete (camera + landmark overlay + app state + theme).
- Dataset downloaded and prepared for A-Z classes.
- Baseline training scripts are ready in `ML/`.

## Prerequisites

- Node.js `20+` recommended
- npm
- Python `3.10+` for ML scripts

## Run The App

```bash
npm install
npm start
```

Then use Expo controls:
- `a` Android
- `i` iOS
- or scan QR with Expo Go

## ML Workflow

### 1) Prepare dataset split (A-Z)

```bash
python3 ML/prepare_dataset.py --overwrite
```

### 2) Train baseline model

```bash
python3 -m venv .venv-ml
source .venv-ml/bin/activate
pip install -r ML/requirements.txt
python3 ML/train_baseline.py --epochs 10
```

Expected artifacts:
- `ML/artifacts/asl_baseline.keras`
- `ML/artifacts/asl_baseline.tflite`
- `ML/artifacts/labels.txt`

## Troubleshooting

- `TypeError: os.availableParallelism is not a function`
  - Use newer Node: `nvm use 20`

- Android bundling error from `@mediapipe/tasks-vision/vision_bundle.mjs`
  - Native build uses non-web service path now.
  - Clear cache: `npx expo start -c`

