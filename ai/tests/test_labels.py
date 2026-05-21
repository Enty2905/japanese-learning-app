from pathlib import Path

from japanese_handwriting_ai.labels import (
    JAPANESE_CHARACTER_LABELS,
    KANJI_N3_CHARS,
    KANJI_N3_LABELS,
    KANJI_N3_SOURCE_CHARS,
    KANJI_N4_CHARS,
    KANJI_N4_LABELS,
    KANJI_N4_SOURCE_CHARS,
    KANJI_N5_CHARS,
    LABEL_TO_CHAR,
    LABEL_TO_RAW_GROUP,
    labels_for_groups,
    raw_label_dir,
)


def test_n4_label_set_is_stable_and_deduped_against_n5() -> None:
    assert len(KANJI_N4_SOURCE_CHARS) == 162
    assert len(set(KANJI_N4_SOURCE_CHARS)) == 162
    assert len(KANJI_N4_CHARS) == 141
    assert len(KANJI_N4_LABELS) == 141
    assert set(KANJI_N4_CHARS).isdisjoint(KANJI_N5_CHARS)


def test_n4_labels_use_n4_raw_group() -> None:
    assert LABEL_TO_CHAR["kanji_u529b"] == "力"
    assert LABEL_TO_RAW_GROUP["kanji_u529b"] == "n4"
    assert raw_label_dir(Path("data/raw"), "kanji_u529b") == Path("data/raw/n4/kanji_u529b")


def test_beginner_kanji_groups_keep_unique_labels() -> None:
    n4_only = labels_for_groups(["kanji_n4"])
    n5_and_n4 = labels_for_groups(["kanji_n4_with_n5"])
    all_with_n4 = labels_for_groups(["all_with_kanji_n4"])

    assert len(n4_only) == 141
    assert len(n5_and_n4) == 244
    assert len(all_with_n4) == 336
    assert len(JAPANESE_CHARACTER_LABELS) == len(set(JAPANESE_CHARACTER_LABELS))
    assert n4_only == KANJI_N4_LABELS


def test_n3_label_set_is_stable_and_deduped_against_n5_n4() -> None:
    assert len(KANJI_N3_SOURCE_CHARS) == 370
    assert len(set(KANJI_N3_SOURCE_CHARS)) == 370
    assert len(KANJI_N3_CHARS) == 368
    assert len(KANJI_N3_LABELS) == 368
    assert set(KANJI_N3_CHARS).isdisjoint(KANJI_N5_CHARS)
    assert set(KANJI_N3_CHARS).isdisjoint(KANJI_N4_CHARS)


def test_n3_labels_use_n3_raw_group() -> None:
    assert LABEL_TO_CHAR["kanji_u653f"] == "政"
    assert LABEL_TO_RAW_GROUP["kanji_u653f"] == "n3"
    assert raw_label_dir(Path("data/raw"), "kanji_u653f") == Path("data/raw/n3/kanji_u653f")


def test_n3_groups_keep_unique_labels() -> None:
    n3_only = labels_for_groups(["kanji_n3"])
    n5_n4_n3 = labels_for_groups(["kanji_n5_n4_n3"])
    all_with_n3 = labels_for_groups(["all_with_kanji_n3"])

    assert len(n3_only) == 368
    assert len(n5_n4_n3) == 612
    assert len(all_with_n3) == 704
    assert n3_only == KANJI_N3_LABELS
