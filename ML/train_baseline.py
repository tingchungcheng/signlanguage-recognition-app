#!/usr/bin/env python3
"""
Train a baseline image classifier for ASL classes using TensorFlow/Keras.

Usage:
  python ML/train_baseline.py
"""

from __future__ import annotations

import argparse
from pathlib import Path

import tensorflow as tf


def main() -> None:
    parser = argparse.ArgumentParser(description="Train ASL baseline model.")
    parser.add_argument("--data-root", type=Path, default=Path("dataset/processed"))
    parser.add_argument("--img-size", type=int, default=96)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--output-dir", type=Path, default=Path("ML/artifacts"))
    args = parser.parse_args()

    train_dir = args.data_root / "train"
    val_dir = args.data_root / "val"
    if not train_dir.exists() or not val_dir.exists():
        raise FileNotFoundError(
            "Processed dataset not found. Run: python ML/prepare_dataset.py --overwrite"
        )

    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        labels="inferred",
        label_mode="categorical",
        image_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
        shuffle=True,
        seed=42,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        val_dir,
        labels="inferred",
        label_mode="categorical",
        image_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
        shuffle=False,
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)

    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(autotune)
    val_ds = val_ds.prefetch(autotune)

    # input_shape on the first layer (no separate InputLayer) exports cleanly to TF.js.
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Rescaling(1.0 / 255, input_shape=(args.img_size, args.img_size, 3)),
            tf.keras.layers.Conv2D(32, 3, activation="relu"),
            tf.keras.layers.MaxPooling2D(),
            tf.keras.layers.Conv2D(64, 3, activation="relu"),
            tf.keras.layers.MaxPooling2D(),
            tf.keras.layers.Conv2D(128, 3, activation="relu"),
            tf.keras.layers.MaxPooling2D(),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dense(num_classes, activation="softmax"),
        ]
    )

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.fit(train_ds, validation_data=val_ds, epochs=args.epochs)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    keras_out = args.output_dir / "asl_baseline.keras"
    labels_out = args.output_dir / "labels.txt"
    tflite_out = args.output_dir / "asl_baseline.tflite"

    model.save(keras_out)
    labels_out.write_text("\n".join(class_names), encoding="utf-8")

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_bytes = converter.convert()
    tflite_out.write_bytes(tflite_bytes)
    # App inference: float32 input tensor, RGB values 0–255 (see App/src/utils/buildTfliteInput.ts).

    print("\nSaved artifacts:")
    print(f"- Keras model: {keras_out}")
    print(f"- TFLite model: {tflite_out}")
    print(f"- Labels: {labels_out}")


if __name__ == "__main__":
    main()
