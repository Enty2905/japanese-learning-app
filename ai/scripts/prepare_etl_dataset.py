# -*- coding: utf-8 -*-
from __future__ import annotations

import argparse
import csv
import html.parser
import re
import ssl
import shutil
import struct
import unicodedata
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from typing import Iterable

from japanese_handwriting_ai.labels import (
    CHAR_TO_LABEL as PROJECT_CHAR_TO_LABEL,
    JAPANESE_CHARACTER_LABEL_GROUPS,
    JAPANESE_CHARACTER_LABELS,
    labels_for_groups,
    raw_label_dir,
)


ETL_HOME_URL = "https://etlcdb.db.aist.go.jp"
ETL_DOWNLOAD_PAGE_URL = f"{ETL_HOME_URL}/download2/"
DEFAULT_DATASETS = ("ETL4", "ETL5")

DATASET_FORMATS = {
    "ETL4": {
        "format_name": "C-Type",
        "is_hiragana": True,
        "record_size": 2952,
        "resolution": (72, 76),
        "record_format": ">9xB206x2736s",
        "char_code_index": 0,
        "image_data_index": 1,
        "bit_depth": 4,
    },
    "ETL5": {
        "format_name": "C-Type",
        "is_hiragana": False,
        "record_size": 2952,
        "resolution": (72, 76),
        "record_format": ">9xB206x2736s",
        "char_code_index": 0,
        "image_data_index": 1,
        "bit_depth": 4,
    },
    "ETL7": {
        "format_name": "M-Type",
        "is_hiragana": True,
        "record_size": 2052,
        "resolution": (64, 63),
        "record_format": ">H2sH6BI4H4B4x2016s4x",
        "char_code_index": 3,
        "image_data_index": 18,
        "bit_depth": 4,
    },
    "ETL8G": {
        "format_name": "G-Type",
        "record_size": 8199,
        "resolution": (128, 127),
        "record_format": ">2H8sI4B4H2B30x8128s11x",
        "char_code_index": 1,
        "image_data_index": 14,
        "bit_depth": 4,
    },
    "ETL9G": {
        "format_name": "G-Type",
        "record_size": 8199,
        "resolution": (128, 127),
        "record_format": ">2H8sI4B4H2B34x8128s7x",
        "char_code_index": 1,
        "image_data_index": 14,
        "bit_depth": 4,
    },
}

HIRAGANA_TO_LABEL = {
    "あ": "hiragana_a",
    "い": "hiragana_i",
    "う": "hiragana_u",
    "え": "hiragana_e",
    "お": "hiragana_o",
    "か": "hiragana_ka",
    "き": "hiragana_ki",
    "く": "hiragana_ku",
    "け": "hiragana_ke",
    "こ": "hiragana_ko",
    "さ": "hiragana_sa",
    "し": "hiragana_shi",
    "す": "hiragana_su",
    "せ": "hiragana_se",
    "そ": "hiragana_so",
    "た": "hiragana_ta",
    "ち": "hiragana_chi",
    "つ": "hiragana_tsu",
    "て": "hiragana_te",
    "と": "hiragana_to",
    "な": "hiragana_na",
    "に": "hiragana_ni",
    "ぬ": "hiragana_nu",
    "ね": "hiragana_ne",
    "の": "hiragana_no",
    "は": "hiragana_ha",
    "ひ": "hiragana_hi",
    "ふ": "hiragana_fu",
    "へ": "hiragana_he",
    "ほ": "hiragana_ho",
    "ま": "hiragana_ma",
    "み": "hiragana_mi",
    "む": "hiragana_mu",
    "め": "hiragana_me",
    "も": "hiragana_mo",
    "や": "hiragana_ya",
    "ゆ": "hiragana_yu",
    "よ": "hiragana_yo",
    "ら": "hiragana_ra",
    "り": "hiragana_ri",
    "る": "hiragana_ru",
    "れ": "hiragana_re",
    "ろ": "hiragana_ro",
    "わ": "hiragana_wa",
    "を": "hiragana_wo",
    "ん": "hiragana_n",
}

KATAKANA_TO_LABEL = {
    "ア": "katakana_a",
    "イ": "katakana_i",
    "ウ": "katakana_u",
    "エ": "katakana_e",
    "オ": "katakana_o",
    "カ": "katakana_ka",
    "キ": "katakana_ki",
    "ク": "katakana_ku",
    "ケ": "katakana_ke",
    "コ": "katakana_ko",
    "サ": "katakana_sa",
    "シ": "katakana_shi",
    "ス": "katakana_su",
    "セ": "katakana_se",
    "ソ": "katakana_so",
    "タ": "katakana_ta",
    "チ": "katakana_chi",
    "ツ": "katakana_tsu",
    "テ": "katakana_te",
    "ト": "katakana_to",
    "ナ": "katakana_na",
    "ニ": "katakana_ni",
    "ヌ": "katakana_nu",
    "ネ": "katakana_ne",
    "ノ": "katakana_no",
    "ハ": "katakana_ha",
    "ヒ": "katakana_hi",
    "フ": "katakana_fu",
    "ヘ": "katakana_he",
    "ホ": "katakana_ho",
    "マ": "katakana_ma",
    "ミ": "katakana_mi",
    "ム": "katakana_mu",
    "メ": "katakana_me",
    "モ": "katakana_mo",
    "ヤ": "katakana_ya",
    "ユ": "katakana_yu",
    "ヨ": "katakana_yo",
    "ラ": "katakana_ra",
    "リ": "katakana_ri",
    "ル": "katakana_ru",
    "レ": "katakana_re",
    "ロ": "katakana_ro",
    "ワ": "katakana_wa",
    "ヲ": "katakana_wo",
    "ン": "katakana_n",
}

CHAR_TO_LABEL = HIRAGANA_TO_LABEL | KATAKANA_TO_LABEL


class LinkExtractor(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._current_href: str | None = None
        self._current_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        href = dict(attrs).get("href")
        if href:
            self._current_href = href
            self._current_text = []

    def handle_data(self, data: str) -> None:
        if self._current_href:
            self._current_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a" or not self._current_href:
            return
        text = " ".join("".join(self._current_text).split())
        self.links.append((text, self._current_href))
        self._current_href = None
        self._current_text = []


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download and convert ETL Character Database Japanese handwriting datasets."
    )
    parser.add_argument(
        "--datasets",
        nargs="+",
        choices=sorted(DATASET_FORMATS),
        default=list(DEFAULT_DATASETS),
        help="ETL datasets to download/convert. ETL4/ETL7 are hiragana, ETL5 is katakana, ETL8G/ETL9G include Kanji.",
    )
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw/etl"))
    parser.add_argument("--output-dir", type=Path, default=Path("data/raw"))
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("data/processed/etl_kana_v1/manifest.csv"),
    )
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Convert files already present in --raw-dir without downloading.",
    )
    parser.add_argument(
        "--agree-to-terms",
        action="store_true",
        help="Required for download. Confirms you have read and accepted ETL terms.",
    )
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--limit-per-class", type=int, default=0)
    parser.add_argument(
        "--label-groups",
        nargs="+",
        choices=sorted(JAPANESE_CHARACTER_LABEL_GROUPS),
        help="Convert only selected project groups. Examples: kanji_n5, kanji_n4, kanji_n3, all_with_kanji_n3.",
    )
    parser.add_argument(
        "--labels",
        nargs="+",
        choices=JAPANESE_CHARACTER_LABELS,
        help="Convert only selected explicit labels, for example kanji_u4e00.",
    )
    parser.add_argument(
        "--flat",
        action="store_true",
        help="Use the old flat layout data/raw/<label> instead of data/raw/<group>/<label>.",
    )
    parser.add_argument(
        "--allow-insecure-ssl",
        action="store_true",
        help="Disable TLS certificate verification only when local Python CA certificates are broken.",
    )
    return parser.parse_args()


def build_ssl_context(allow_insecure_ssl: bool) -> ssl.SSLContext | None:
    if allow_insecure_ssl:
        return ssl._create_unverified_context()
    try:
        import certifi
    except ImportError:
        return None
    return ssl.create_default_context(cafile=certifi.where())


def read_url(url: str, ssl_context: ssl.SSLContext | None = None) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "japanese-handwriting-ai/0.1"})
    with urllib.request.urlopen(request, context=ssl_context) as response:
        return response.read().decode("utf-8", errors="replace")


def extract_links(html: str, base_url: str) -> list[tuple[str, str]]:
    parser = LinkExtractor()
    parser.feed(html)
    return [(text, urllib.parse.urljoin(base_url, href)) for text, href in parser.links]


def resolve_dataset_links(
    datasets: Iterable[str],
    ssl_context: ssl.SSLContext | None = None,
) -> dict[str, str]:
    download_page = read_url(ETL_DOWNLOAD_PAGE_URL, ssl_context=ssl_context)
    links = extract_links(download_page, ETL_DOWNLOAD_PAGE_URL)
    agree_link = next((href for text, href in links if "Agree to download" in text), None)
    if not agree_link:
        raise RuntimeError("Could not find the ETL agreement download link.")

    links_page = read_url(agree_link, ssl_context=ssl_context)
    dataset_links = extract_links(links_page, agree_link)
    resolved: dict[str, str] = {}
    for dataset in datasets:
        pattern = re.compile(rf"^{re.escape(dataset)}\b", re.IGNORECASE)
        match = next((href for text, href in dataset_links if pattern.search(text)), None)
        if not match:
            raise RuntimeError(f"Could not find download link for {dataset}.")
        resolved[dataset] = match
    return resolved


def filename_from_response(response: urllib.response.addinfourl, fallback: str) -> str:
    disposition = response.headers.get("Content-Disposition", "")
    match = re.search(r'filename="?([^";]+)"?', disposition)
    if match:
        return Path(match.group(1)).name
    parsed_name = Path(urllib.parse.urlparse(response.geturl()).path).name
    return parsed_name if parsed_name and "." in parsed_name else fallback


def download_file(
    url: str,
    target_dir: Path,
    fallback_name: str,
    ssl_context: ssl.SSLContext | None = None,
) -> Path:
    target_dir.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "japanese-handwriting-ai/0.1"})
    with urllib.request.urlopen(request, context=ssl_context) as response:
        filename = filename_from_response(response, fallback_name)
        target = target_dir / filename
        with target.open("wb") as file:
            shutil.copyfileobj(response, file)
    return target


def download_datasets(
    datasets: Iterable[str],
    raw_dir: Path,
    ssl_context: ssl.SSLContext | None = None,
) -> list[Path]:
    dataset_links = resolve_dataset_links(datasets, ssl_context=ssl_context)
    archives: list[Path] = []
    for dataset, url in dataset_links.items():
        existing = sorted(raw_dir.glob(f"{dataset}*.zip"))
        if existing:
            archives.append(existing[0])
            print(f"Using existing archive: {existing[0]}")
            continue
        archive = download_file(url, raw_dir, f"{dataset}.zip", ssl_context=ssl_context)
        archives.append(archive)
        print(f"Downloaded {dataset}: {archive}")
    return archives


def extracted_dataset_name(dataset: str) -> str:
    return dataset.rstrip("G") if dataset in {"ETL8G", "ETL9G"} else dataset


def extract_archives(archives: Iterable[Path], raw_dir: Path) -> None:
    for archive in archives:
        dataset_name = extracted_dataset_name(archive.stem.upper())
        extract_dir = raw_dir / dataset_name
        marker = extract_dir / ".extracted"
        if marker.exists():
            continue
        extract_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(archive) as zip_file:
            zip_file.extractall(extract_dir)
        marker.write_text("ok\n", encoding="utf-8")
        print(f"Extracted {archive} -> {extract_dir}")


def decode_jis_x_0201(char_code: int, is_hiragana: bool) -> str:
    try:
        char = bytes([char_code]).decode("shift_jis")
    except UnicodeDecodeError:
        return ""
    char = unicodedata.normalize("NFKC", char)
    if is_hiragana and "ァ" <= char <= "ヺ":
        char = chr(ord(char) - (ord("ァ") - ord("ぁ")))
    return char


def decode_jis_x_0208(jis_code: int) -> str:
    first = (jis_code >> 8) & 0xFF
    second = jis_code & 0xFF
    if not first or not second:
        return ""

    jis_payload = b"\x1b$B" + bytes([first, second]) + b"\x1b(B"
    for payload, encoding in (
        (jis_payload, "iso2022_jp"),
        (bytes([first | 0x80, second | 0x80]), "euc_jp"),
        (bytes([first, second]), "shift_jis"),
    ):
        try:
            return unicodedata.normalize("NFKC", payload.decode(encoding))
        except UnicodeDecodeError:
            continue
    return ""


def read_etl_record(file, config: dict) -> tuple[str, Image.Image]:
    from PIL import Image

    raw = file.read(config["record_size"])
    unpacked = struct.unpack(config["record_format"], raw)
    char_code = unpacked[config["char_code_index"]]
    image_data = unpacked[config["image_data_index"]]
    if config["format_name"] == "G-Type":
        char = decode_jis_x_0208(char_code)
    else:
        char = decode_jis_x_0201(char_code, config["is_hiragana"])
    image = Image.frombytes("F", config["resolution"], image_data, "bit", config["bit_depth"])
    image = image.convert("L")
    image = Image.eval(image, lambda pixel: 255 - pixel * 16)
    return char, image


def candidate_record_files(dataset_dir: Path, record_size: int) -> list[Path]:
    files: list[Path] = []
    for path in dataset_dir.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() in {".txt", ".csv", ".zip"}:
            continue
        if path.name.upper().endswith("INFO") or path.name == ".extracted":
            continue
        if path.stat().st_size >= record_size and path.stat().st_size % record_size == 0:
            files.append(path)
    return sorted(files)


def convert_dataset(
    dataset: str,
    raw_dir: Path,
    output_dir: Path,
    limit_per_class: int,
    overwrite: bool,
    flat: bool,
    included_labels: list[str],
) -> list[dict[str, str]]:
    config = DATASET_FORMATS[dataset]
    dataset_dir = raw_dir / extracted_dataset_name(dataset)
    if not dataset_dir.exists():
        raise FileNotFoundError(f"{dataset_dir} does not exist.")

    record_files = candidate_record_files(dataset_dir, config["record_size"])
    if not record_files:
        raise FileNotFoundError(f"No ETL record files found in {dataset_dir}.")

    rows: list[dict[str, str]] = []
    included_label_set = set(included_labels)
    char_to_label = {
        char: label
        for char, label in PROJECT_CHAR_TO_LABEL.items()
        if label in included_label_set
    }
    class_counts = {label: 0 for label in included_labels}
    global_record_index = 0

    for record_file in record_files:
        record_count = record_file.stat().st_size // config["record_size"]
        with record_file.open("rb") as file:
            for _ in range(record_count):
                char, image = read_etl_record(file, config)
                label = char_to_label.get(char)
                if not label:
                    global_record_index += 1
                    continue
                if limit_per_class and class_counts[label] >= limit_per_class:
                    global_record_index += 1
                    continue

                label_dir = raw_label_dir(output_dir, label, flat=flat)
                label_dir.mkdir(parents=True, exist_ok=True)
                image_name = f"{dataset.lower()}_{global_record_index:06d}.png"
                image_path = label_dir / image_name
                if overwrite or not image_path.exists():
                    image.save(image_path)

                class_counts[label] += 1
                rows.append(
                    {
                        "image_path": str(image_path.as_posix()),
                        "label": label,
                        "character": char,
                        "source": "etl",
                        "dataset": dataset,
                        "record_file": str(record_file.as_posix()),
                        "record_index": str(global_record_index),
                    }
                )
                global_record_index += 1
        print(f"Converted {record_count} records from {record_file}")

    kept = sum(class_counts.values())
    print(f"{dataset}: saved {kept} project-label images into {output_dir}")
    return rows


def write_manifest(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["image_path", "label", "character", "source", "dataset", "record_file", "record_index"]
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote manifest: {path}")


def main() -> None:
    args = parse_args()
    args.raw_dir.mkdir(parents=True, exist_ok=True)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    included_labels = args.labels or labels_for_groups(args.label_groups)

    if not args.skip_download:
        if not args.agree_to_terms:
            raise SystemExit(
                "Download requires --agree-to-terms after reading the ETL terms on the official site."
            )
        ssl_context = build_ssl_context(args.allow_insecure_ssl)
        archives = download_datasets(args.datasets, args.raw_dir, ssl_context=ssl_context)
        extract_archives(archives, args.raw_dir)

    rows: list[dict[str, str]] = []
    for dataset in args.datasets:
        rows.extend(
            convert_dataset(
                dataset=dataset,
                raw_dir=args.raw_dir,
                output_dir=args.output_dir,
                limit_per_class=args.limit_per_class,
                overwrite=args.overwrite,
                flat=args.flat,
                included_labels=included_labels,
            )
        )

    write_manifest(args.manifest, rows)


if __name__ == "__main__":
    main()
