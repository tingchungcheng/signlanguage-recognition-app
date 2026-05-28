import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { HandLandmarks } from "../types/landmarks";

export type HandDetectionService = {
  initialize: () => Promise<void>;
  detect: () => Promise<HandLandmarks | null>;
};

class WebHandDetectionService implements HandDetectionService {
  private handLandmarker: HandLandmarker | null = null;

  async initialize() {
    if (this.handLandmarker) {
      return;
    }

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      },
      numHands: 1,
      runningMode: "VIDEO",
    });
  }

  async detect() {
    // Camera frame binding is not wired yet; return null until next step.
    return null;
  }
}

export const handDetectionService: HandDetectionService = new WebHandDetectionService();
