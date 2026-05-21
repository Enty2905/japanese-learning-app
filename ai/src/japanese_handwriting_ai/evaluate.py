from __future__ import annotations

import argparse
from pathlib import Path

import torch
from torch.utils.data import DataLoader, Subset

from japanese_handwriting_ai.predict import load_checkpoint
from japanese_handwriting_ai.preprocess import DEFAULT_IMAGE_SIZE, build_eval_transform
from japanese_handwriting_ai.train import JapaneseCharacterImageFolder, stratified_split_indices


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a Japanese handwriting checkpoint.")
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--data-dir", type=Path, default=Path("data/raw"))
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--split", choices=["val", "all"], default="val")
    parser.add_argument("--val-ratio", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--num-workers", type=int, default=0)
    return parser.parse_args()


def topk_accuracy(logits: torch.Tensor, targets: torch.Tensor, k: int) -> int:
    limit = min(k, logits.shape[1])
    predictions = logits.topk(limit, dim=1).indices
    return predictions.eq(targets.unsqueeze(1)).any(dim=1).sum().item()


@torch.inference_mode()
def main() -> None:
    args = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, checkpoint = load_checkpoint(args.model, device)
    classes = checkpoint["classes"]
    image_size = int(checkpoint.get("image_size", DEFAULT_IMAGE_SIZE))
    invert = bool(checkpoint.get("invert", False))

    dataset = JapaneseCharacterImageFolder(
        root=args.data_dir,
        transform=build_eval_transform(image_size=image_size, invert=invert),
        included_labels=classes,
    )
    if dataset.classes != classes:
        raise ValueError("Dataset class order does not match checkpoint class order.")

    if args.split == "val":
        _, val_indices = stratified_split_indices(dataset.targets, args.val_ratio, args.seed)
        dataset_for_eval = Subset(dataset, val_indices)
    else:
        dataset_for_eval = dataset

    loader = DataLoader(
        dataset_for_eval,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
        pin_memory=torch.cuda.is_available(),
    )

    total = 0
    top1 = 0
    top3 = 0
    top5 = 0
    model.eval()
    for images, targets in loader:
        images = images.to(device)
        targets = targets.to(device)
        logits = model(images)
        total += targets.numel()
        top1 += topk_accuracy(logits, targets, 1)
        top3 += topk_accuracy(logits, targets, 3)
        top5 += topk_accuracy(logits, targets, 5)

    print(f"classes={len(classes)} samples={total} split={args.split}")
    print(f"top1={top1 / total:.4f}")
    print(f"top3={top3 / total:.4f}")
    print(f"top5={top5 / total:.4f}")


if __name__ == "__main__":
    main()
