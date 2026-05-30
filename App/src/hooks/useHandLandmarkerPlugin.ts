import type { HandDetectionResult } from "expo-vision-camera-v4-mediapipe";
import { useMemo } from "react";
import { Frame, VisionCameraProxy } from "react-native-vision-camera";

export type DetectHandsWorklet = (frame: Frame) => HandDetectionResult;

/**
 * MediaPipe hand landmarker (Android). Native plugin name: "handLandmarker".
 * Rebuild after install: npx expo prebuild --clean && npm run android:dev
 */
export function useHandLandmarkerPlugin(): DetectHandsWorklet | null {
  return useMemo(() => {
    const plugin = VisionCameraProxy.initFrameProcessorPlugin("handLandmarker", {});
    if (plugin == null) {
      return null;
    }

    return (frame: Frame): HandDetectionResult => {
      "worklet";
      return plugin.call(frame) as HandDetectionResult;
    };
  }, []);
}
