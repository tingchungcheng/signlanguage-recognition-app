import * as Speech from "expo-speech";
import React, { useCallback, useMemo, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTensorflowModel } from "react-native-fast-tflite";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  runAtTargetFps,
  runOnJS,
} from "react-native-vision-camera";
import { useResizePlugin } from "vision-camera-resize-plugin";
import { FrameGuideOverlay } from "../components/FrameGuideOverlay";
import { RecognitionPanel } from "../components/RecognitionPanel";
import { IMG_SIZE } from "../../assets/labels";
import { useAppState } from "../state/AppStateContext";
import { colors } from "../theme/colors";
import { indexToPrediction, parseTfliteOutputWorklet } from "../utils/parseTfliteOutput";
import { PredictionSmoother } from "../utils/predictionSmoother";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const TFLITE_MODEL = require("../../assets/asl_baseline.tflite");

export function RealtimeHandTrackingScreen() {
  const insets = useSafeAreaInsets();
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const { resize } = useResizePlugin();
  const delegates = useMemo(
    () =>
      Platform.OS === "ios"
        ? (["core-ml"] as const)
        : Platform.OS === "android"
          ? (["android-gpu"] as const)
          : ([] as const),
    [],
  );
  const tflite = useTensorflowModel(TFLITE_MODEL, [...delegates]);
  const smootherRef = useRef(new PredictionSmoother());
  const [fps, setFps] = React.useState(0);
  const [classifyHint, setClassifyHint] = React.useState<string | null>(null);
  const [framesClassified, setFramesClassified] = React.useState(0);
  const frameTimesRef = useRef<number[]>([]);

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
  }, [setModelError, setModelStatus, tflite.error, tflite.state]);

  const onPrediction = useCallback(
    (label: string, rawConfidence: number) => {
      const smoothed = smootherRef.current.push({
        label,
        confidence: rawConfidence,
        confident: rawConfidence >= 0.12,
      });
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

      setClassifyHint(
        smoothed.confident
          ? null
          : `Tracking… ${Math.round(smoothed.confidence * 100)}%`,
      );
    },
    [setConfidence, setPredictedLetter],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const model = tflite.model;
      if (model == null) {
        return;
      }

      runAtTargetFps(15, () => {
        "worklet";
        const input = resize(frame, {
          scale: { width: IMG_SIZE, height: IMG_SIZE },
          pixelFormat: "rgb",
          dataType: "float32",
          mirror: true,
        });
        const outputs = model.runSync([input.buffer]);
        const parsed = parseTfliteOutputWorklet(outputs);
        runOnJS(onPrediction)(parsed.index, parsed.score);
      });
    },
    [onPrediction, resize, tflite],
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

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={tflite.state === "loaded"}
        frameProcessor={frameProcessor}
        pixelFormat="rgb"
      />
      <FrameGuideOverlay />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Sign A-Z (realtime)</Text>
        <Text style={styles.subtitle}>
          {tflite.state !== "loaded"
            ? "Loading native model…"
            : classifyHint ?? `Live ~${fps} fps — hold one letter in the box`}
        </Text>
      </View>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <RecognitionPanel
          modelStatus={modelStatus}
          modelError={modelError}
          classifyHint={classifyHint}
          framesClassified={framesClassified}
          fps={fps}
          predictedLetter={predictedLetter}
          confidence={confidence}
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
