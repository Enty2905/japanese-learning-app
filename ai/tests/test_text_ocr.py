from PIL import Image, ImageDraw

from japanese_handwriting_ai import text_ocr
from japanese_handwriting_ai.text_ocr import extract_text_from_image
from japanese_handwriting_ai.text_ocr import segment_text_image


def test_segmentation_ignores_tiny_trailing_dot_noise() -> None:
    image = Image.new("L", (260, 90), color=255)
    draw = ImageDraw.Draw(image)

    x = 25
    for _ in range(5):
        draw.rectangle((x, 28, x + 13, 62), fill=0)
        x += 32
    draw.ellipse((190, 58, 193, 61), fill=0)

    lines = segment_text_image(image)

    assert len(lines) == 1
    assert len(lines[0]) == 5


def test_segmentation_marks_horizontal_punctuation_dash() -> None:
    image = Image.new("L", (180, 90), color=255)
    draw = ImageDraw.Draw(image)
    draw.rectangle((35, 25, 65, 65), fill=0)
    draw.line((95, 45, 145, 45), fill=0, width=4)

    lines = segment_text_image(image)

    assert len(lines) == 1
    assert any(box.punctuation == "ー" for box in lines[0])


def test_extract_text_skips_low_confidence_candidates(monkeypatch) -> None:
    image = Image.new("L", (120, 90), color=255)
    draw = ImageDraw.Draw(image)
    draw.rectangle((35, 25, 70, 65), fill=0)

    def fake_predict_image(*args, **kwargs):
        return [{"label": "hiragana_a", "confidence": 0.20}]

    monkeypatch.setattr(text_ocr, "predict_image", fake_predict_image)
    result = extract_text_from_image(
        model=object(),
        checkpoint={"classes": ["hiragana_a"]},
        image=image,
        min_confidence=0.35,
    )

    assert result["text"] == ""
    assert result["character_count"] == 0
    assert result["skipped_count"] == 1
    assert result["debug_boxes"][0]["status"] == "skipped"
