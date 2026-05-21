from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

from japanese_handwriting_ai.preprocess import (
    DEFAULT_IMAGE_SIZE,
    crop_foreground,
    pad_to_square,
    pil_to_clean_grayscale,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Save preprocessing debug images.")
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("reports/preprocess_debug"))
    parser.add_argument("--image-size", type=int, default=DEFAULT_IMAGE_SIZE)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    image = Image.open(args.image)
    grayscale = pil_to_clean_grayscale(image)
    cropped = crop_foreground(image)
    squared = pad_to_square(cropped)
    resized = squared.resize((args.image_size, args.image_size))

    stem = args.image.stem
    grayscale.save(args.output_dir / f"{stem}_01_grayscale.png")
    cropped.save(args.output_dir / f"{stem}_02_cropped.png")
    squared.save(args.output_dir / f"{stem}_03_squared.png")
    resized.save(args.output_dir / f"{stem}_04_resized.png")
    print(f"Wrote debug images to {args.output_dir}")


if __name__ == "__main__":
    main()
