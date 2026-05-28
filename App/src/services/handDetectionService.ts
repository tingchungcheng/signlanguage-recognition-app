import { HandLandmarks } from "../types/landmarks";

export type HandDetectionService = {
  initialize: () => Promise<void>;
  detect: () => Promise<HandLandmarks | null>;
};

class MockHandDetectionService implements HandDetectionService {
  async initialize() {
    // Native-safe placeholder detector. Real frame piping comes in next step.
  }

  async detect() {
    const now = Date.now() / 800;
    const points = 21;

    const mock: HandLandmarks = Array.from({ length: points }).map((_, i) => {
      const angle = (i / points) * Math.PI * 2;
      return {
        x: 0.5 + Math.cos(angle + now) * 0.2,
        y: 0.5 + Math.sin(angle + now) * 0.25,
        z: 0,
      };
    });

    return mock;
  }
}

export const handDetectionService: HandDetectionService = new MockHandDetectionService();
