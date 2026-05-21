from __future__ import annotations

import random
from typing import Callable

from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import numpy as np
import torch
from torchvision import transforms

DEFAULT_IMAGE_SIZE = 64
DEFAULT_MEAN = 0.5
DEFAULT_STD = 0.5


def pil_to_clean_grayscale(image: Image.Image) -> Image.Image:
    image = image.convert("L")
    return ImageOps.autocontrast(image)


def crop_foreground(image: Image.Image, padding_ratio: float = 0.18) -> Image.Image:
    gray = pil_to_clean_grayscale(image)
    array = np.asarray(gray)
    threshold = min(otsu_threshold(array), max(70, int(array.mean() - array.std() * 0.25)))
    mask = array < threshold
    if mask.sum() < 20:
        return gray

    mask = select_character_components(mask)
    ys, xs = np.where(mask)
    left = int(xs.min())
    right = int(xs.max()) + 1
    top = int(ys.min())
    bottom = int(ys.max()) + 1

    width = right - left
    height = bottom - top
    padding = int(max(width, height) * padding_ratio)
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(gray.width, right + padding)
    bottom = min(gray.height, bottom + padding)
    return gray.crop((left, top, right, bottom))


def otsu_threshold(array: np.ndarray) -> int:
    histogram = np.bincount(array.reshape(-1), minlength=256).astype(np.float64)
    total = array.size
    sum_total = np.dot(np.arange(256), histogram)
    weight_background = 0.0
    sum_background = 0.0
    best_threshold = 128
    best_variance = -1.0

    for threshold in range(256):
        weight_background += histogram[threshold]
        if weight_background == 0:
            continue
        weight_foreground = total - weight_background
        if weight_foreground == 0:
            break
        sum_background += threshold * histogram[threshold]
        mean_background = sum_background / weight_background
        mean_foreground = (sum_total - sum_background) / weight_foreground
        variance = weight_background * weight_foreground * (mean_background - mean_foreground) ** 2
        if variance > best_variance:
            best_variance = variance
            best_threshold = threshold
    return int(best_threshold)


def select_character_components(mask: np.ndarray) -> np.ndarray:
    components = find_components(mask)
    if not components:
        return mask

    height, width = mask.shape
    center_x = width / 2
    center_y = height / 2
    max_area = max(component["area"] for component in components)
    image_area = height * width
    min_area = max(20, int(image_area * 0.00015))

    kept: list[dict[str, float | int | list[tuple[int, int]]]] = []
    for component in components:
        if int(component["area"]) < min_area:
            continue

        component_center_x = float(component["center_x"])
        component_center_y = float(component["center_y"])
        distance_x = abs(component_center_x - center_x) / max(center_x, 1)
        distance_y = abs(component_center_y - center_y) / max(center_y, 1)
        central = distance_x <= 0.62 and distance_y <= 0.62
        large = int(component["area"]) >= max_area * 0.18
        medium_near_center = int(component["area"]) >= max_area * 0.06 and distance_x <= 0.75 and distance_y <= 0.75

        if central or large or medium_near_center:
            kept.append(component)

    if not kept:
        kept = [max(components, key=lambda component: int(component["area"]))]

    output = np.zeros_like(mask, dtype=bool)
    for component in kept:
        pixels = component["pixels"]
        ys = [pixel[0] for pixel in pixels]
        xs = [pixel[1] for pixel in pixels]
        output[ys, xs] = True
    return output


def find_components(mask: np.ndarray) -> list[dict[str, float | int | list[tuple[int, int]]]]:
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    components: list[dict[str, float | int | list[tuple[int, int]]]] = []

    for start_y, start_x in zip(*np.where(mask & ~visited)):
        stack = [(int(start_y), int(start_x))]
        visited[start_y, start_x] = True
        pixels: list[tuple[int, int]] = []

        while stack:
            y, x = stack.pop()
            pixels.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dy == 0 and dx == 0:
                        continue
                    ny = y + dy
                    nx = x + dx
                    if ny < 0 or ny >= height or nx < 0 or nx >= width:
                        continue
                    if visited[ny, nx] or not mask[ny, nx]:
                        continue
                    visited[ny, nx] = True
                    stack.append((ny, nx))

        if len(pixels) < 20:
            continue

        ys = np.fromiter((pixel[0] for pixel in pixels), dtype=np.int32)
        xs = np.fromiter((pixel[1] for pixel in pixels), dtype=np.int32)
        components.append(
            {
                "pixels": pixels,
                "area": len(pixels),
                "center_x": float(xs.mean()),
                "center_y": float(ys.mean()),
                "left": int(xs.min()),
                "right": int(xs.max()) + 1,
                "top": int(ys.min()),
                "bottom": int(ys.max()) + 1,
            }
        )

    return components


def pad_to_square(image: Image.Image, fill: int = 255) -> Image.Image:
    width, height = image.size
    side = max(width, height)
    output = Image.new("L", (side, side), color=fill)
    output.paste(image, ((side - width) // 2, (side - height) // 2))
    return output


class RandomStrokeWidth:
    def __init__(self, probability: float = 0.35) -> None:
        self.probability = probability

    def __call__(self, image: Image.Image) -> Image.Image:
        if random.random() > self.probability:
            return image
        if random.random() < 0.5:
            return image.filter(ImageFilter.MinFilter(3))
        return image.filter(ImageFilter.MaxFilter(3))


class RandomPaperNoise:
    def __init__(self, probability: float = 0.45) -> None:
        self.probability = probability

    def __call__(self, image: Image.Image) -> Image.Image:
        if random.random() > self.probability:
            return image

        array = np.asarray(image).astype(np.int16)
        noise = np.random.normal(0, random.uniform(2, 9), array.shape)
        array = array + noise

        if random.random() < 0.45:
            step = random.randint(12, 24)
            line_value = random.randint(175, 225)
            x_offset = random.randint(0, step - 1)
            y_offset = random.randint(0, step - 1)
            array[:, x_offset::step] = np.minimum(array[:, x_offset::step], line_value)
            array[y_offset::step, :] = np.minimum(array[y_offset::step, :], line_value)

        array = np.clip(array, 0, 255).astype(np.uint8)
        return Image.fromarray(array, mode="L")


class RandomContrast:
    def __init__(self, probability: float = 0.5) -> None:
        self.probability = probability

    def __call__(self, image: Image.Image) -> Image.Image:
        if random.random() > self.probability:
            return image
        image = ImageEnhance.Contrast(image).enhance(random.uniform(0.75, 1.45))
        return ImageEnhance.Brightness(image).enhance(random.uniform(0.88, 1.12))


def build_train_transform(
    image_size: int = DEFAULT_IMAGE_SIZE,
    invert: bool = False,
) -> Callable:
    items = [
        transforms.Lambda(crop_foreground),
        transforms.Lambda(pad_to_square),
        RandomContrast(),
        RandomStrokeWidth(),
        transforms.RandomPerspective(distortion_scale=0.12, p=0.25),
        transforms.Resize((image_size, image_size)),
        transforms.RandomAffine(
            degrees=14,
            translate=(0.10, 0.10),
            scale=(0.82, 1.18),
            shear=(-4, 4, -4, 4),
            fill=255,
        ),
        transforms.RandomApply([transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 0.8))], p=0.18),
        RandomPaperNoise(),
        transforms.ToTensor(),
        transforms.RandomErasing(p=0.12, scale=(0.01, 0.05), ratio=(0.3, 3.3), value=1.0),
    ]
    if invert:
        items.append(transforms.Lambda(lambda x: 1.0 - x))
    items.append(transforms.Normalize((DEFAULT_MEAN,), (DEFAULT_STD,)))
    return transforms.Compose(items)


def build_eval_transform(
    image_size: int = DEFAULT_IMAGE_SIZE,
    invert: bool = False,
) -> Callable:
    items = [
        transforms.Lambda(crop_foreground),
        transforms.Lambda(pad_to_square),
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
    ]
    if invert:
        items.append(transforms.Lambda(lambda x: 1.0 - x))
    items.append(transforms.Normalize((DEFAULT_MEAN,), (DEFAULT_STD,)))
    return transforms.Compose(items)


def image_to_tensor(
    image: Image.Image,
    image_size: int = DEFAULT_IMAGE_SIZE,
    invert: bool = False,
) -> torch.Tensor:
    transform = build_eval_transform(image_size=image_size, invert=invert)
    return transform(image).unsqueeze(0)
