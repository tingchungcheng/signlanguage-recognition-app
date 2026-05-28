#!/usr/bin/env python3
"""
Export Keras baseline to TensorFlow.js format for Expo Go.

In WSL, use the dedicated export env (GPU venv has protobuf/tfjs conflicts):
  bash ML/export_tfjs_wsl.sh
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Any

import tensorflow as tf
import tensorflowjs as tfjs

IMG_SIZE = 96

SKIP_LAYER_TYPES = (
    tf.keras.layers.InputLayer,
    tf.keras.layers.Rescaling,
)


def build_tfjs_compatible_model(source: tf.keras.Model) -> tf.keras.Model:
    """Conv2D-first stack; app scales pixels to [0, 1] (no Rescaling layer)."""
    num_classes = int(source.layers[-1].units)

    export_model = tf.keras.Sequential(
        [
            tf.keras.layers.Conv2D(32, 3, activation="relu", input_shape=(IMG_SIZE, IMG_SIZE, 3)),
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

    weights: list[Any] = []
    for layer in source.layers:
        if isinstance(layer, SKIP_LAYER_TYPES):
            continue
        if layer.weights:
            weights.extend(layer.get_weights())

    export_model.set_weights(weights)
    return export_model


def _dense(name: str, units: int, activation: str) -> dict[str, Any]:
    return {
        "class_name": "Dense",
        "config": {
            "name": name,
            "trainable": True,
            "dtype": "float32",
            "units": units,
            "activation": activation,
            "use_bias": True,
            "kernel_initializer": {"class_name": "GlorotUniform", "config": {"seed": None}},
            "bias_initializer": {"class_name": "Zeros", "config": {}},
            "kernel_regularizer": None,
            "bias_regularizer": None,
            "activity_regularizer": None,
            "kernel_constraint": None,
            "bias_constraint": None,
        },
    }


def build_keras2_topology(num_classes: int) -> dict[str, Any]:
    """Hand-authored Keras 2 topology that TensorFlow.js can deserialize."""
    return {
        "keras_version": "2.15.0",
        "backend": "tensorflow",
        "model_config": {
            "class_name": "Sequential",
            "config": {
                "name": "sequential",
                "layers": [
                    {
                        "class_name": "Conv2D",
                        "config": {
                            "name": "conv2d",
                            "trainable": True,
                            "batch_input_shape": [None, IMG_SIZE, IMG_SIZE, 3],
                            "dtype": "float32",
                            "filters": 32,
                            "kernel_size": [3, 3],
                            "strides": [1, 1],
                            "padding": "valid",
                            "data_format": "channels_last",
                            "activation": "relu",
                            "use_bias": True,
                            "kernel_initializer": {
                                "class_name": "GlorotUniform",
                                "config": {"seed": None},
                            },
                            "bias_initializer": {"class_name": "Zeros", "config": {}},
                            "kernel_regularizer": None,
                            "bias_regularizer": None,
                            "activity_regularizer": None,
                            "kernel_constraint": None,
                            "bias_constraint": None,
                        },
                    },
                    {
                        "class_name": "MaxPooling2D",
                        "config": {
                            "name": "max_pooling2d",
                            "trainable": True,
                            "dtype": "float32",
                            "pool_size": [2, 2],
                            "padding": "valid",
                            "strides": [2, 2],
                            "data_format": "channels_last",
                        },
                    },
                    {
                        "class_name": "Conv2D",
                        "config": {
                            "name": "conv2d_1",
                            "trainable": True,
                            "dtype": "float32",
                            "filters": 64,
                            "kernel_size": [3, 3],
                            "strides": [1, 1],
                            "padding": "valid",
                            "data_format": "channels_last",
                            "activation": "relu",
                            "use_bias": True,
                            "kernel_initializer": {
                                "class_name": "GlorotUniform",
                                "config": {"seed": None},
                            },
                            "bias_initializer": {"class_name": "Zeros", "config": {}},
                            "kernel_regularizer": None,
                            "bias_regularizer": None,
                            "activity_regularizer": None,
                            "kernel_constraint": None,
                            "bias_constraint": None,
                        },
                    },
                    {
                        "class_name": "MaxPooling2D",
                        "config": {
                            "name": "max_pooling2d_1",
                            "trainable": True,
                            "dtype": "float32",
                            "pool_size": [2, 2],
                            "padding": "valid",
                            "strides": [2, 2],
                            "data_format": "channels_last",
                        },
                    },
                    {
                        "class_name": "Conv2D",
                        "config": {
                            "name": "conv2d_2",
                            "trainable": True,
                            "dtype": "float32",
                            "filters": 128,
                            "kernel_size": [3, 3],
                            "strides": [1, 1],
                            "padding": "valid",
                            "data_format": "channels_last",
                            "activation": "relu",
                            "use_bias": True,
                            "kernel_initializer": {
                                "class_name": "GlorotUniform",
                                "config": {"seed": None},
                            },
                            "bias_initializer": {"class_name": "Zeros", "config": {}},
                            "kernel_regularizer": None,
                            "bias_regularizer": None,
                            "activity_regularizer": None,
                            "kernel_constraint": None,
                            "bias_constraint": None,
                        },
                    },
                    {
                        "class_name": "MaxPooling2D",
                        "config": {
                            "name": "max_pooling2d_2",
                            "trainable": True,
                            "dtype": "float32",
                            "pool_size": [2, 2],
                            "padding": "valid",
                            "strides": [2, 2],
                            "data_format": "channels_last",
                        },
                    },
                    {
                        "class_name": "Flatten",
                        "config": {
                            "name": "flatten",
                            "trainable": True,
                            "dtype": "float32",
                            "data_format": "channels_last",
                        },
                    },
                    {
                        "class_name": "Dropout",
                        "config": {
                            "name": "dropout",
                            "trainable": True,
                            "dtype": "float32",
                            "rate": 0.3,
                            "noise_shape": None,
                            "seed": None,
                        },
                    },
                    _dense("dense", 128, "relu"),
                    _dense("dense_1", num_classes, "softmax"),
                ],
            },
        },
    }


def write_tfjs_model(export_model: tf.keras.Model, output_dir: Path) -> None:
    """Write Keras-2-compatible model.json and weight shards."""
    output_dir.mkdir(parents=True, exist_ok=True)

    num_classes = int(export_model.layers[-1].units)
    topology = build_keras2_topology(num_classes)

    # Write weight shards on Linux fs (avoids /mnt/c permission issues), keep manifest order.
    tmp_dir = Path("/tmp/asl_tfjs_export")
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tfjs.converters.save_keras_model(export_model, str(tmp_dir))

    tmp_manifest = json.loads((tmp_dir / "model.json").read_text(encoding="utf-8"))[
        "weightsManifest"
    ]
    # TF.js expects layer paths like "conv2d/kernel", not "sequential/conv2d/kernel".
    for group in tmp_manifest:
        for weight in group.get("weights", []):
            name = weight.get("name", "")
            if name.startswith("sequential/"):
                weight["name"] = name.removeprefix("sequential/")

    for shard in tmp_dir.glob("*.bin"):
        (output_dir / shard.name).write_bytes(shard.read_bytes())

    shutil.rmtree(tmp_dir)

    model_json = {
        "format": "layers-model",
        "generatedBy": "ML/export_tfjs.py (keras2 topology)",
        "convertedBy": "TensorFlow.js Converter",
        "modelTopology": topology,
        "weightsManifest": tmp_manifest,
    }
    (output_dir / "model.json").write_text(json.dumps(model_json), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Export ASL model to TensorFlow.js.")
    parser.add_argument(
        "--keras-path",
        type=Path,
        default=Path("ML/artifacts/asl_baseline.keras"),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("App/assets/asl_baseline_tfjs"),
    )
    args = parser.parse_args()

    if not args.keras_path.exists():
        raise FileNotFoundError(f"Keras model not found: {args.keras_path}")

    if args.output_dir.exists():
        shutil.rmtree(args.output_dir)

    source = tf.keras.models.load_model(args.keras_path)
    export_model = build_tfjs_compatible_model(source)
    write_tfjs_model(export_model, args.output_dir)

    print(f"Exported TF.js model to {args.output_dir}")


if __name__ == "__main__":
    main()
