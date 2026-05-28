import { FlipType, manipulateAsync, SaveFormat } from "expo-image-manipulator";
import jpeg from "jpeg-js";
import { HandLandmarks } from "../types/landmarks";
import { IMG_SIZE } from "../../assets/labels";

export type ImageCrop = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export function cropFromLandmarks(
  landmarks: HandLandmarks,
  imageWidth: number,
  imageHeight: number,
): ImageCrop | undefined {
  const xs = landmarks.map((p) => p.x * imageWidth);
  const ys = landmarks.map((p) => p.y * imageHeight);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 0.2;
  const side = Math.max(maxX - minX, maxY - minY) * (1 + pad);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const originX = Math.max(0, Math.round(cx - side / 2));
  const originY = Math.max(0, Math.round(cy - side / 2));
  const width = Math.min(imageWidth - originX, Math.round(side));
  const height = Math.min(imageHeight - originY, Math.round(side));

  if (width < 8 || height < 8) {
    return undefined;
  }

  return { originX, originY, width, height };
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function jpegBase64ToModelInput(base64: string): Promise<ArrayBuffer> {
  const decoded = jpeg.decode(base64ToUint8Array(base64), { useTArray: true });
  const { width, height, data } = decoded;

  if (width !== IMG_SIZE || height !== IMG_SIZE) {
    throw new Error(`Expected ${IMG_SIZE}x${IMG_SIZE} image, got ${width}x${height}.`);
  }

  const floats = new Float32Array(IMG_SIZE * IMG_SIZE * 3);
  for (let i = 0; i < IMG_SIZE * IMG_SIZE; i += 1) {
    floats[i * 3] = data[i * 4] / 255;
    floats[i * 3 + 1] = data[i * 4 + 1] / 255;
    floats[i * 3 + 2] = data[i * 4 + 2] / 255;
  }

  return floats.buffer;
}

function buildPreprocessActions(crop?: ImageCrop, mirrorFrontCamera = false) {
  const actions: Parameters<typeof manipulateAsync>[1] = [];
  if (mirrorFrontCamera) {
    actions.push({ flip: FlipType.Horizontal });
  }
  if (crop) {
    actions.push({ crop });
  }
  actions.push({ resize: { width: IMG_SIZE, height: IMG_SIZE } });
  return actions;
}

/** RGB float32 [0, 1] buffer for model input (NHWC 1×96×96×3). */
export async function imageBase64ToModelInput(
  base64: string,
  crop?: ImageCrop,
  mirrorFrontCamera = false,
): Promise<ArrayBuffer> {
  const actions = buildPreprocessActions(crop, mirrorFrontCamera);

  const result = await manipulateAsync(`data:image/jpeg;base64,${base64}`, actions, {
    compress: 1,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error("Failed to preprocess camera frame.");
  }

  return jpegBase64ToModelInput(result.base64);
}

/** RGB float32 [0, 1] buffer for model input (NHWC 1×96×96×3). */
export async function imageUriToModelInput(
  uri: string,
  crop?: ImageCrop,
  mirrorFrontCamera = false,
): Promise<ArrayBuffer> {
  const actions = buildPreprocessActions(crop, mirrorFrontCamera);

  const result = await manipulateAsync(uri, actions, {
    compress: 1,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error("Failed to read camera frame as base64.");
  }

  return jpegBase64ToModelInput(result.base64);
}
