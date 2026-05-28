#!/usr/bin/env python3
"""
Prepare ASL dataset splits from Kaggle download.

Usage:
  python ML/prepare_dataset.py
"""

from __future__ import annotations

import argparse
import random
import shutil
from pathlib import Path

ALPHABET_CLASSES = [chr(code) for code in range(ord("A"), ord("Z") + 1)]
EXTRA_CLASSES = ["del", "nothing", "space"]


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
        shutil.copy2(src, out_train / src.name)
    for src in val_files:
        shutil.copy2(src, out_val / src.name)


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare ASL train/val split.")
    parser.add_argument(
        "--input-root",
        type=Path,
        default=Path("dataset/asl_alphabet/ASL_Alphabet_Dataset/asl_alphabet_train"),
        help="Kaggle train root containing class subfolders.",
    )
    parser.add_argument(
        "--output-root",
        type=Path,
        default=Path("dataset/processed"),
        help="Output root for processed splits.",
    )
    parser.add_argument(
        "--include-extra",
        action="store_true",
        help="Include del/nothing/space classes in addition to A-Z.",
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

    classes = ALPHABET_CLASSES + (EXTRA_CLASSES if args.include_extra else [])
    input_root = args.input_root
    output_root = args.output_root
    train_out_root = output_root / "train"
    val_out_root = output_root / "val"

    if args.overwrite and output_root.exists():
        shutil.rmtree(output_root)

    random.seed(args.seed)
    summary: list[tuple[str, int, int]] = []

    for class_name in classes:
        src_dir = input_root / class_name
        if not src_dir.exists():
            print(f"[WARN] Missing class dir: {src_dir}")
            continue

        files = sorted(
            [
                p
                for p in src_dir.iterdir()
                if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png"}
            ]
        )
        if not files:
            print(f"[WARN] No files found for class: {class_name}")
            continue

        random.shuffle(files)
        val_count = max(1, int(len(files) * args.val_ratio))
        train_count = len(files) - val_count

        copy_split(
            files,
            train_count=train_count,
            out_train=train_out_root / class_name,
            out_val=val_out_root / class_name,
        )
        summary.append((class_name, train_count, val_count))

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
