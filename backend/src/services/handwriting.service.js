const { createHttpError } = require('../utils/http-error');

const DEFAULT_HANDWRITING_AI_BASE_URL = 'http://127.0.0.1:8001';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30000;
const TEXT_TOP_K = 5;
const TEXT_MIN_CONFIDENCE = 0.35;
const TEXT_TTA = true;
const IMAGE_DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/;

function getHandwritingAiBaseUrl() {
  return process.env.HANDWRITING_AI_BASE_URL || DEFAULT_HANDWRITING_AI_BASE_URL;
}

function parseImageDataUrl(imageDataUrl) {
  if (typeof imageDataUrl !== 'string') {
    throw createHttpError(400, 'Vui lòng gửi ảnh chữ viết tay.');
  }

  const match = imageDataUrl.match(IMAGE_DATA_URL_PATTERN);
  if (!match) {
    throw createHttpError(400, 'Ảnh chữ viết tay không đúng định dạng.');
  }

  const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length === 0) {
    throw createHttpError(400, 'Ảnh chữ viết tay đang trống.');
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw createHttpError(400, 'Ảnh chữ viết tay quá lớn. Vui lòng dùng ảnh dưới 4MB.');
  }

  return {
    buffer,
    mimeType,
  };
}

async function parseAiResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return {
    detail: await response.text(),
  };
}

async function requestHandwritingAi(path, image, queryParams) {
  const url = new URL(path, getHandwritingAiBaseUrl());

  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, String(value));
  }

  const formData = new FormData();
  const imageBlob = new Blob([image.buffer], { type: image.mimeType });
  formData.append('file', imageBlob, 'handwriting.png');

  let response;

  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw createHttpError(
      503,
      'Chưa kết nối được Japanese Handwriting AI. Vui lòng bật service AI ở port 8001.',
    );
  }

  const data = await parseAiResponse(response);

  if (!response.ok) {
    throw createHttpError(
      response.status === 503 ? 503 : 502,
      data.detail || 'Japanese Handwriting AI không xử lý được ảnh này.',
    );
  }

  return data;
}

async function getHandwritingHealth() {
  const url = new URL('/health', getHandwritingAiBaseUrl());

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await parseAiResponse(response);

    return {
      connected: response.ok,
      ...data,
    };
  } catch {
    return {
      connected: false,
      ok: false,
      modelLoaded: false,
      message: 'Chưa kết nối được Japanese Handwriting AI.',
    };
  }
}

async function predictHandwriting(payload) {
  const image = parseImageDataUrl(payload?.imageDataUrl);

  return requestHandwritingAi('/predict/text', image, {
    top_k: TEXT_TOP_K,
    tta: TEXT_TTA,
    min_confidence: TEXT_MIN_CONFIDENCE,
  });
}

module.exports = {
  getHandwritingHealth,
  predictHandwriting,
};
