import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { HandLandmarks } from "../types/landmarks";
import type { CameraPhoto } from "./handDetectionTypes";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export class MediaPipeHandDetectionService {
  private landmarker: HandLandmarker | null = null;
  private initError: string | null = null;

  supportsLiveLandmarks() {
    return true;
  }

  async initialize() {
    if (this.landmarker || this.initError) {
      return;
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_MODEL,
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numHands: 1,
        minHandDetectionConfidence: 0.35,
        minHandPresenceConfidence: 0.35,
        minTrackingConfidence: 0.35,
      });
    } catch (error) {
      this.initError =
        error instanceof Error ? error.message : "MediaPipe hand landmarker failed to load.";
    }
  }

  async detect() {
    return null;
  }

  async detectFromPhoto(photo: CameraPhoto): Promise<HandLandmarks | null> {
    if (!this.landmarker) {
      await this.initialize();
    }
    if (!this.landmarker) {
      return null;
    }

    const image = await loadWebImage(photo.uri);
    const result = this.landmarker.detect(image);
    const hand = result.landmarks[0];
    if (!hand?.length) {
      return null;
    }

    return hand.map((point) => ({
      x: point.x,
      y: point.y,
      z: point.z ?? 0,
    }));
  }

  getInitError() {
    return this.initError;
  }
}

function loadWebImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load camera frame for hand detection."));
    image.src = uri;
  });
}
