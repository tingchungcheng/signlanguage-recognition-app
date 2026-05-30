import { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  loadTensorflowModel,
  type ModelSource,
  type TensorflowModelDelegate,
  type TensorflowPlugin,
} from "react-native-fast-tflite";

const DELEGATE_TRY_ORDER: TensorflowModelDelegate[][] =
  Platform.OS === "ios"
    ? [["core-ml"], []]
    : Platform.OS === "android"
      ? [[], ["nnapi"], ["android-gpu"]]
      : [[]];

/**
 * Load a .tflite model, trying accelerated delegates first and falling back to CPU.
 * GPU/CoreML delegates often fail interpreter creation for arbitrary Keras exports.
 */
export function useTfliteModelWithFallback(source: ModelSource): TensorflowPlugin {
  const [state, setState] = useState<TensorflowPlugin>({
    model: undefined,
    state: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setState({ model: undefined, state: "loading" });
      let lastError: Error | undefined;

      for (const delegates of DELEGATE_TRY_ORDER) {
        try {
          const model = await loadTensorflowModel(source, delegates);
          if (cancelled) {
            return;
          }
          const label =
            delegates.length === 0
              ? "CPU"
              : delegates.join(", ");
          console.log(`TFLite model loaded (${label} delegate)`);
          setState({ model, state: "loaded" });
          return;
        } catch (e) {
          lastError = e as Error;
          console.warn(
            `TFLite load failed with delegates [${delegates.join(", ") || "default"}]:`,
            lastError.message,
          );
        }
      }

      if (!cancelled) {
        console.error(`Failed to load Tensorflow Model ${source}!`, lastError);
        setState({
          model: undefined,
          state: "error",
          error: lastError ?? new Error("Failed to load TFLite model."),
        });
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [source]);

  return state;
}
