/**
 * TFLite model expects float32 RGB in 0–255 (Keras Rescaling(1/255) is inside the graph).
 * Resize plugin uint8 is 0–255; float32 from the plugin is 0–1 only.
 */
export function buildTfliteInputBufferWorklet(rgb: Uint8Array): ArrayBuffer {
  "worklet";
  const input = new Float32Array(rgb.length);
  for (let i = 0; i < rgb.length; i++) {
    input[i] = rgb[i]!;
  }
  return input.buffer;
}
