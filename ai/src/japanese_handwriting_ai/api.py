from __future__ import annotations

import io
import os
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import HTMLResponse
from PIL import Image, UnidentifiedImageError
import torch

from japanese_handwriting_ai.labels import LABEL_TO_CHAR
from japanese_handwriting_ai.predict import load_checkpoint, predict_image
from japanese_handwriting_ai.text_ocr import extract_text_from_image

app = FastAPI(title="Japanese Handwriting AI Inference API")

def default_model_path() -> Path:
    configured = os.getenv("JAPANESE_HANDWRITING_MODEL_PATH")
    if configured:
        return Path(configured)
    for candidate in (
        Path("models/japanese_handwriting_kana_kanji_n3_v1.pt"),
        Path("models/japanese_handwriting_kana_kanji_n4_v1.pt"),
        Path("models/japanese_handwriting_kana_kanji_n5_v1.pt"),
    ):
        if candidate.exists():
            return candidate
    return Path("models/japanese_handwriting_kana_kanji_n3_v1.pt")


MODEL_PATH = default_model_path()
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_model: torch.nn.Module | None = None
_checkpoint: dict | None = None


INDEX_HTML = """<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Japanese Handwriting AI</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7fb;
      --surface: #ffffff;
      --text: #1d2433;
      --muted: #667085;
      --border: #d8dde8;
      --accent: #0f766e;
      --accent-dark: #115e59;
      --danger: #b42318;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: Arial, "Segoe UI", sans-serif;
    }
    main {
      width: min(980px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 28px 0;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 28px;
      line-height: 1.2;
    }
    .status {
      margin: 0 0 20px;
      color: var(--muted);
      font-size: 14px;
    }
    .tool {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 18px;
      align-items: start;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
    }
    .dropzone {
      min-height: 340px;
      border: 2px dashed var(--border);
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: #fbfcff;
      overflow: hidden;
      position: relative;
    }
    .dropzone.has-image {
      border-style: solid;
      background: #fff;
    }
    .dropzone input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
    .placeholder {
      text-align: center;
      color: var(--muted);
      padding: 24px;
    }
    .placeholder strong {
      display: block;
      color: var(--text);
      font-size: 18px;
      margin-bottom: 6px;
    }
    #preview {
      max-width: 100%;
      max-height: 520px;
      display: none;
      object-fit: contain;
    }
    .debug-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 3;
    }
    .debug-box {
      position: absolute;
      border: 2px solid #16a34a;
      background: rgba(22, 163, 74, 0.08);
    }
    .debug-box.skipped {
      border-color: #d97706;
      background: rgba(217, 119, 6, 0.10);
    }
    .debug-box.rejected {
      border-color: #dc2626;
      background: rgba(220, 38, 38, 0.08);
    }
    .debug-box-label {
      position: absolute;
      left: -2px;
      top: -18px;
      max-width: 96px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      background: rgba(29, 36, 51, 0.88);
      color: #fff;
      border-radius: 4px;
      padding: 2px 5px;
      font-size: 11px;
      line-height: 1.2;
      font-family: Arial, "Segoe UI", sans-serif;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 14px;
      align-items: center;
    }
    button {
      border: 0;
      background: var(--accent);
      color: #fff;
      border-radius: 8px;
      padding: 11px 16px;
      font-weight: 700;
      cursor: pointer;
    }
    button:disabled {
      background: #98a2b3;
      cursor: not-allowed;
    }
    button:hover:not(:disabled) {
      background: var(--accent-dark);
    }
    label.option {
      color: var(--muted);
      font-size: 14px;
      display: inline-flex;
      gap: 8px;
      align-items: center;
    }
    .confidence-control {
      color: var(--muted);
      font-size: 14px;
      display: inline-flex;
      gap: 8px;
      align-items: center;
    }
    .confidence-control input {
      width: 120px;
    }
    .result {
      min-height: 210px;
    }
    .character {
      font-size: 96px;
      line-height: 1;
      margin: 8px 0 4px;
      font-family: "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif;
    }
    .label {
      color: var(--muted);
      font-size: 14px;
      margin-bottom: 16px;
    }
    .confidence {
      font-size: 16px;
      margin-bottom: 18px;
    }
    .predictions {
      display: grid;
      gap: 9px;
    }
    .prediction-row {
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr) 58px;
      gap: 10px;
      align-items: center;
      font-size: 14px;
    }
    .prediction-char {
      font-size: 26px;
      text-align: center;
      font-family: "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif;
    }
    .bar {
      height: 8px;
      border-radius: 999px;
      background: #e7ebf3;
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      background: var(--accent);
      width: 0%;
    }
    .error {
      color: var(--danger);
      font-size: 14px;
      line-height: 1.45;
    }
    .text-output {
      white-space: pre-wrap;
      font-size: 28px;
      line-height: 1.6;
      font-family: "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif;
      word-break: break-word;
    }
    .meta {
      color: var(--muted);
      font-size: 13px;
      margin-top: 12px;
    }
    @media (max-width: 760px) {
      .tool { grid-template-columns: 1fr; }
      .dropzone { min-height: 260px; }
      .character { font-size: 80px; }
    }
  </style>
</head>
<body>
  <main>
    <h1>Japanese Handwriting AI</h1>
    <p class="status" id="status">Đang kiểm tra model...</p>

    <section class="tool">
      <div class="panel">
        <div class="dropzone" id="dropzone">
          <input id="file" type="file" accept="image/*" />
          <img id="preview" alt="Ảnh cần nhận diện" />
          <div id="debugOverlay" class="debug-overlay"></div>
          <div class="placeholder" id="placeholder">
            <strong>Chọn hoặc kéo ảnh vào đây</strong>
            Ảnh nên chứa một ký tự, một dòng hoặc một câu tiếng Nhật.
          </div>
        </div>
        <div class="controls">
          <button id="predict" disabled>Nhận diện ký tự</button>
          <button id="extract" disabled>Lấy câu</button>
          <label class="option"><input id="tta" type="checkbox" checked /> TTA cho ảnh thực tế</label>
          <label class="option"><input id="debugBoxes" type="checkbox" checked /> Box</label>
          <label class="confidence-control">
            Tin cậy
            <input id="confidence" type="range" min="0" max="0.95" step="0.05" value="0.35" />
            <span id="confidenceValue">35%</span>
          </label>
        </div>
      </div>

      <aside class="panel result" id="result">
        <div class="label">Kết quả sẽ hiển thị ở đây.</div>
      </aside>
    </section>
  </main>

  <script>
    const fileInput = document.getElementById("file");
    const dropzone = document.getElementById("dropzone");
    const preview = document.getElementById("preview");
    const placeholder = document.getElementById("placeholder");
    const predictButton = document.getElementById("predict");
    const extractButton = document.getElementById("extract");
    const result = document.getElementById("result");
    const statusText = document.getElementById("status");
    const ttaInput = document.getElementById("tta");
    const debugOverlay = document.getElementById("debugOverlay");
    const debugBoxesInput = document.getElementById("debugBoxes");
    const confidenceInput = document.getElementById("confidence");
    const confidenceValue = document.getElementById("confidenceValue");
    let selectedFile = null;
    let latestDebugBoxes = [];

    function percent(value) {
      return `${(value * 100).toFixed(2)}%`;
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function updateConfidenceLabel() {
      confidenceValue.textContent = percent(Number(confidenceInput.value));
    }

    function clearDebugBoxes() {
      latestDebugBoxes = [];
      debugOverlay.innerHTML = "";
    }

    function debugLabel(item) {
      if (item.status === "accepted") {
        return item.character || item.label || "";
      }
      if (item.status === "skipped") {
        return `? ${percent(item.confidence || 0)}`;
      }
      return item.reason || "noise";
    }

    function renderDebugBoxes() {
      debugOverlay.innerHTML = "";
      if (!debugBoxesInput.checked || !preview.naturalWidth || latestDebugBoxes.length === 0) {
        return;
      }

      const imageRect = preview.getBoundingClientRect();
      const zoneRect = dropzone.getBoundingClientRect();
      const scaleX = imageRect.width / preview.naturalWidth;
      const scaleY = imageRect.height / preview.naturalHeight;
      const offsetX = imageRect.left - zoneRect.left;
      const offsetY = imageRect.top - zoneRect.top;

      latestDebugBoxes.forEach((item) => {
        const box = item.box || [];
        if (box.length !== 4) return;
        const element = document.createElement("div");
        element.className = `debug-box ${item.status || ""}`;
        element.style.left = `${offsetX + box[0] * scaleX}px`;
        element.style.top = `${offsetY + box[1] * scaleY}px`;
        element.style.width = `${Math.max(2, (box[2] - box[0]) * scaleX)}px`;
        element.style.height = `${Math.max(2, (box[3] - box[1]) * scaleY)}px`;
        element.title = `${item.status || "box"} · ${item.reason || ""} · ${item.label || ""}`;

        const label = document.createElement("div");
        label.className = "debug-box-label";
        label.textContent = debugLabel(item);
        element.appendChild(label);
        debugOverlay.appendChild(element);
      });
    }

    async function loadHealth() {
      try {
        const response = await fetch("/health");
        const health = await response.json();
        statusText.textContent = health.model_loaded
          ? `Model loaded: ${health.model_path} (${health.device})`
          : `Model chưa được load: ${health.model_path}`;
      } catch {
        statusText.textContent = "Không kiểm tra được trạng thái API.";
      }
    }

    function setFile(file) {
      selectedFile = file;
      predictButton.disabled = !file;
      extractButton.disabled = !file;
      if (!file) return;

      const url = URL.createObjectURL(file);
      preview.src = url;
      preview.style.display = "block";
      placeholder.style.display = "none";
      dropzone.classList.add("has-image");
      result.innerHTML = '<div class="label">Sẵn sàng nhận diện.</div>';
      clearDebugBoxes();
    }

    preview.addEventListener("load", renderDebugBoxes);
    debugBoxesInput.addEventListener("change", renderDebugBoxes);
    confidenceInput.addEventListener("input", updateConfidenceLabel);
    window.addEventListener("resize", renderDebugBoxes);

    fileInput.addEventListener("change", (event) => {
      setFile(event.target.files[0]);
    });

    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) setFile(file);
    });

    predictButton.addEventListener("click", async () => {
      if (!selectedFile) return;
      predictButton.disabled = true;
      extractButton.disabled = true;
      result.innerHTML = '<div class="label">Đang nhận diện...</div>';
      clearDebugBoxes();

      const formData = new FormData();
      formData.append("file", selectedFile);
      const tta = ttaInput.checked ? "true" : "false";

      try {
        const response = await fetch(`/predict?top_k=5&tta=${tta}`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Predict failed.");
        }

        const rows = data.predictions.map((item) => `
          <div class="prediction-row">
            <div class="prediction-char">${item.character}</div>
            <div class="bar"><span style="width:${Math.max(item.confidence * 100, 2)}%"></span></div>
            <div>${percent(item.confidence)}</div>
          </div>
        `).join("");

        result.innerHTML = `
          <div class="label">Dự đoán</div>
          <div class="character">${data.character}</div>
          <div class="label">${data.label}</div>
          <div class="confidence">Độ tin cậy: <strong>${percent(data.confidence)}</strong></div>
          <div class="predictions">${rows}</div>
        `;
      } catch (error) {
        result.innerHTML = `<div class="error">${error.message}</div>`;
      } finally {
        predictButton.disabled = false;
        extractButton.disabled = false;
      }
    });

    extractButton.addEventListener("click", async () => {
      if (!selectedFile) return;
      predictButton.disabled = true;
      extractButton.disabled = true;
      result.innerHTML = '<div class="label">Đang trích xuất câu...</div>';

      const formData = new FormData();
      formData.append("file", selectedFile);
      const tta = ttaInput.checked ? "true" : "false";
      const minConfidence = confidenceInput.value;

      try {
        const response = await fetch(`/predict/text?top_k=3&tta=${tta}&min_confidence=${minConfidence}`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Extract failed.");
        }
        latestDebugBoxes = data.debug_boxes || [];
        renderDebugBoxes();

        result.innerHTML = `
          <div class="label">Câu trích xuất</div>
          <div class="text-output">${escapeHtml(data.text || "(không tìm thấy ký tự)")}</div>
          <div class="meta">Dòng: ${data.line_count} · Ký tự: ${data.character_count} · Bỏ qua: ${data.skipped_count || 0} · Lọc nhiễu: ${data.rejected_count || 0} · Tin cậy TB: ${percent(data.average_confidence || 0)}</div>
        `;
      } catch (error) {
        result.innerHTML = `<div class="error">${error.message}</div>`;
      } finally {
        predictButton.disabled = false;
        extractButton.disabled = false;
      }
    });

    updateConfidenceLabel();
    loadHealth();
  </script>
</body>
</html>
"""


@app.on_event("startup")
def load_model() -> None:
    global _model, _checkpoint
    if MODEL_PATH.exists():
        _model, _checkpoint = load_checkpoint(MODEL_PATH, DEVICE)


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {
        "ok": True,
        "model_loaded": _model is not None,
        "model_path": str(MODEL_PATH),
        "device": str(DEVICE),
    }


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return INDEX_HTML


@app.post("/predict")
async def predict(file: UploadFile = File(...), top_k: int = 5, tta: bool = True) -> dict:
    if _model is None or _checkpoint is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model is not loaded. Train a model or set JAPANESE_HANDWRITING_MODEL_PATH. Current path: {MODEL_PATH}",
        )

    content = await file.read()
    try:
        image = Image.open(io.BytesIO(content))
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.") from exc

    predictions = predict_image(_model, _checkpoint, image, top_k=top_k, device=DEVICE, tta=tta)
    enriched_predictions = [
        {
            "label": prediction["label"],
            "character": LABEL_TO_CHAR.get(str(prediction["label"]), str(prediction["label"])),
            "confidence": prediction["confidence"],
        }
        for prediction in predictions
    ]
    best = predictions[0]
    return {
        "label": best["label"],
        "character": LABEL_TO_CHAR.get(str(best["label"]), str(best["label"])),
        "confidence": best["confidence"],
        "predictions": enriched_predictions,
    }


@app.post("/predict/text")
async def predict_text(
    file: UploadFile = File(...),
    top_k: int = 3,
    tta: bool = False,
    min_confidence: float = Query(0.35, ge=0.0, le=1.0),
) -> dict:
    if _model is None or _checkpoint is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model is not loaded. Train a model or set JAPANESE_HANDWRITING_MODEL_PATH. Current path: {MODEL_PATH}",
        )

    content = await file.read()
    try:
        image = Image.open(io.BytesIO(content))
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.") from exc

    return extract_text_from_image(
        _model,
        _checkpoint,
        image,
        top_k=top_k,
        device=DEVICE,
        tta=tta,
        min_confidence=min_confidence,
    )
