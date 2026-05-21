from __future__ import annotations

import argparse
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from japanese_handwriting_ai.labels import (
    JAPANESE_CHARACTER_LABEL_GROUPS,
    JAPANESE_CHARACTER_LABELS,
    LABEL_TO_CHAR,
    labels_for_groups,
    raw_label_dir,
)


DEFAULT_FONT_CANDIDATES = [
    Path("C:/Windows/Fonts/NotoSansJP-VF.ttf"),
    Path("C:/Windows/Fonts/NotoSerifJP-VF.ttf"),
    Path("C:/Windows/Fonts/meiryo.ttc"),
    Path("C:/Windows/Fonts/meiryob.ttc"),
    Path("C:/Windows/Fonts/msgothic.ttc"),
    Path("C:/Windows/Fonts/YuGothM.ttc"),
    Path("C:/Windows/Fonts/YuGothB.ttc"),
    Path("C:/Windows/Fonts/yumin.ttf"),
    Path("C:/Windows/Fonts/yumindb.ttf"),
    Path("C:/Windows/Fonts/BIZ-UDGothicR.ttc"),
    Path("C:/Windows/Fonts/BIZ-UDGothicB.ttc"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate synthetic Japanese character images for robustness.")
    parser.add_argument("--out", type=Path, default=Path("data/raw"))
    parser.add_argument("--samples-per-class", type=int, default=25)
    parser.add_argument("--image-size", type=int, default=160)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument(
        "--label-groups",
        nargs="+",
        choices=sorted(JAPANESE_CHARACTER_LABEL_GROUPS),
        help="Generate only selected groups. Examples: kana, kanji_n5, kanji_n4, kanji_n3, all_with_kanji_n3.",
    )
    parser.add_argument(
        "--labels",
        nargs="+",
        choices=JAPANESE_CHARACTER_LABELS,
        help="Generate only selected explicit labels, for example kanji_u4e00.",
    )
    parser.add_argument(
        "--flat",
        action="store_true",
        help="Use the old flat layout data/raw/<label> instead of data/raw/<group>/<label>.",
    )
    return parser.parse_args()


def available_fonts() -> list[Path]:
    fonts = [path for path in DEFAULT_FONT_CANDIDATES if path.exists()]
    if not fonts:
        raise FileNotFoundError("No Japanese font candidates were found in C:/Windows/Fonts.")
    return fonts


def draw_grid(draw: ImageDraw.ImageDraw, image_size: int) -> None:
    if random.random() > 0.55:
        return
    step = random.randint(22, 42)
    color = random.randint(205, 235)
    for position in range(random.randint(0, step - 1), image_size, step):
        draw.line((position, 0, position, image_size), fill=color, width=1)
    for position in range(random.randint(0, step - 1), image_size, step):
        draw.line((0, position, image_size, position), fill=color, width=1)


def render_character(char: str, fonts: list[Path], image_size: int) -> Image.Image:
    background = random.randint(238, 255)
    image = Image.new("L", (image_size, image_size), color=background)
    draw = ImageDraw.Draw(image)
    draw_grid(draw, image_size)

    font_path = random.choice(fonts)
    font_size = random.randint(int(image_size * 0.52), int(image_size * 0.84))
    font = ImageFont.truetype(str(font_path), font_size)
    text_bbox = draw.textbbox((0, 0), char, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (image_size - text_width) / 2 - text_bbox[0] + random.randint(-12, 12)
    y = (image_size - text_height) / 2 - text_bbox[1] + random.randint(-12, 12)
    draw.text((x, y), char, font=font, fill=random.randint(0, 35))

    if random.random() < 0.35:
        image = image.filter(ImageFilter.MinFilter(3))
    if random.random() < 0.20:
        image = image.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.2, 0.8)))

    angle = random.uniform(-13, 13)
    image = image.rotate(angle, resample=Image.Resampling.BICUBIC, expand=False, fillcolor=background)

    array = np.asarray(image).astype(np.float32)
    array = array + np.random.normal(0, random.uniform(1.5, 7.5), array.shape)
    array = np.clip(array, 0, 255).astype(np.uint8)
    return Image.fromarray(array, mode="L")


def main() -> None:
    args = parse_args()
    random.seed(args.seed)
    np.random.seed(args.seed)
    fonts = available_fonts()
    labels = args.labels or labels_for_groups(args.label_groups)
    print(f"Using {len(fonts)} fonts.")

    for label in labels:
        char = LABEL_TO_CHAR[label]
        label_dir = raw_label_dir(args.out, label, flat=args.flat)
        label_dir.mkdir(parents=True, exist_ok=True)
        for index in range(args.samples_per_class):
            output = label_dir / f"synthetic_{index:04d}.png"
            if output.exists() and not args.overwrite:
                continue
            image = render_character(char, fonts, args.image_size)
            image.save(output)
    print(
        f"Generated up to {args.samples_per_class} synthetic images per class "
        f"for {len(labels)} labels in {args.out}"
    )


if __name__ == "__main__":
    main()
