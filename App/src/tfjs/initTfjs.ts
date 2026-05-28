import "@tensorflow/tfjs-react-native";
import * as tf from "@tensorflow/tfjs";
import { bundleResourceIO } from "@tensorflow/tfjs-react-native";

let initialized = false;

export async function initTfjs(): Promise<void> {
  if (initialized) {
    return;
  }

  await tf.ready();
  // CPU backend works in Expo Go without extra native TFLite/Nitro modules.
  await tf.setBackend("cpu");
  await tf.ready();

  initialized = true;
}

export { bundleResourceIO, tf };
