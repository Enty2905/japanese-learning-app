from __future__ import annotations

import argparse
from pathlib import Path

from japanese_handwriting_ai.labels import (
    JAPANESE_CHARACTER_LABEL_GROUPS,
    JAPANESE_CHARACTER_LABELS,
    labels_for_groups,
    raw_label_dir,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create Japanese character label folders.")
    parser.add_argument("--root", type=Path, default=Path("data/raw"))
    parser.add_argument(
        "--label-groups",
        nargs="+",
        choices=sorted(JAPANESE_CHARACTER_LABEL_GROUPS),
        help="Create only selected groups. Examples: kana, kanji_n5, kanji_n4, kanji_n3, all_with_kanji_n3.",
    )
    parser.add_argument(
        "--labels",
        nargs="+",
        choices=JAPANESE_CHARACTER_LABELS,
        help="Create only selected explicit labels, for example kanji_u4e00.",
    )
    parser.add_argument(
        "--flat",
        action="store_true",
        help="Use the old flat layout data/raw/<label> instead of data/raw/<group>/<label>.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    labels = args.labels or labels_for_groups(args.label_groups)
    args.root.mkdir(parents=True, exist_ok=True)
    for label in labels:
        raw_label_dir(args.root, label, flat=args.flat).mkdir(parents=True, exist_ok=True)
    print(f"Created {len(labels)} label folders in {args.root}")


if __name__ == "__main__":
    main()
