from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset, Subset
from torchvision.datasets.folder import IMG_EXTENSIONS, default_loader, has_file_allowed_extension
from tqdm import tqdm

from japanese_handwriting_ai.labels import (
    JAPANESE_CHARACTER_LABEL_GROUPS,
    JAPANESE_CHARACTER_LABELS,
    labels_for_groups,
    raw_label_dir,
)
from japanese_handwriting_ai.model import build_model
from japanese_handwriting_ai.preprocess import DEFAULT_IMAGE_SIZE, build_eval_transform, build_train_transform


class JapaneseCharacterImageFolder(Dataset):
    def __init__(self, *args: Any, included_labels: list[str] | None = None, **kwargs: Any) -> None:
        if args:
            root = args[0]
        else:
            root = kwargs.pop("root")
        self.root = Path(root)
        self.transform = kwargs.pop("transform", None)
        self.target_transform = kwargs.pop("target_transform", None)
        if kwargs:
            unexpected = ", ".join(kwargs)
            raise TypeError(f"Unexpected dataset arguments: {unexpected}")
        self.included_labels = included_labels or labels_for_groups(None)
        self.classes = [
            label for label in self.included_labels if label_directories(self.root, label)
        ]
        if not self.classes:
            raise FileNotFoundError(f"No Japanese character image folders found in {self.root}.")
        self.class_to_idx = {class_name: index for index, class_name in enumerate(self.classes)}
        self.samples = self._find_samples()
        self.targets = [target for _, target in self.samples]

    def _find_samples(self) -> list[tuple[str, int]]:
        samples: list[tuple[str, int]] = []
        for label in self.classes:
            target = self.class_to_idx[label]
            for label_dir in label_directories(self.root, label):
                for path in sorted(label_dir.rglob("*")):
                    if path.is_file() and has_file_allowed_extension(str(path), IMG_EXTENSIONS):
                        samples.append((str(path), target))
        if not samples:
            raise FileNotFoundError(f"No images found in {self.root}.")
        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, int]:
        path, target = self.samples[index]
        image = default_loader(path)
        if self.transform is not None:
            image = self.transform(image)
        if self.target_transform is not None:
            target = self.target_transform(target)
        return image, target


def label_dir_has_images(path: Path) -> bool:
    return any(
        child.is_file() and has_file_allowed_extension(str(child), IMG_EXTENSIONS)
        for child in path.rglob("*")
    )


def label_directories(root: Path, label: str) -> list[Path]:
    candidates = [raw_label_dir(root, label), raw_label_dir(root, label, flat=True)]
    seen: set[Path] = set()
    directories: list[Path] = []
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        if candidate.is_dir() and label_dir_has_images(candidate):
            directories.append(candidate)
    return directories


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a Japanese handwriting classifier.")
    parser.add_argument("--data-dir", type=Path, default=Path("data/raw"))
    parser.add_argument("--output", type=Path, default=Path("models/japanese_handwriting_full_v2.pt"))
    parser.add_argument("--resume", type=Path, help="Continue training from an existing checkpoint.")
    parser.add_argument(
        "--init-from",
        type=Path,
        help=(
            "Initialize compatible layers from an existing checkpoint. Use this when adding "
            "new classes such as Kanji N5; it is transfer learning, not an exact resume."
        ),
    )
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--image-size", type=int, default=DEFAULT_IMAGE_SIZE)
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument("--val-ratio", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--invert", action="store_true")
    parser.add_argument(
        "--no-class-balanced-loss",
        action="store_true",
        help="Disable inverse-frequency class weights in CrossEntropyLoss.",
    )
    parser.add_argument(
        "--label-groups",
        nargs="+",
        choices=sorted(JAPANESE_CHARACTER_LABEL_GROUPS),
        help=(
            "Train only selected groups. Examples: row_a, hiragana_row_a, "
            "katakana_row_k, hiragana, katakana, kana, kanji_n5, kanji_n4, kanji_n3, all_with_kanji_n3."
        ),
    )
    parser.add_argument(
        "--labels",
        nargs="+",
        choices=JAPANESE_CHARACTER_LABELS,
        help="Train only selected explicit labels, for example hiragana_a hiragana_i.",
    )
    return parser.parse_args()


def stratified_split_indices(
    targets: list[int],
    val_ratio: float,
    seed: int,
) -> tuple[list[int], list[int]]:
    by_class: dict[int, list[int]] = {}
    for index, target in enumerate(targets):
        by_class.setdefault(int(target), []).append(index)

    generator = torch.Generator().manual_seed(seed)
    train_indices: list[int] = []
    val_indices: list[int] = []

    for class_indices in by_class.values():
        permutation = torch.randperm(len(class_indices), generator=generator).tolist()
        shuffled = [class_indices[index] for index in permutation]
        val_count = max(1, int(len(shuffled) * val_ratio)) if len(shuffled) > 1 else 0
        val_indices.extend(shuffled[:val_count])
        train_indices.extend(shuffled[val_count:])

    train_order = torch.randperm(len(train_indices), generator=generator).tolist()
    val_order = torch.randperm(len(val_indices), generator=generator).tolist()
    return [train_indices[index] for index in train_order], [val_indices[index] for index in val_order]


def class_weights_for_dataset(dataset: JapaneseCharacterImageFolder) -> torch.Tensor:
    counts = torch.bincount(torch.tensor(dataset.targets), minlength=len(dataset.classes)).float()
    weights = counts.sum() / (counts.clamp_min(1.0) * len(dataset.classes))
    return weights


def accuracy(logits: torch.Tensor, targets: torch.Tensor) -> float:
    predictions = logits.argmax(dim=1)
    return (predictions == targets).float().mean().item()


def run_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
    optimizer: torch.optim.Optimizer | None = None,
) -> tuple[float, float]:
    training = optimizer is not None
    model.train(training)
    total_loss = 0.0
    total_acc = 0.0
    total_count = 0

    with torch.set_grad_enabled(training):
        for images, targets in tqdm(loader, leave=False, disable=not sys.stderr.isatty()):
            images = images.to(device)
            targets = targets.to(device)

            if optimizer is not None:
                optimizer.zero_grad(set_to_none=True)

            logits = model(images)
            loss = criterion(logits, targets)

            if optimizer is not None:
                loss.backward()
                optimizer.step()

            batch_size = images.size(0)
            total_loss += loss.item() * batch_size
            total_acc += accuracy(logits, targets) * batch_size
            total_count += batch_size

    return total_loss / total_count, total_acc / total_count


def checkpoint_payload(
    model: nn.Module,
    optimizer: torch.optim.Optimizer,
    dataset: JapaneseCharacterImageFolder,
    image_size: int,
    invert: bool,
    best_val_acc: float,
    epoch: int,
    args: argparse.Namespace,
) -> dict[str, Any]:
    serializable_args = {
        key: str(value) if isinstance(value, Path) else value
        for key, value in vars(args).items()
    }
    return {
        "model_name": "japanese_handwriting_cnn_v2",
        "model_state": model.state_dict(),
        "optimizer_state": optimizer.state_dict(),
        "classes": dataset.classes,
        "class_to_idx": dataset.class_to_idx,
        "image_size": image_size,
        "invert": invert,
        "best_val_acc": best_val_acc,
        "epoch": epoch,
        "args": serializable_args,
    }


def load_transfer_checkpoint(
    model: nn.Module,
    checkpoint: dict[str, Any],
    target_classes: list[str],
) -> tuple[int, int, list[str]]:
    source_state = checkpoint["model_state"]
    target_state = model.state_dict()
    source_classes = list(checkpoint.get("classes", []))
    final_weight_key = "classifier.5.weight"
    final_bias_key = "classifier.5.bias"
    loaded_tensors = 0
    skipped_keys: list[str] = []

    for key, value in source_state.items():
        if key in {final_weight_key, final_bias_key}:
            continue
        if key in target_state and target_state[key].shape == value.shape:
            target_state[key] = value
            loaded_tensors += 1
        else:
            skipped_keys.append(key)

    copied_classifier_rows = 0
    if (
        source_classes
        and final_weight_key in source_state
        and final_bias_key in source_state
        and final_weight_key in target_state
        and final_bias_key in target_state
        and source_state[final_weight_key].shape[1:] == target_state[final_weight_key].shape[1:]
    ):
        source_class_to_idx = {label: index for index, label in enumerate(source_classes)}
        for target_index, label in enumerate(target_classes):
            source_index = source_class_to_idx.get(label)
            if source_index is None:
                continue
            target_state[final_weight_key][target_index].copy_(source_state[final_weight_key][source_index])
            target_state[final_bias_key][target_index].copy_(source_state[final_bias_key][source_index])
            copied_classifier_rows += 1

    model.load_state_dict(target_state)
    return loaded_tensors, copied_classifier_rows, skipped_keys


def main() -> None:
    args = parse_args()
    torch.manual_seed(args.seed)

    if args.resume and args.init_from:
        raise ValueError("Use either --resume or --init-from, not both.")

    if not args.data_dir.exists():
        raise FileNotFoundError(
            f"{args.data_dir} does not exist. Run create_label_folders and add training images first."
        )

    train_transform = build_train_transform(image_size=args.image_size, invert=args.invert)
    eval_transform = build_eval_transform(image_size=args.image_size, invert=args.invert)
    included_labels = args.labels or labels_for_groups(args.label_groups)
    train_image_folder = JapaneseCharacterImageFolder(
        root=args.data_dir,
        transform=train_transform,
        included_labels=included_labels,
    )
    val_image_folder = JapaneseCharacterImageFolder(
        root=args.data_dir,
        transform=eval_transform,
        included_labels=included_labels,
    )

    if len(train_image_folder.classes) < 2:
        raise ValueError("Training needs at least two class folders with images.")

    train_indices, val_indices = stratified_split_indices(
        train_image_folder.targets,
        args.val_ratio,
        args.seed,
    )
    train_count = len(train_indices)
    val_count = len(val_indices)
    if train_count < 1:
        raise ValueError("Training needs more images. Add data before running train.")

    train_dataset = Subset(train_image_folder, train_indices)
    val_dataset = Subset(val_image_folder, val_indices)

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.num_workers,
        pin_memory=torch.cuda.is_available(),
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
        pin_memory=torch.cuda.is_available(),
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model(num_classes=len(train_image_folder.classes)).to(device)
    class_weights = None if args.no_class_balanced_loss else class_weights_for_dataset(train_image_folder).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", patience=3, factor=0.5)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    best_val_acc = 0.0
    start_epoch = 1

    if args.resume:
        checkpoint = torch.load(args.resume, map_location=device, weights_only=False)
        checkpoint_classes = checkpoint["classes"]
        if checkpoint_classes != train_image_folder.classes:
            raise ValueError(
                "Resume checkpoint classes do not match this training run. "
                "Use the same --label-groups/--labels as the original run."
            )
        model.load_state_dict(checkpoint["model_state"])
        if "optimizer_state" in checkpoint:
            optimizer.load_state_dict(checkpoint["optimizer_state"])
        best_val_acc = float(checkpoint.get("best_val_acc", 0.0))
        start_epoch = int(checkpoint.get("epoch", 0)) + 1
        print(f"Resumed from {args.resume} at epoch {start_epoch}")
    elif args.init_from:
        checkpoint = torch.load(args.init_from, map_location=device, weights_only=False)
        loaded_tensors, copied_rows, skipped_keys = load_transfer_checkpoint(
            model,
            checkpoint,
            train_image_folder.classes,
        )
        print(
            f"Initialized from {args.init_from}: "
            f"loaded_tensors={loaded_tensors} copied_classifier_rows={copied_rows}"
        )
        if skipped_keys:
            print(f"Skipped incompatible tensors: {', '.join(skipped_keys)}")

    print(f"Classes: {len(train_image_folder.classes)}")
    print(f"Labels: {', '.join(train_image_folder.classes)}")
    print(f"Images: train={train_count}, val={val_count}")
    print(f"Device: {device}")
    print(f"Class-balanced loss: {class_weights is not None}")

    end_epoch = start_epoch + args.epochs - 1
    for epoch in range(start_epoch, end_epoch + 1):
        train_loss, train_acc = run_epoch(model, train_loader, criterion, device, optimizer)
        val_loss, val_acc = run_epoch(model, val_loader, criterion, device)
        scheduler.step(val_acc)

        print(
            f"epoch={epoch:03d} "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f}"
        )

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save(
                checkpoint_payload(
                    model,
                    optimizer,
                    train_image_folder,
                    args.image_size,
                    args.invert,
                    best_val_acc,
                    epoch,
                    args,
                ),
                args.output,
            )
            print(f"saved={args.output} best_val_acc={best_val_acc:.4f}")


if __name__ == "__main__":
    main()
