#!/usr/bin/env python3
"""
Prepare ASL dataset splits from the ayuraj/asl-dataset Kaggle download.

Usage:
  python ML/prepare_dataset.py --overwrite
  python ML/prepare_dataset.py --overwrite --include-digits
"""

from __future__ import annotations

import argparse
import random
import shutil
from pathlib import Path

ALPHABET_CLASSES = [chr(code) for code in range(ord("A"), ord("Z") + 1)]
DIGIT_CLASSES = [str(digit) for digit in range(10)]
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png"}


def resolve_class_dir(input_root: Path, class_name: str) -> Path | None:
    for candidate in (class_name, class_name.lower(), class_name.upper()):
        path = input_root / candidate
        if path.is_dir():
            return path
    return None


def output_class_name(class_name: str) -> str:
    if len(class_name) == 1 and class_name.isalpha():
        return class_name.upper()
    return class_name


def copy_file(src: Path, dst: Path) -> None:
    """Copy file contents only (no mode/time metadata; safe on WSL /mnt/c)."""
    shutil.copyfile(src, dst)


def copy_split(
    files: list[Path],
    train_count: int,
    out_train: Path,
    out_val: Path,
) -> None:
    out_train.mkdir(parents=True, exist_ok=True)
    out_val.mkdir(parents=True, exist_ok=True)

    train_files = files[:train_count]
    val_files = files[train_count:]

    for src in train_files:
        copy_file(src, out_train / src.name)
    for src in val_files:
        copy_file(src, out_val / src.name)


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare ASL train/val split.")
    parser.add_argument(
        "--input-root",
        type=Path,
        default=Path("dataset/asl_dataset"),
        help="Kaggle root containing class subfolders (default: ayuraj/asl-dataset).",
    )
    parser.add_argument(
        "--output-root",
        type=Path,
        default=Path("dataset/processed"),
        help="Output root for processed splits.",
    )
    parser.add_argument(
        "--include-digits",
        action="store_true",
        help="Include 0-9 digit classes in addition to A-Z.",
    )
    parser.add_argument(
        "--val-ratio",
        type=float,
        default=0.2,
        help="Validation ratio per class (default: 0.2).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Shuffle seed (default: 42).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Delete existing output directory before writing.",
    )
    args = parser.parse_args()

    classes = ALPHABET_CLASSES + (DIGIT_CLASSES if args.include_digits else [])
    input_root = args.input_root
    output_root = args.output_root
    train_out_root = output_root / "train"
    val_out_root = output_root / "val"

    if not input_root.exists():
        raise FileNotFoundError(
            f"Dataset not found at {input_root}. "
            "Download with: kaggle datasets download -d ayuraj/asl-dataset -p dataset --unzip"
        )

    if args.overwrite and output_root.exists():
        shutil.rmtree(output_root)

    random.seed(args.seed)
    summary: list[tuple[str, int, int]] = []

    for class_name in classes:
        src_dir = resolve_class_dir(input_root, class_name)
        if src_dir is None:
            print(f"[WARN] Missing class dir for: {class_name}")
            continue

        files = sorted(
            [
                path
                for path in src_dir.iterdir()
                if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
            ]
        )
        if not files:
            print(f"[WARN] No files found for class: {class_name}")
            continue

        random.shuffle(files)
        val_count = max(1, int(len(files) * args.val_ratio))
        train_count = len(files) - val_count
        label = output_class_name(class_name)

        copy_split(
            files,
            train_count=train_count,
            out_train=train_out_root / label,
            out_val=val_out_root / label,
        )
        summary.append((label, train_count, val_count))

    if not summary:
        raise RuntimeError(
            f"No classes were prepared from {input_root}. "
            "Check that class folders exist (e.g. a/, b/, ... or A/, B/, ...)."
        )

    print("\nPrepared dataset:")
    print(f"- Input: {input_root}")
    print(f"- Output: {output_root}")
    print(f"- Classes: {len(summary)}")

    total_train = sum(item[1] for item in summary)
    total_val = sum(item[2] for item in summary)
    print(f"- Train images: {total_train}")
    print(f"- Val images: {total_val}")

    print("\nPer-class counts:")
    for class_name, train_count, val_count in summary:
        print(f"  {class_name}: train={train_count}, val={val_count}")


if __name__ == "__main__":
    main()
