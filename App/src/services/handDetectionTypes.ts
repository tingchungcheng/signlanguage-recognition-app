import { HandLandmarks } from "../types/landmarks";

export type CameraPhoto = {
  uri: string;
  width: number;
  height: number;
  base64?: string | null;
};

export type HandDetectionService = {
  initialize: () => Promise<void>;
  detect: () => Promise<HandLandmarks | null>;
  detectFromPhoto: (photo: CameraPhoto) => Promise<HandLandmarks | null>;
  supportsLiveLandmarks: () => boolean;
};
