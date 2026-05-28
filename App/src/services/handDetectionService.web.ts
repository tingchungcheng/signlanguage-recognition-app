import { MediaPipeHandDetectionService } from "./handDetectionMediaPipe.web";
import type { HandDetectionService } from "./handDetectionTypes";

export const handDetectionService: HandDetectionService = new MediaPipeHandDetectionService();
