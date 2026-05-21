from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

from PIL import Image
import torch

from japanese_handwriting_ai.labels import LABEL_TO_CHAR
from japanese_handwriting_ai.model import build_model
from japanese_handwriting_ai.preprocess import DEFAULT_IMAGE_SIZE, image_to_tensor


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Predict Japanese character label from an image.")
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument(
        "--tta",
        action="store_true",
        help="Average predictions over small rotations for real-world photos.",
    )
    parser.add_argument(
        "--text-only",
        action="store_true",
        help="Print only the predicted Japanese character.",
    )
    return parser.parse_args()


def load_checkpoint(model_path: Path, device: torch.device) -> tuple[torch.nn.Module, dict[str, Any]]:
    checkpoint = torch.load(model_path, map_location=device, weights_only=False)
    classes = checkpoint["classes"]
    model = build_model(num_classes=len(classes))
    model.load_state_dict(checkpoint["model_state"])
    model.to(device)
    model.eval()
    return model, checkpoint


@torch.inference_mode()
def predict_image(
    model: torch.nn.Module,
    checkpoint: dict[str, Any],
    image: Image.Image,
    top_k: int = 5,
    device: torch.device | None = None,
    tta: bool = False,
) -> list[dict[str, float | str]]:
    device = device or next(model.parameters()).device
    image_size = int(checkpoint.get("image_size", DEFAULT_IMAGE_SIZE))
    invert = bool(checkpoint.get("invert", False))
    classes = checkpoint["classes"]

    images = [image]
    if tta:
        images = [
            image.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True, fillcolor=255)
            for angle in (-7, -3, 0, 3, 7)
        ]

    tensors = [
        image_to_tensor(candidate, image_size=image_size, invert=invert).to(device)
        for candidate in images
    ]
    batch = torch.cat(tensors, dim=0)
    probabilities = torch.softmax(model(batch), dim=1).mean(dim=0)
    limit = min(top_k, len(classes))
    scores, indices = torch.topk(probabilities, k=limit)

    return [
        {"label": classes[index.item()], "confidence": float(score.item())}
        for score, index in zip(scores, indices)
    ]


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    args = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, checkpoint = load_checkpoint(args.model, device)

    image = Image.open(args.image)
    predictions = predict_image(model, checkpoint, image, top_k=args.top_k, device=device, tta=args.tta)
    if args.text_only:
        print(LABEL_TO_CHAR.get(str(predictions[0]["label"]), str(predictions[0]["label"])))
        return

    for prediction in predictions:
        label = str(prediction["label"])
        character = LABEL_TO_CHAR.get(label, label)
        print(f"{character} ({label}): {prediction['confidence']:.4f}")


if __name__ == "__main__":
    main()
