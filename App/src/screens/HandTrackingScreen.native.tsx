import type { HandDetectionResult, HandLandmark } from "expo-vision-camera-v4-mediapipe";
import * as Speech from "expo-speech";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { NitroModules } from "react-native-nitro-modules";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  Templates,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
  runAtTargetFps,
} from "react-native-vision-camera";
import { useRunOnJS, useSharedValue } from "react-native-worklets-core";
import { useResizePlugin } from "vision-camera-resize-plugin";
import { RecognitionFrameOverlay } from "../components/RecognitionFrameOverlay";
import { RecognitionPanel } from "../components/RecognitionPanel";
import { IMG_SIZE } from "../../assets/labels";
import { useHandLandmarkerPlugin } from "../hooks/useHandLandmarkerPlugin";
import { useTfliteModelWithFallback } from "../hooks/useTfliteModelWithFallback";
import { useAppState } from "../state/AppStateContext";
import { colors } from "../theme/colors";
import { buildTfliteInputBufferWorklet } from "../utils/buildTfliteInput";
import {
  landmarksToBounds,
  landmarksToBoundsWorklet,
  transformHandLandmarksForDisplay,
  transformRectForDisplay,
  pickPrimaryHand,
  pickPrimaryHandWorklet,
  type NormalizedRect,
} from "../utils/handBounds";
import { indexToPrediction, parseTfliteOutputWorklet } from "../utils/parseTfliteOutput";
import { PredictionSmoother } from "../utils/predictionSmoother";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const TFLITE_MODEL = require("../../assets/asl_baseline.tflite");

/** Letter classifier target; hand scans run less often (MediaPipe is heavy). */
const CLASSIFY_TARGET_FPS = 24;
/** Run MediaPipe every N-th processor tick (within CLASSIFY_TARGET_FPS budget). */
const HAND_SCAN_EVERY_N_TICKS = 10;
/** Min ms between React overlay updates from hand detection. */
const HAND_UI_MIN_INTERVAL_MS = 200;

export function HandTrackingScreen() {
  const insets = useSafeAreaInsets();
  const device = useCameraDevice("front");
  const format = useCameraFormat(device, [
    ...Templates.FrameProcessing,
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ]);
  const { hasPermission, requestPermission } = useCameraPermission();
  const { resize } = useResizePlugin();
  const detectHands = useHandLandmarkerPlugin();
  const tflite = useTfliteModelWithFallback(TFLITE_MODEL);
  const loadedModel = tflite.state === "loaded" ? tflite.model : undefined;
  const boxedModel = useMemo(
    () => (loadedModel != null ? NitroModules.box(loadedModel) : undefined),
    [loadedModel],
  );
  const smootherRef = useRef(new PredictionSmoother());
  const [fps, setFps] = useState(0);
  const [framesClassified, setFramesClassified] = useState(0);
  const [trackRect, setTrackRect] = useState<NormalizedRect | null>(null);
  const [handLandmarks, setHandLandmarks] = useState<HandLandmark[] | null>(null);
  const [handScans, setHandScans] = useState(0);
  const [handTrackError, setHandTrackError] = useState<string | null>(null);
  const frameTimesRef = useRef<number[]>([]);
  const cropRect = useSharedValue<NormalizedRect | null>(null);

  const {
    setModelStatus,
    setModelError,
    predictedLetter,
    setPredictedLetter,
    confidence,
    setConfidence,
    modelStatus,
    modelError,
    word,
    appendToWord,
    clearWord,
  } = useAppState();

  React.useEffect(() => {
    if (tflite.state === "loaded") {
      setModelStatus("ready");
      setModelError(null);
      return;
    }
    if (tflite.state === "error") {
      setModelStatus("error");
      setModelError(tflite.error?.message ?? "Failed to load TFLite model.");
      return;
    }
    setModelStatus("loading");
  }, [setModelError, setModelStatus, tflite]);

  const onHandsDetected = useCallback((result: HandDetectionResult) => {
    if (result.error) {
      setHandTrackError(result.error);
      cropRect.value = null;
      setTrackRect(null);
      setHandLandmarks(null);
      return;
    }

    const hands = Array.isArray(result.hands) ? result.hands : [];
    if (hands.length === 0) {
      setHandTrackError(null);
      cropRect.value = null;
      setTrackRect(null);
      setHandLandmarks(null);
      return;
    }

    setHandTrackError(null);
    const hand = pickPrimaryHand(hands);
    if (hand == null) {
      cropRect.value = null;
      setTrackRect(null);
      setHandLandmarks(null);
      return;
    }
    const bounds = landmarksToBounds(hand);
    cropRect.value = bounds;
    setTrackRect(bounds);
    setHandLandmarks(hand);
  }, [cropRect]);

  const onPrediction = useCallback(
    (classIndex: number, rawConfidence: number) => {
      const smoothed = smootherRef.current.push(indexToPrediction(classIndex, rawConfidence));
      setPredictedLetter(smoothed.label);
      setConfidence(smoothed.confidence);
      setFramesClassified((n) => n + 1);

      const now = Date.now();
      const times = frameTimesRef.current;
      times.push(now);
      while (times.length > 0 && now - times[0]! > 1000) {
        times.shift();
      }
      setFps(times.length);
    },
    [setConfidence, setPredictedLetter],
  );

  const reportHands = useRunOnJS(onHandsDetected, [onHandsDetected]);
  const reportPrediction = useRunOnJS(onPrediction, [onPrediction]);
  const incrementHandScans = useCallback(() => {
    setHandScans((n) => n + 1);
  }, []);
  const reportHandScan = useRunOnJS(incrementHandScans, [incrementHandScans]);

  const handScanTick = useSharedValue(0);
  const lastHandUiMs = useSharedValue(0);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (boxedModel == null) {
        return;
      }

      // One native plugin per frame. MediaPipe ~2–4×/s; classifier uses remaining budget.
      runAtTargetFps(CLASSIFY_TARGET_FPS, () => {
        "worklet";
        handScanTick.value += 1;
        const scanHand =
          detectHands != null && handScanTick.value % HAND_SCAN_EVERY_N_TICKS === 0;

        if (scanHand) {
          reportHandScan();
          const handResult = detectHands(frame);
          if (handResult?.hands?.length) {
            const hand = pickPrimaryHandWorklet(handResult.hands);
            if (hand != null) {
              cropRect.value = landmarksToBoundsWorklet(hand, 0.22);
            }
          } else {
            cropRect.value = null;
          }
          const now = Date.now();
          if (now - lastHandUiMs.value >= HAND_UI_MIN_INTERVAL_MS) {
            lastHandUiMs.value = now;
            reportHands(handResult);
          }
          return;
        }

        const rect = cropRect.value;
        if (rect == null) {
          return;
        }

        const frameWidth = frame.width;
        const frameHeight = frame.height;
        const model = boxedModel.unbox();
        const resized = resize(frame, {
          crop: {
            x: frameWidth * rect.x,
            y: frameHeight * rect.y,
            width: frameWidth * rect.width,
            height: frameHeight * rect.height,
          },
          scale: { width: IMG_SIZE, height: IMG_SIZE },
          pixelFormat: "rgb",
          dataType: "uint8",
          mirror: true,
        });
        const rgb = new Uint8Array(
          resized.buffer.slice(resized.byteOffset, resized.byteOffset + resized.byteLength),
        );
        const outputs = model.runSync([buildTfliteInputBufferWorklet(rgb)]);
        const parsed = parseTfliteOutputWorklet(outputs);
        reportPrediction(parsed.index, parsed.score);
      });
    },
    [
      boxedModel,
      cropRect,
      detectHands,
      handScanTick,
      lastHandUiMs,
      reportHandScan,
      reportHands,
      reportPrediction,
      resize,
    ],
  );

  const handleAddLetter = useCallback(() => {
    if (predictedLetter) {
      appendToWord(predictedLetter);
    }
  }, [appendToWord, predictedLetter]);

  const handleSpace = useCallback(() => {
    appendToWord(" ");
  }, [appendToWord]);

  const handleSpeak = useCallback(() => {
    const text = word.trim();
    if (!text) {
      return;
    }
    Speech.stop();
    Speech.speak(text, { language: "en-US" });
  }, [word]);

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.primaryText}>Camera permission is required.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.primaryText}>No front camera found on this device.</Text>
      </View>
    );
  }

  const handTrackingNote =
    Platform.OS !== "android"
      ? "Hand tracking is Android-only"
      : detectHands == null
        ? "Rebuild app: npx expo prebuild --clean && npm run android:dev"
        : "Hand frame follows your hand";

  // Sensor-space → preview: see DISPLAY_ROTATION_DEG / MIRROR_OVERLAY in handBounds.ts
  const displayTrackRect =
    trackRect != null ? transformRectForDisplay(trackRect) : null;
  const displayLandmarks =
    handLandmarks != null ? transformHandLandmarksForDisplay(handLandmarks) : null;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={tflite.state === "loaded"}
        frameProcessor={frameProcessor}
        pixelFormat="rgb"
      />
      <RecognitionFrameOverlay
        trackRect={displayTrackRect}
        landmarks={displayLandmarks}
        predictedLetter={predictedLetter}
        confidence={confidence}
        modelReady={tflite.state === "loaded"}
        handTrackError={handTrackError}
        handScans={handScans}
      />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Sign A-Z</Text>
        <Text style={styles.subtitle}>
          {tflite.state !== "loaded"
            ? "Loading model…"
            : `Classifier ~${fps} fps (target ${CLASSIFY_TARGET_FPS}) — ${handTrackingNote}`}
        </Text>
      </View>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <RecognitionPanel
          modelStatus={modelStatus}
          modelError={modelError}
          framesClassified={framesClassified}
          fps={fps}
          handScans={handScans}
          handDetected={displayTrackRect != null}
          predictedLetter={predictedLetter}
          word={word}
          onAddLetter={handleAddLetter}
          onSpace={handleSpace}
          onClear={clearWord}
          onSpeak={handleSpeak}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryText: { color: colors.textPrimary, fontSize: 16, textAlign: "center" },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: { color: colors.textPrimary, fontWeight: "600" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(34,34,34,0.6)",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  subtitle: { marginTop: 4, color: colors.textMuted, fontSize: 14 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
