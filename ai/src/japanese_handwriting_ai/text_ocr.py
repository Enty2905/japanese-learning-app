from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from PIL import Image
import torch

from japanese_handwriting_ai.labels import LABEL_TO_CHAR
from japanese_handwriting_ai.predict import predict_image
from japanese_handwriting_ai.preprocess import find_components, otsu_threshold, pil_to_clean_grayscale


@dataclass(frozen=True)
class TextBox:
    left: int
    top: int
    right: int
    bottom: int
    score: float = 1.0
    kind: str = "character"
    reason: str = "accepted"
    ink_ratio: float = 0.0
    punctuation: str | None = None

    def as_tuple(self) -> tuple[int, int, int, int]:
        return self.left, self.top, self.right, self.bottom


def _prepare_mask(image: Image.Image, max_side: int = 1800) -> tuple[np.ndarray, float]:
    gray = pil_to_clean_grayscale(image)
    scale = 1.0
    if max(gray.size) > max_side:
        scale = max_side / max(gray.size)
    elif gray.height < 120:
        scale = min(4.0, 120 / max(gray.height, 1))

    if scale != 1.0:
        resized = (max(1, int(gray.width * scale)), max(1, int(gray.height * scale)))
        gray = gray.resize(resized, Image.Resampling.BICUBIC)

    array = np.asarray(gray)
    threshold = otsu_threshold(array)
    dark_mask = array < threshold
    light_mask = array > threshold
    mask = dark_mask if dark_mask.mean() <= light_mask.mean() else light_mask
    return _remove_small_components(mask), scale


def _remove_small_components(mask: np.ndarray) -> np.ndarray:
    components = find_components(mask)
    if not components:
        return mask

    min_area = max(12, int(mask.size * 0.000025))
    output = np.zeros_like(mask, dtype=bool)
    for component in components:
        if int(component["area"]) < min_area:
            continue
        pixels = component["pixels"]
        ys = [pixel[0] for pixel in pixels]
        xs = [pixel[1] for pixel in pixels]
        output[ys, xs] = True
    return output


def _ranges_from_projection(
    projection: np.ndarray,
    min_ink: int,
    max_gap: int,
    min_span: int,
) -> list[tuple[int, int]]:
    active = projection >= min_ink
    ranges: list[tuple[int, int]] = []
    start: int | None = None

    for index, is_active in enumerate(active):
        if is_active and start is None:
            start = index
        elif not is_active and start is not None:
            ranges.append((start, index))
            start = None
    if start is not None:
        ranges.append((start, len(active)))

    if not ranges:
        return []

    merged = [ranges[0]]
    for left, right in ranges[1:]:
        previous_left, previous_right = merged[-1]
        if left - previous_right <= max_gap:
            merged[-1] = (previous_left, right)
        else:
            merged.append((left, right))

    return [
        (left, right)
        for left, right in merged
        if right - left >= min_span or projection[left:right].sum() >= min_ink * max(2, min_span)
    ]


def _split_wide_character_ranges(
    ranges: list[tuple[int, int]],
    line_height: int,
) -> list[tuple[int, int]]:
    if not ranges:
        return ranges
    if line_height < 12:
        return ranges

    expected_width = max(8.0, line_height * 0.92)
    split_ranges: list[tuple[int, int]] = []
    for left, right in ranges:
        width = right - left
        estimated_count = int(round(width / expected_width))
        if estimated_count <= 1 or width < expected_width * 1.45:
            split_ranges.append((left, right))
            continue

        estimated_count = min(12, max(2, estimated_count))
        step = width / estimated_count
        for index in range(estimated_count):
            split_left = int(round(left + index * step))
            split_right = int(round(left + (index + 1) * step))
            if split_right - split_left >= 2:
                split_ranges.append((split_left, split_right))
    return split_ranges


def _mask_bounds(mask: np.ndarray) -> tuple[int, int, int, int] | None:
    if not mask.any():
        return None

    ys, xs = np.where(mask)
    left = int(xs.min())
    right = int(xs.max()) + 1
    top = int(ys.min())
    bottom = int(ys.max()) + 1
    return left, top, right, bottom


def _punctuation_from_mask(mask: np.ndarray, line_height: int) -> str | None:
    bounds = _mask_bounds(mask)
    if bounds is None:
        return None

    left, top, right, bottom = bounds
    ink_width = right - left
    ink_height = bottom - top
    ink_area = int(mask.sum())
    density = ink_area / max(1, ink_width * ink_height)
    width_ratio = ink_width / max(line_height, 1)
    height_ratio = ink_height / max(line_height, 1)
    center_y_ratio = ((top + bottom) / 2) / max(line_height, 1)

    if width_ratio >= 0.48 and height_ratio <= 0.24:
        return "ー"

    row_ranges = _ranges_from_projection(
        mask[:, left:right].sum(axis=1),
        min_ink=max(1, int(ink_width * 0.25)),
        max_gap=1,
        min_span=1,
    )
    if (
        width_ratio <= 0.34
        and height_ratio >= 0.30
        and len(row_ranges) >= 2
    ):
        centers = [(top_range + bottom_range) / 2 for top_range, bottom_range in row_ranges]
        if centers[-1] - centers[0] >= max(4, line_height * 0.20):
            return ":"

    compact = width_ratio <= 0.42 and height_ratio <= 0.42
    large_enough = ink_width >= max(4, int(line_height * 0.14)) and ink_height >= max(4, int(line_height * 0.14))
    if compact and large_enough:
        if 0.30 <= center_y_ratio <= 0.72 and density >= 0.35:
            return "・"
        if center_y_ratio >= 0.42 and density <= 0.72:
            return "。"
        if center_y_ratio >= 0.45 and height_ratio >= 0.18 and density >= 0.28:
            return "、"

    return None


def _score_character_candidate(
    char_mask: np.ndarray,
    line_height: int,
    previous_gap: int,
    next_gap: int,
) -> tuple[float, str, float]:
    ink_area = int(char_mask.sum())
    if ink_area <= 0:
        return 0.0, "empty", 0.0

    bounds = _mask_bounds(char_mask)
    if bounds is None:
        return 0.0, "empty", 0.0

    left, top, right, bottom = bounds
    ink_width = right - left
    ink_height = bottom - top
    density = ink_area / max(1, ink_width * ink_height)
    height_ratio = ink_height / max(line_height, 1)
    width_ratio = ink_width / max(line_height, 1)
    center_y_ratio = ((top + bottom) / 2) / max(line_height, 1)
    isolation_gap = min(previous_gap, next_gap) / max(line_height, 1)

    score = 1.0
    reasons: list[str] = []
    if ink_area < max(8, int(line_height * 0.12)):
        score -= 0.40
        reasons.append("low_ink")
    if height_ratio < 0.22:
        score -= 0.34
        reasons.append("short")
    if width_ratio < 0.16 and height_ratio < 0.68:
        score -= 0.24
        reasons.append("narrow")
    if density < 0.06:
        score -= 0.30
        reasons.append("sparse")
    if density > 0.92 and max(ink_width, ink_height) <= max(4, int(line_height * 0.34)):
        score -= 0.22
        reasons.append("compact")
    if center_y_ratio < 0.12 or center_y_ratio > 0.92:
        score -= 0.18
        reasons.append("off_baseline")
    if isolation_gap > 0.90 and max(width_ratio, height_ratio) < 0.36:
        score -= 0.22
        reasons.append("isolated")

    reason = "+".join(reasons) if reasons else "accepted"
    return max(0.0, min(1.0, score)), reason, density


def _scale_and_pad_box(
    left: int,
    top: int,
    right: int,
    bottom: int,
    scale: float,
    image_size: tuple[int, int],
    padding: int,
    score: float = 1.0,
    kind: str = "character",
    reason: str = "accepted",
    ink_ratio: float = 0.0,
    punctuation: str | None = None,
) -> TextBox:
    width, height = image_size
    original_left = int(round(left / scale))
    original_top = int(round(top / scale))
    original_right = int(round(right / scale))
    original_bottom = int(round(bottom / scale))
    return TextBox(
        left=max(0, original_left - padding),
        top=max(0, original_top - padding),
        right=min(width, original_right + padding),
        bottom=min(height, original_bottom + padding),
        score=score,
        kind=kind,
        reason=reason,
        ink_ratio=ink_ratio,
        punctuation=punctuation,
    )


def _crop_mask(image: Image.Image) -> np.ndarray:
    gray = pil_to_clean_grayscale(image)
    array = np.asarray(gray)
    threshold = otsu_threshold(array)
    dark_mask = array < threshold
    light_mask = array > threshold
    return dark_mask if dark_mask.mean() <= light_mask.mean() else light_mask


def _punctuation_from_crop(image: Image.Image) -> str | None:
    mask = _crop_mask(image)
    if mask.sum() < 4:
        return None
    return _punctuation_from_mask(mask, image.height)


def _segment_text_candidates(image: Image.Image) -> list[list[TextBox]]:
    mask, scale = _prepare_mask(image)
    if mask.sum() < 20:
        return []

    image_width, image_height = image.size
    row_projection = mask.sum(axis=1)
    line_ranges = _ranges_from_projection(
        row_projection,
        min_ink=max(2, int(mask.shape[1] * 0.002)),
        max_gap=max(3, int(mask.shape[0] * 0.012)),
        min_span=max(8, int(mask.shape[0] * 0.012)),
    )

    lines: list[list[TextBox]] = []
    for line_top, line_bottom in line_ranges:
        line_mask = mask[line_top:line_bottom, :]
        line_height = line_bottom - line_top
        column_projection = line_mask.sum(axis=0)
        character_ranges = _ranges_from_projection(
            column_projection,
            min_ink=max(1, int(line_height * 0.035)),
            max_gap=max(2, int(line_height * 0.14)),
            min_span=max(3, int(line_height * 0.06)),
        )
        character_ranges = _split_wide_character_ranges(character_ranges, line_height)

        boxes: list[TextBox] = []
        padding = max(2, int(round((line_height / scale) * 0.12)))
        for index, (char_left, char_right) in enumerate(character_ranges):
            char_mask = line_mask[:, char_left:char_right]
            previous_gap = (
                char_left - character_ranges[index - 1][1]
                if index > 0
                else line_height
            )
            next_gap = (
                character_ranges[index + 1][0] - char_right
                if index + 1 < len(character_ranges)
                else line_height
            )
            punctuation = _punctuation_from_mask(char_mask, line_height)
            if punctuation is not None:
                score = 0.95
                reason = f"punctuation_{punctuation}"
                kind = "punctuation"
                ink_ratio = 1.0
            else:
                score, reason, ink_ratio = _score_character_candidate(
                    char_mask,
                    line_height,
                    previous_gap,
                    next_gap,
                )
                kind = "character" if score >= 0.55 else "rejected"

            bounds = _mask_bounds(char_mask)
            if bounds is None:
                continue
            _, tight_top_offset, _, tight_bottom_offset = bounds
            ys, _ = np.where(char_mask)
            tight_top = line_top + tight_top_offset if len(ys) else line_top
            tight_bottom = line_top + tight_bottom_offset if len(ys) else line_bottom
            boxes.append(
                _scale_and_pad_box(
                    char_left,
                    tight_top,
                    char_right,
                    tight_bottom,
                    scale,
                    (image_width, image_height),
                    padding,
                    score=score,
                    kind=kind,
                    reason=reason,
                    ink_ratio=ink_ratio,
                    punctuation=punctuation,
                )
            )
        if boxes:
            lines.append(boxes)

    return lines


def segment_text_image(image: Image.Image) -> list[list[TextBox]]:
    return [
        [box for box in boxes if box.kind != "rejected"]
        for boxes in _segment_text_candidates(image)
        if any(box.kind != "rejected" for box in boxes)
    ]


@torch.inference_mode()
def extract_text_from_image(
    model: torch.nn.Module,
    checkpoint: dict[str, Any],
    image: Image.Image,
    top_k: int = 3,
    device: torch.device | None = None,
    tta: bool = False,
    min_confidence: float = 0.0,
    max_characters: int = 240,
) -> dict[str, Any]:
    lines = _segment_text_candidates(image)
    output_lines: list[dict[str, Any]] = []
    debug_boxes: list[dict[str, Any]] = []
    total_confidence = 0.0
    total_characters = 0
    skipped_count = 0
    rejected_count = 0

    for line_index, boxes in enumerate(lines):
        line_characters: list[dict[str, Any]] = []
        for box in boxes:
            debug_box: dict[str, Any] = {
                "box": [box.left, box.top, box.right, box.bottom],
                "line_index": line_index,
                "status": "candidate",
                "kind": box.kind,
                "reason": box.reason,
                "score": box.score,
                "ink_ratio": box.ink_ratio,
            }
            if box.kind == "rejected":
                rejected_count += 1
                debug_box["status"] = "rejected"
                debug_boxes.append(debug_box)
                continue

            if total_characters >= max_characters:
                break
            crop = image.crop(box.as_tuple())
            punctuation = box.punctuation or _punctuation_from_crop(crop)
            if punctuation is not None:
                confidence = 0.99
                total_confidence += confidence
                total_characters += 1
                debug_box.update(
                    {
                        "status": "accepted",
                        "character": punctuation,
                        "label": "punctuation",
                        "confidence": confidence,
                    }
                )
                debug_boxes.append(debug_box)
                line_characters.append(
                    {
                        "character": punctuation,
                        "label": "punctuation",
                        "confidence": confidence,
                        "box": [box.left, box.top, box.right, box.bottom],
                        "top_k": [
                            {
                                "character": punctuation,
                                "label": "punctuation",
                                "confidence": confidence,
                            }
                        ],
                    }
                )
                continue

            predictions = predict_image(
                model,
                checkpoint,
                crop,
                top_k=top_k,
                device=device,
                tta=tta,
            )
            best = predictions[0]
            label = str(best["label"])
            confidence = float(best["confidence"])
            if confidence < min_confidence:
                skipped_count += 1
                debug_box.update(
                    {
                        "status": "skipped",
                        "character": LABEL_TO_CHAR.get(label, label),
                        "label": label,
                        "confidence": confidence,
                        "reason": "low_confidence",
                    }
                )
                debug_boxes.append(debug_box)
                continue
            character = LABEL_TO_CHAR.get(label, label)
            total_confidence += confidence
            total_characters += 1
            debug_box.update(
                {
                    "status": "accepted",
                    "character": character,
                    "label": label,
                    "confidence": confidence,
                }
            )
            debug_boxes.append(debug_box)
            line_characters.append(
                {
                    "character": character,
                    "label": label,
                    "confidence": confidence,
                    "box": [box.left, box.top, box.right, box.bottom],
                    "top_k": [
                        {
                            "character": LABEL_TO_CHAR.get(str(item["label"]), str(item["label"])),
                            "label": item["label"],
                            "confidence": item["confidence"],
                        }
                        for item in predictions
                    ],
                }
            )
        if line_characters:
            output_lines.append(
                {
                    "text": "".join(item["character"] for item in line_characters),
                    "characters": line_characters,
                }
            )

    text = "\n".join(line["text"] for line in output_lines)
    average_confidence = total_confidence / total_characters if total_characters else 0.0
    return {
        "text": text,
        "average_confidence": average_confidence,
        "lines": output_lines,
        "line_count": len(output_lines),
        "character_count": total_characters,
        "skipped_count": skipped_count,
        "rejected_count": rejected_count,
        "debug_boxes": debug_boxes,
    }
