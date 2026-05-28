import { HandLandmarks } from "../types/landmarks";
import type { CameraPhoto, HandDetectionService } from "./handDetectionTypes";

/**
 * Expo Go on iOS/Android: no MediaPipe (WASM does not bundle in Metro).
 * ASL classification uses the full camera frame.
 */
class NativeHandDetectionService implements HandDetectionService {
  supportsLiveLandmarks() {
    return false;
  }

  async initialize() {
    // No-op on native.
  }

  async detect(): Promise<HandLandmarks | null> {
    return null;
  }

  async detectFromPhoto(_photo: CameraPhoto): Promise<HandLandmarks | null> {
    return null;
  }
}

export const handDetectionService: HandDetectionService = new NativeHandDetectionService();
