import type { io } from "@tensorflow/tfjs";
import { tf } from "./initTfjs";

type ModelJson = {
  format: string;
  modelTopology: object;
  weightsManifest: Array<{
    paths: string[];
    weights: Array<{ name: string; shape: number[]; dtype: string }>;
  }>;
};

/** Load bundled layers-model; fixes Keras export weight path prefixes for TF.js. */
export async function loadBundledLayersModel(
  modelJson: ModelJson,
  weightBuffers: ArrayBuffer[],
) {
  const weightSpecs = modelJson.weightsManifest[0].weights.map((entry) => ({
    ...entry,
    name: entry.name.startsWith("sequential/")
      ? entry.name.slice("sequential/".length)
      : entry.name,
  }));

  let totalBytes = 0;
  for (const buffer of weightBuffers) {
    totalBytes += buffer.byteLength;
  }
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const buffer of weightBuffers) {
    const chunk = new Uint8Array(buffer);
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const artifacts: io.ModelArtifacts = {
    format: modelJson.format,
    modelTopology: modelJson.modelTopology,
    weightSpecs,
    weightData: merged.buffer,
  };

  return tf.loadLayersModel(tf.io.fromMemory(artifacts));
}
