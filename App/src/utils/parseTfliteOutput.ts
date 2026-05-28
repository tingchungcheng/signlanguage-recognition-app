import { LABELS } from "../../assets/labels";
import { Prediction } from "../types/recognition";

/** Worklet-safe: returns class index + score only. */
export function parseTfliteOutputWorklet(outputs: ArrayBuffer[]): { index: number; score: number } {
  "worklet";
  const buffer = outputs[0];
  if (!buffer) {
    return { index: 0, score: 0 };
  }

  const probabilities = new Float32Array(buffer);
  let bestIndex = 0;
  let bestScore = probabilities[0] ?? 0;

  for (let i = 1; i < probabilities.length; i += 1) {
    const score = probabilities[i] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return { index: bestIndex, score: bestScore };
}

export function indexToPrediction(index: number, score: number): Prediction {
  const label = LABELS[index] ?? "?";
  return {
    label,
    confidence: score,
    confident: score >= 0.12,
  };
}
