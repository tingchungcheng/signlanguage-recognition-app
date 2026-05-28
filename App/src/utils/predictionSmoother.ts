import { Prediction } from "../types/recognition";

const HISTORY_SIZE = 4;

export class PredictionSmoother {
  private history: Prediction[] = [];

  reset() {
    this.history = [];
  }

  push(prediction: Prediction): Prediction {
    this.history.push(prediction);
    if (this.history.length > HISTORY_SIZE) {
      this.history.shift();
    }

    const scores = new Map<string, { votes: number; confidenceSum: number }>();
    for (const entry of this.history) {
      const current = scores.get(entry.label) ?? { votes: 0, confidenceSum: 0 };
      scores.set(entry.label, {
        votes: current.votes + 1,
        confidenceSum: current.confidenceSum + entry.confidence,
      });
    }

    let bestLabel = prediction.label;
    let bestVotes = 0;
    let bestAvg = 0;
    for (const [label, { votes, confidenceSum }] of scores) {
      const avg = confidenceSum / votes;
      if (votes > bestVotes || (votes === bestVotes && avg > bestAvg)) {
        bestLabel = label;
        bestVotes = votes;
        bestAvg = avg;
      }
    }

    return {
      label: bestLabel,
      confidence: bestAvg,
      confident: bestAvg >= 0.12 && bestVotes >= 2,
    };
  }
}
