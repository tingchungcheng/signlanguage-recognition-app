import { CameraView } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { classificationService } from "../services/classificationService";
import { handDetectionService } from "../services/handDetectionService";
import { PredictionSmoother } from "../utils/predictionSmoother";
import { Prediction } from "../types/recognition";
import { HandLandmarks } from "../types/landmarks";

const WEB_FRAME_MS = 350;
const NATIVE_MIN_GAP_MS = 40;

type Options = {
  cameraRef: React.RefObject<CameraView | null>;
  cameraReady: boolean;
  modelStatus: string;
  liveLandmarks: boolean;
  onLandmarks: (landmarks: HandLandmarks | null) => void;
  onPrediction: (prediction: Prediction | null) => void;
  onHint: (hint: string | null) => void;
  onFrameProcessed: () => void;
};

export function useRealtimeRecognition({
  cameraRef,
  cameraReady,
  modelStatus,
  liveLandmarks,
  onLandmarks,
  onPrediction,
  onHint,
  onFrameProcessed,
}: Options) {
  const [fps, setFps] = useState(0);
  const runningRef = useRef(false);
  const smootherRef = useRef(new PredictionSmoother());
  const frameTimesRef = useRef<number[]>([]);

  const recordFps = useCallback(() => {
    const now = Date.now();
    const times = frameTimesRef.current;
    times.push(now);
    while (times.length > 0 && now - times[0]! > 1000) {
      times.shift();
    }
    setFps(times.length);
  }, []);

  const processFrame = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera || modelStatus !== "ready") {
      return;
    }

    const photo = await camera.takePictureAsync({
      quality: 0.15,
      skipProcessing: true,
      shutterSound: false,
    });

    const imageUri = photo?.uri;
    const imageWidth = photo?.width ?? 640;
    const imageHeight = photo?.height ?? 480;

    if (!imageUri) {
      onHint("Camera frame unavailable");
      return;
    }

    const detected = liveLandmarks
      ? await handDetectionService.detectFromPhoto({
          uri: imageUri,
          width: imageWidth,
          height: imageHeight,
        })
      : null;

    onLandmarks(detected);

    const raw = await classificationService.classifyFrame(
      imageUri,
      imageWidth,
      imageHeight,
      detected,
      null,
      true,
      !liveLandmarks,
    );

    if (!raw) {
      onPrediction(null);
      onHint("Model not ready");
      return;
    }

    const smoothed = smootherRef.current.push(raw);
    onPrediction(smoothed);
    onFrameProcessed();
    recordFps();

    if (!detected && liveLandmarks) {
      onHint("No hand detected — show your palm");
    } else if (!smoothed.confident) {
      onHint(`Tracking… ${Math.round(smoothed.confidence * 100)}%`);
    } else {
      onHint(null);
    }
  }, [
    cameraRef,
    liveLandmarks,
    modelStatus,
    onFrameProcessed,
    onHint,
    onLandmarks,
    onPrediction,
    recordFps,
  ]);

  useEffect(() => {
    if (!cameraReady || modelStatus !== "ready") {
      return;
    }

    let cancelled = false;
    smootherRef.current.reset();

    const loop = async () => {
      while (!cancelled) {
        if (!runningRef.current) {
          runningRef.current = true;
          try {
            await processFrame();
          } catch {
            onHint("Frame processing failed");
          } finally {
            runningRef.current = false;
          }
        }

        const gap = Platform.OS === "web" ? WEB_FRAME_MS : NATIVE_MIN_GAP_MS;

        await new Promise((resolve) => setTimeout(resolve, gap));
      }
    };

    void loop();

    return () => {
      cancelled = true;
    };
  }, [cameraReady, modelStatus, processFrame, onHint]);

  return { fps };
}
