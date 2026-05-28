import type { ImageCrop } from "./imageToModelInput";

/** Matches FrameGuideOverlay (percent of frame). */
const GUIDE = {
  x: 0.14,
  y: 0.22,
  w: 0.72,
  h: 0.52,
} as const;

export function getGuideCrop(imageWidth: number, imageHeight: number): ImageCrop {
  const originX = Math.round(imageWidth * GUIDE.x);
  const originY = Math.round(imageHeight * GUIDE.y);
  const width = Math.round(imageWidth * GUIDE.w);
  const height = Math.round(imageHeight * GUIDE.h);
  return { originX, originY, width, height };
}
