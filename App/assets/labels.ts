// Keep in sync with labels.txt (A–Z class order from training).
export const LABELS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
] as const;

export const IMG_SIZE = 96;

/** Fraction of camera frame — matches RecognitionFrameOverlay. */
export const GUIDE_CROP = {
  x: 0.14,
  y: 0.22,
  width: 0.72,
  height: 0.52,
} as const;
