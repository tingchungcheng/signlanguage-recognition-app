import { HandLandmarks } from "../types/landmarks";
import { ModelStatus, Prediction } from "../types/recognition";
import { initTfjs, tf } from "../tfjs/initTfjs";
import { loadBundledLayersModel } from "../tfjs/loadModel";
import { LABELS } from "../../assets/labels";
import { cropFromLandmarks, imageUriToModelInput } from "../utils/imageToModelInput";
import type { LayersModel } from "@tensorflow/tfjs";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MODEL_JSON = require("../../assets/asl_baseline_tfjs/model.json");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WEIGHT_BIN_1 = require("../../assets/asl_baseline_tfjs/group1-shard1of2.bin");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WEIGHT_BIN_2 = require("../../assets/asl_baseline_tfjs/group1-shard2of2.bin");

const CONFIDENCE_THRESHOLD = 0.45;

export type ClassificationService = {
  initialize: () => Promise<ModelStatus>;
  classifyFrame: (
    imageUri: string,
    imageWidth: number,
    imageHeight: number,
    landmarks: HandLandmarks | null,
    imageBase64?: string | null,
    mirrorFrontCamera?: boolean,
    useGuideCrop?: boolean,
  ) => Promise<Prediction | null>;
  getStatus: () => ModelStatus;
  getErrorMessage: () => string | null;
};

class WebTfjsClassificationService implements ClassificationService {
  private model: LayersModel | null = null;
  private status: ModelStatus = "loading";
  private errorMessage: string | null = null;

  async initialize(): Promise<ModelStatus> {
    if (this.model) {
      return this.status;
    }

    try {
      await initTfjs();
      const modelJson = MODEL_JSON as {
        format: string;
        modelTopology: object;
        weightsManifest: Array<{
          paths: string[];
          weights: Array<{ name: string; shape: number[]; dtype: string }>;
        }>;
      };
      const bins = await Promise.all(
        [WEIGHT_BIN_1, WEIGHT_BIN_2].map(async (url: string) => {
          const response = await fetch(url);
          return response.arrayBuffer();
        }),
      );
      this.model = await loadBundledLayersModel(modelJson, bins);
      this.status = "ready";
      this.errorMessage = null;
    } catch (error) {
      this.status = "error";
      this.errorMessage =
        error instanceof Error ? error.message : "Failed to load ASL model on web.";
    }

    return this.status;
  }

  getStatus() {
    return this.status;
  }

  getErrorMessage() {
    return this.errorMessage;
  }

  async classifyFrame(
    imageUri: string,
    imageWidth: number,
    imageHeight: number,
    landmarks: HandLandmarks | null,
    _imageBase64?: string | null,
    mirrorFrontCamera = true,
    useGuideCrop = false,
  ): Promise<Prediction | null> {
    if (this.status !== "ready" || !this.model) {
      return null;
    }

    const crop =
      landmarks != null
        ? cropFromLandmarks(landmarks, imageWidth, imageHeight)
        : useGuideCrop
          ? getGuideCrop(imageWidth, imageHeight)
          : undefined;
    const inputBuffer = await imageUriToModelInput(imageUri, crop, mirrorFrontCamera);
    const inputData = new Float32Array(inputBuffer);
    const input = tf.tensor4d(inputData, [1, 96, 96, 3]);
    const output = this.model.predict(input) as tf.Tensor;
    const probabilities = output.dataSync();
    tf.dispose([input, output]);

    let bestIndex = 0;
    let bestScore = probabilities[0] ?? 0;
    for (let i = 1; i < probabilities.length; i += 1) {
      const score = probabilities[i] ?? 0;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    return {
      label: LABELS[bestIndex] ?? "?",
      confidence: bestScore,
      confident: bestScore >= CONFIDENCE_THRESHOLD,
    };
  }
}

export const classificationService: ClassificationService = new WebTfjsClassificationService();
