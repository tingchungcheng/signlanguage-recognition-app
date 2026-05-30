# App guide

Realtime ASL recognition with **Expo development client** (not Expo Go).

## Prerequisites

- Node.js 20+
- npm
- **Android:** Android Studio, SDK, USB debugging or emulator
- **iOS:** Mac, Xcode, Apple developer signing (for device)

## First-time setup

```bash
git clone <repo>
cd signlanguage-recognition-app
npm install --legacy-peer-deps
npm run setup:app
```

Bundled models should already be in `App/assets/` from git:

- `asl_baseline.tflite` — letter classifier  
- `labels.txt` — A–Z labels  
- `hand_landmarker.task` — MediaPipe hand tracking (Android)

Run `npm run copy-ml-assets` only if you retrained and have `ML/artifacts/`.

### Build and install the dev client

**Android (Windows / Mac / Linux):**

```bash
npm run android:dev
```

**iOS (macOS only):**

```bash
npm run ios:dev
```

This runs `expo prebuild` (creates `android/` / `ios/` locally, gitignored), compiles native code (Vision Camera, TFLite, frame processors), and installs the app on your device or emulator.

First build can take 10–20 minutes. Later builds are faster.

## Daily development

```bash
npm start
```

- Starts Metro with `--dev-client` (not Expo Go).
- On your phone, open the **Sign Language Recognition App** icon (the dev build you installed).
- Shake device → reload if needed.

You do **not** need to run `android:dev` again unless native dependencies change.

## How recognition works

1. Vision Camera streams front-camera frames.
2. **MediaPipe Hands** (Android) tracks your hand; the orange frame and skeleton follow the hand bounding box.
3. That region is cropped to 96×96, converted to **float32 0–255** for TFLite, mirrored.
4. Letter + confidence appear **beside** the tracked frame; use **Add letter** and **Speak**.

**Android rebuild required** after pulling (native MediaPipe plugin):

```bash
npm install --legacy-peer-deps
npx expo prebuild --clean
npm run android:dev
```

`App/assets/hand_landmarker.task` (~7.5 MB) should be committed in git for clone-and-run.

**iOS:** hand tracking plugin is Android-only; letter recognition on iOS still needs a separate path.

## After retraining the model

If you trained a new model in `ML/artifacts/`:

```bash
npm run copy-ml-assets
git add App/assets/asl_baseline.tflite App/assets/labels.txt
git commit -m "Update classifier model"
npm run android:dev
```

If you only pulled from git, `copy-ml-assets` skips when `ML/artifacts/` is missing and prints `App assets OK`.

## Why not Expo Go?

Expo Go cannot load:

- `react-native-vision-camera` frame processors
- `react-native-fast-tflite` (Nitro / native TFLite)
- `vision-camera-resize-plugin`

Those require a **custom dev client** built with `expo run:android` or `expo run:ios`.

## Troubleshooting

| Issue | Fix |
|--------|-----|
| Opens in Expo Go / wrong app | Uninstall Expo Go scan habit; open your **dev client** app after `npm start` |
| `copy-ml-assets` missing ML/artifacts | OK if `App/assets/` models came from git |
| Hand tracking: RGBA8888 error | Camera must use `pixelFormat="rgb"` (not `yuv`) for MediaPipe |
| Low classifier fps | Normal on emulator/DroidCam; MediaPipe + TFLite share the frame budget |
| `hand_landmarker.task` missing after clone | File not pushed — maintainer must `git add App/assets/hand_landmarker.task` |
| Metro cache | `npx expo start --dev-client -c` |
| Camera permission | Grant in system settings |
| `Failed to create TFLite interpreter` | GPU delegate rejected the model; app retries NNAPI then CPU. Reload Metro; if it persists, run `npm run copy-ml-assets` and rebuild |
| Build fails after pull | `npm install --legacy-peer-deps`, then `npm run android:dev` again |
| Play Console: not 16 KB page compatible | Run `npx expo prebuild --clean`, then `npm run android:dev` (patches + NDK 28 in `app.json`) |
| iOS signing | Set team in Xcode (`ios/` after prebuild) |

ML training: [ml.md](./ml.md).
