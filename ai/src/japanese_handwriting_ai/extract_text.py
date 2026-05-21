from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image
import torch

from japanese_handwriting_ai.predict import load_checkpoint
from japanese_handwriting_ai.text_ocr import extract_text_from_image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract Japanese text from an image by segmenting lines/characters."
    )
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--top-k", type=int, default=3)
    parser.add_argument("--tta", action="store_true")
    parser.add_argument(
        "--min-confidence",
        type=float,
        default=0.0,
        help="Skip segmented crops whose best prediction is below this confidence.",
    )
    parser.add_argument("--json", action="store_true", help="Print the full JSON result.")
    return parser.parse_args()


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    args = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, checkpoint = load_checkpoint(args.model, device)
    image = Image.open(args.image)
    result = extract_text_from_image(
        model,
        checkpoint,
        image,
        top_k=args.top_k,
        device=device,
        tta=args.tta,
        min_confidence=args.min_confidence,
    )

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    print(result["text"])
    print(
        f"lines={result['line_count']} "
        f"characters={result['character_count']} "
        f"skipped={result['skipped_count']} "
        f"average_confidence={result['average_confidence']:.4f}"
    )


if __name__ == "__main__":
    main()
