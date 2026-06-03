# Sign Language Recognition App

ASL letter recognition on mobile using an **Expo development client** (native camera, MediaPipe hand tracking, TFLite). Expo Go is not supported.
![alt text](https://github.com/tingchungcheng/signlanguage-recognition-app/blob/main/architecture_plan.png)


## Documentation

| Guide | Contents |
|--------|----------|
| **[docs/app.md](docs/app.md)** | Dev client install, Android/iOS build, daily workflow |
| **[docs/ml.md](docs/ml.md)** | Optional: dataset, training, WSL GPU |

## Clone and run (no training)

Pretrained assets live in **`App/assets/`** and are meant to be **committed to GitHub** so a fresh clone can run without training.

| File | Size (approx.) | Purpose |
|------|----------------|--------|
| `asl_baseline.tflite` | ~6.6 MB | A–Z classifier (TFLite) |
| `labels.txt` | small | Class names (A–Z) |
| `hand_landmarker.task` | ~7.5 MB | MediaPipe hand tracking (Android) |

```bash
git clone <your-repo-url>
cd signlanguage-recognition-app
npm install --legacy-peer-deps
npm run setup:app
npm run android:dev
```

On macOS with iPhone: `npm run ios:dev`

After the dev client is installed once:

```bash
npm start
```

Open the **Sign Language** dev client on your device (same Wi‑Fi as your PC). Do not use Expo Go.

`npm run copy-ml-assets` is **only** needed after you retrain (copies from `ML/artifacts/`). If you pulled from git and the three files above exist under `App/assets/`, you can skip it.

### First-time Android (hand tracking)

Hand tracking uses a native MediaPipe plugin. After clone or when native config changes:

```bash
npx expo prebuild --clean
npm run android:dev
```

`app.json` uses `expo-vision-camera-v4-mediapipe/plugin` and `plugins/withMediapipeAndroidFix.js` (MediaPipe **0.10.29** for x86_64 emulators).

## Optional: retrain the classifier

See **[docs/ml.md](docs/ml.md)**. After training:

```bash
npm run copy-ml-assets
npm run android:dev
```

Training writes to gitignored `ML/artifacts/`; `copy-ml-assets` updates `App/assets/` for the app (and for committing an updated model).

## Pushing models to GitHub

Ensure these paths are tracked (not ignored):

- `App/assets/asl_baseline.tflite`
- `App/assets/labels.txt`
- `App/assets/hand_landmarker.task`

```bash
git add App/assets/asl_baseline.tflite App/assets/labels.txt App/assets/hand_landmarker.task
git commit -m "Add bundled TFLite and MediaPipe models for clone-and-run"
git push
```

Total bundled size is ~14 MB (within normal GitHub limits; Git LFS not required). Do not commit `ML/artifacts/`, `dataset/`, or `.venv-ml/`.

## Repository layout

```text
App/assets/    # Bundled models (commit for clone-and-run)
App/src/       # React Native app
ML/            # Training scripts (optional)
docs/          # App and ML guides
plugins/       # Expo config plugins (MediaPipe version fix)
scripts/       # copy-ml-assets.js, android-clean-cache.js
patches/       # 16 KB page-size fixes for native deps
```

## Notes

- **Google Play 16 KB page size:** run `npm install`, then `npx expo prebuild --clean` and `npm run android:dev` after pull.
- **Android clean rebuild:** stop `android:dev`, then `npm run android:clean-cache` and `npm run android:dev`. Avoid `cd android && gradlew clean` (New Architecture CMake/codegen issue). If `EPERM` on `.cxx`, stop Gradle/Metro and retry.
- **Hand tracking:** Android only; camera must use `pixelFormat="rgb"` for MediaPipe (RGBA8888).
- **iOS:** hand tracking plugin is Android-only; classifier path on iOS may need separate work.
