import type { HandLandmark } from "expo-vision-camera-v4-mediapipe";
import { GUIDE_CROP } from "../../assets/labels";

/** Normalized screen region (0–1), same space as MediaPipe landmarks. */
export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** MediaPipe hand skeleton edges for overlay drawing. */
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

/** Overlay-only rotation (0 = none). Try 90 / -90 if camera feed is sideways vs portrait UI. */
export type DisplayRotationDeg = 0 | 90 | -90 | 180;

/** Change this to fix box/skeleton alignment (display only; classifier crop unchanged). */
export const DISPLAY_ROTATION_DEG: DisplayRotationDeg = -90;

export const MIRROR_OVERLAY_FOR_FRONT_CAMERA = true;

function rotateNormalizedPoint(
  x: number,
  y: number,
  deg: DisplayRotationDeg,
): { x: number; y: number } {
  switch (deg) {
    case 0:
      return { x, y };
    case -90:
      return { x: y, y: 1 - x };
    case 90:
      return { x: 1 - y, y: x };
    case 180:
      return { x: 1 - x, y: 1 - y };
  }
}

function rectCorners(rect: NormalizedRect): { x: number; y: number }[] {
  const { x, y, width, height } = rect;
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

function boundsFromPoints(
  points: readonly { x: number; y: number }[],
): NormalizedRect {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 0.01),
    height: Math.max(maxY - minY, 0.01),
  };
}

/** Map sensor-space landmarks to on-screen preview (mirror then rotate). */
export function transformHandLandmarksForDisplay(
  hand: readonly HandLandmark[],
  options: {
    mirror?: boolean;
    rotation?: DisplayRotationDeg;
  } = {},
): HandLandmark[] {
  const mirror = options.mirror ?? MIRROR_OVERLAY_FOR_FRONT_CAMERA;
  const rotation = options.rotation ?? DISPLAY_ROTATION_DEG;

  return hand.map((point) => {
    let x = point.x;
    let y = point.y;
    if (mirror) {
      x = 1 - x;
    }
    if (rotation !== 0) {
      const rotated = rotateNormalizedPoint(x, y, rotation);
      x = rotated.x;
      y = rotated.y;
    }
    return { ...point, x, y };
  });
}

/** Map sensor-space crop rect to on-screen preview (mirror then rotate). */
export function transformRectForDisplay(
  rect: NormalizedRect,
  options: {
    mirror?: boolean;
    rotation?: DisplayRotationDeg;
  } = {},
): NormalizedRect {
  const mirror = options.mirror ?? MIRROR_OVERLAY_FOR_FRONT_CAMERA;
  const rotation = options.rotation ?? DISPLAY_ROTATION_DEG;

  let corners = rectCorners(rect);
  if (mirror) {
    corners = corners.map((p) => ({ x: 1 - p.x, y: p.y }));
  }
  if (rotation !== 0) {
    corners = corners.map((p) => rotateNormalizedPoint(p.x, p.y, rotation));
  }
  return boundsFromPoints(corners);
}

/** @deprecated Use transformHandLandmarksForDisplay */
export function mirrorHandLandmarks(
  hand: readonly HandLandmark[],
): HandLandmark[] {
  return transformHandLandmarksForDisplay(hand, { rotation: 0 });
}

/** @deprecated Use transformRectForDisplay */
export function mirrorNormalizedRect(rect: NormalizedRect): NormalizedRect {
  return transformRectForDisplay(rect, { rotation: 0 });
}

export function landmarksToBounds(
  hand: readonly HandLandmark[],
  paddingRatio = 0.22,
): NormalizedRect {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;

  for (const point of hand) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const spanX = Math.max(maxX - minX, 0.08);
  const spanY = Math.max(maxY - minY, 0.08);
  const padX = spanX * paddingRatio;
  const padY = spanY * paddingRatio;

  const x = Math.max(0, minX - padX);
  const y = Math.max(0, minY - padY);
  const width = Math.min(1 - x, spanX + padX * 2);
  const height = Math.min(1 - y, spanY + padY * 2);

  return { x, y, width, height };
}

/** Prefer the hand with the largest bounding box (usually closest to camera). */
export function pickPrimaryHand(
  hands: HandLandmark[][],
): HandLandmark[] | null {
  if (hands.length === 0) {
    return null;
  }
  if (hands.length === 1) {
    return hands[0] ?? null;
  }

  let best = hands[0]!;
  let bestArea = 0;
  for (const hand of hands) {
    const bounds = landmarksToBounds(hand, 0);
    const area = bounds.width * bounds.height;
    if (area > bestArea) {
      bestArea = area;
      best = hand;
    }
  }
  return best;
}

export function landmarksToBoundsWorklet(
  hand: readonly { x: number; y: number }[],
  paddingRatio: number,
): NormalizedRect {
  "worklet";
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;

  for (let i = 0; i < hand.length; i++) {
    const point = hand[i]!;
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const spanX = Math.max(maxX - minX, 0.08);
  const spanY = Math.max(maxY - minY, 0.08);
  const padX = spanX * paddingRatio;
  const padY = spanY * paddingRatio;

  const x = Math.max(0, minX - padX);
  const y = Math.max(0, minY - padY);
  const width = Math.min(1 - x, spanX + padX * 2);
  const height = Math.min(1 - y, spanY + padY * 2);

  return { x, y, width, height };
}

export const FALLBACK_CROP: NormalizedRect = GUIDE_CROP;

export function pickPrimaryHandWorklet(
  hands: readonly (readonly { x: number; y: number }[])[],
): readonly { x: number; y: number }[] | null {
  "worklet";
  if (hands.length === 0) {
    return null;
  }
  if (hands.length === 1) {
    return hands[0] ?? null;
  }

  let best = hands[0]!;
  let bestArea = 0;
  for (let i = 0; i < hands.length; i++) {
    const bounds = landmarksToBoundsWorklet(hands[i]!, 0);
    const area = bounds.width * bounds.height;
    if (area > bestArea) {
      bestArea = area;
      best = hands[i]!;
    }
  }
  return best;
}
