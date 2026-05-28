# App guide

React Native (Expo SDK 54) app for ASL letter recognition, word building, and text-to-speech.

## Prerequisites

- Node.js 20+
- npm
- For **realtime** recognition: Android device/emulator or Mac + iPhone (dev build only)

## Quick start (realtime)

Expo Go is **not** supported for live recognition. Use a development build.

```bash
npm install --legacy-peer-deps
npm run setup:app
npm run copy-ml-assets
npm run android:dev    # or: npm run ios:dev on macOS
```

After the native app is installed once:

```bash
npm start
```

Open the **development client** on your phone (not Expo Go).

## What the app does

1. Front camera shows a guide box.
2. Vision Camera streams frames at ~10–15 fps.
3. Each frame is resized to 96×96 and classified with `App/assets/asl_baseline.tflite`.
4. Letter + confidence update continuously; tap **Add letter** and **Speak**.

## Project layout

```text
App/
  App.tsx
  assets/          # tflite, labels, optional TF.js export
  src/
    screens/       # RealtimeHandTrackingScreen, HandTrackingScreen router
    services/      # TFLite / TF.js classification, hand detection
    components/    # RecognitionPanel, overlays
    hooks/         # useRealtimeRecognition (legacy Expo path)
```

## Copy model files after retraining

```bash
npm run copy-ml-assets
```

Copies from `ML/artifacts/` to `App/assets/`. Update `App/assets/labels.ts` if class order changes.

## Expo Go

Shows a screen that explains a dev build is required. Expo Go cannot load Vision Camera frame processors or native TFLite.

## Optional: TF.js (web / legacy)

```bash
bash ML/export_tfjs_wsl.sh   # see docs/ml.md
```

## Troubleshooting

| Issue | Fix |
|--------|-----|
| Expo Go: dev build required | Run `npm run android:dev` |
| `babel-preset-expo` missing | `npx expo install babel-preset-expo` |
| Metro cache | `npx expo start -c` |
| No GPU / slow training | Use WSL — see [ml.md](./ml.md) |
| SDK mismatch | `npx expo install --fix` |

More ML and WSL notes: [ml.md](./ml.md).
