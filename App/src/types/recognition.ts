export type Prediction = {
  label: string;
  confidence: number;
  confident: boolean;
};

export type ModelStatus = "loading" | "ready" | "unavailable" | "error";
