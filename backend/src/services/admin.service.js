const {
  countAdminContentItems,
  countAdminUsers,
  createAdminContentItem,
  deleteAdminContentItem,
  findAdminUsers,
  findAdminContentItems,
  getAdminSummary,
  getRecentUsers,
  getUserRoleCounts,
  getUserStatusCounts,
  updateAdminContentItem,
  updateAdminUser,
} = require('../models/admin.model');
const { createHttpError } = require('../utils/http-error');

const CONTENT_TYPES = new Set(['vocabulary', 'kanji', 'grammar']);
const JLPT_LEVELS = new Set(['N5', 'N4', 'N3', 'N2', 'N1']);
const USER_ROLES = new Set(['student', 'teacher', 'admin']);
const USER_STATUSES = new Set(['active', 'inactive', 'banned']);
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 30;
const RECENT_USER_LIMIT = 6;

function normalizeInteger(value, fallback) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function normalizePage(value) {
  return normalizeInteger(value, DEFAULT_PAGE);
}

function normalizeLimit(value) {
  return Math.min(normalizeInteger(value, DEFAULT_LIMIT), MAX_LIMIT);
}

function normalizeSearch(value) {
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

function hasOwn(payload, key) {
  return Object.prototype.hasOwnProperty.call(payload || {}, key);
}

function normalizeOptionalValue(value, allowedValues, message) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return '';
  }

  if (!allowedValues.has(value)) {
    throw createHttpError(400, message);
  }

  return value;
}

function normalizeContentType(value) {
  if (!CONTENT_TYPES.has(value)) {
    throw createHttpError(400, 'Loại nội dung không hợp lệ.');
  }

  return value;
}

function normalizeJlptLevel(value) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return '';
  }

  const normalizedValue = String(value).trim().toUpperCase();
  if (!JLPT_LEVELS.has(normalizedValue)) {
    throw createHttpError(400, 'Cấp độ JLPT không hợp lệ.');
  }

  return normalizedValue;
}

function normalizeOptionalText(value, maxLength = 1000) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue ? normalizedValue.slice(0, maxLength) : null;
}

function normalizeRequiredText(value, fieldLabel, maxLength = 1000) {
  const normalizedValue = normalizeOptionalText(value, maxLength);

  if (!normalizedValue) {
    throw createHttpError(400, `Vui lòng nhập ${fieldLabel}.`);
  }

  return normalizedValue;
}

function normalizePositiveInteger(value, fieldLabel) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw createHttpError(400, `${fieldLabel} phải là số nguyên dương.`);
  }

  return parsedValue;
}

function normalizeTags(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const tags = Array.isArray(value) ? value : String(value).split(',');
  const normalizedTags = tags
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, 12);

  return normalizedTags.length > 0 ? normalizedTags : null;
}

function normalizeUserId(value) {
  const userId = Number(value);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createHttpError(400, 'Người dùng không hợp lệ.');
  }

  return userId;
}

function normalizeContentItemId(value) {
  const itemId = Number(value);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw createHttpError(400, 'Nội dung không hợp lệ.');
  }

  return itemId;
}

function addNormalizedTextField(result, payload, key, maxLength) {
  if (hasOwn(payload, key)) {
    result[key] = normalizeOptionalText(payload[key], maxLength);
  }
}

function addNormalizedJlptField(result, payload) {
  if (hasOwn(payload, 'jlptLevel')) {
    result.jlptLevel = normalizeJlptLevel(payload.jlptLevel) || null;
  }
}

function normalizeVocabularyPayload(payload, isCreate) {
  const result = {};

  if (isCreate || hasOwn(payload, 'word')) {
    result.word = normalizeRequiredText(payload?.word, 'từ vựng', 255);
  }

  if (isCreate || hasOwn(payload, 'meaningVi')) {
    result.meaningVi = normalizeRequiredText(payload?.meaningVi, 'nghĩa tiếng Việt');
  }

  addNormalizedTextField(result, payload, 'kana', 255);
  addNormalizedTextField(result, payload, 'romaji', 255);
  addNormalizedTextField(result, payload, 'meaningEn');
  addNormalizedTextField(result, payload, 'wordType', 50);
  addNormalizedTextField(result, payload, 'accent', 50);
  addNormalizedTextField(result, payload, 'audioUrl');
  addNormalizedTextField(result, payload, 'imageUrl');
  addNormalizedTextField(result, payload, 'notes');
  addNormalizedJlptField(result, payload);

  if (hasOwn(payload, 'lessonNumber')) {
    result.lessonNumber = normalizePositiveInteger(payload.lessonNumber, 'Số bài học');
  }

  if (hasOwn(payload, 'tags')) {
    result.tags = normalizeTags(payload.tags);
  }

  return result;
}

function normalizeKanjiPayload(payload, isCreate) {
  const result = {};

  if (isCreate || hasOwn(payload, 'kanji')) {
    result.kanji = normalizeRequiredText(payload?.kanji, 'kanji', 10);
  }

  if (isCreate || hasOwn(payload, 'meaningVi')) {
    result.meaningVi = normalizeRequiredText(payload?.meaningVi, 'nghĩa tiếng Việt');
  }

  addNormalizedTextField(result, payload, 'onyomi');
  addNormalizedTextField(result, payload, 'kunyomi');
  addNormalizedTextField(result, payload, 'meaningEn');
  addNormalizedTextField(result, payload, 'radical', 50);
  addNormalizedTextField(result, payload, 'unicodeCode', 20);
  addNormalizedTextField(result, payload, 'writingSvgUrl');
  addNormalizedTextField(result, payload, 'hanViet', 100);
  addNormalizedTextField(result, payload, 'mnemonic');
  addNormalizedJlptField(result, payload);

  if (hasOwn(payload, 'strokeCount')) {
    result.strokeCount = normalizePositiveInteger(payload.strokeCount, 'Số nét');
  }

  return result;
}

function normalizeGrammarPayload(payload, isCreate) {
  const result = {};

  if (isCreate || hasOwn(payload, 'pattern')) {
    result.pattern = normalizeRequiredText(payload?.pattern, 'mẫu ngữ pháp', 255);
  }

  if (isCreate || hasOwn(payload, 'meaningVi')) {
    result.meaningVi = normalizeRequiredText(payload?.meaningVi, 'nghĩa tiếng Việt');
  }

  addNormalizedTextField(result, payload, 'title', 255);
  addNormalizedTextField(result, payload, 'formation');
  addNormalizedTextField(result, payload, 'explanation');
  addNormalizedTextField(result, payload, 'usageNote');
  addNormalizedTextField(result, payload, 'restriction');
  addNormalizedTextField(result, payload, 'nuance');
  addNormalizedJlptField(result, payload);

  if (isCreate || hasOwn(payload, 'lessonNumber')) {
    result.lessonNumber = normalizePositiveInteger(payload?.lessonNumber, 'Số bài học');
  }

  if (hasOwn(payload, 'position')) {
    result.position = normalizePositiveInteger(payload.position, 'Thứ tự ngữ pháp');
  }

  if (isCreate && !result.jlptLevel) {
    throw createHttpError(400, 'Vui lòng chọn JLPT để gắn ngữ pháp vào bài học.');
  }

  if (isCreate && !result.lessonNumber) {
    throw createHttpError(400, 'Vui lòng nhập bài học cho ngữ pháp.');
  }

  if (result.lessonNumber && !result.jlptLevel && !isCreate) {
    throw createHttpError(400, 'Vui lòng chọn JLPT khi đổi bài học của ngữ pháp.');
  }

  return result;
}

function normalizeContentPayload(contentType, payload, isCreate) {
  if (contentType === 'vocabulary') {
    return normalizeVocabularyPayload(payload, isCreate);
  }

  if (contentType === 'kanji') {
    return normalizeKanjiPayload(payload, isCreate);
  }

  return normalizeGrammarPayload(payload, isCreate);
}

async function getAdminOverview() {
  const [summary, roleCounts, statusCounts, recentUsers] = await Promise.all([
    getAdminSummary(),
    getUserRoleCounts(),
    getUserStatusCounts(),
    getRecentUsers(RECENT_USER_LIMIT),
  ]);

  return {
    summary,
    roleCounts,
    statusCounts,
    recentUsers,
  };
}

async function getAdminContentItems(contentTypeInput, query) {
  const contentType = normalizeContentType(contentTypeInput);
  const page = normalizePage(query.page);
  const limit = normalizeLimit(query.limit);
  const filters = {
    search: normalizeSearch(query.search),
    jlptLevel: normalizeJlptLevel(query.jlptLevel),
  };
  const offset = (page - 1) * limit;
  const [items, total] = await Promise.all([
    findAdminContentItems({
      contentType,
      ...filters,
      limit,
      offset,
    }),
    countAdminContentItems(contentType, filters),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function getAdminUsers(query) {
  const page = normalizePage(query.page);
  const limit = normalizeLimit(query.limit);
  const filters = {
    search: normalizeSearch(query.search),
    role: normalizeOptionalValue(query.role, USER_ROLES, 'Vai trò người dùng không hợp lệ.'),
    status: normalizeOptionalValue(
      query.status,
      USER_STATUSES,
      'Trạng thái người dùng không hợp lệ.',
    ),
  };
  const offset = (page - 1) * limit;
  const [users, total] = await Promise.all([
    findAdminUsers({
      ...filters,
      limit,
      offset,
    }),
    countAdminUsers(filters),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function createContentByAdmin(contentTypeInput, payload) {
  const contentType = normalizeContentType(contentTypeInput);
  const fields = normalizeContentPayload(contentType, payload, true);

  return createAdminContentItem(contentType, fields);
}

async function updateContentByAdmin(contentTypeInput, itemIdInput, payload) {
  const contentType = normalizeContentType(contentTypeInput);
  const itemId = normalizeContentItemId(itemIdInput);
  const fields = normalizeContentPayload(contentType, payload, false);

  if (Object.keys(fields).length === 0) {
    throw createHttpError(400, 'Vui lòng chọn thông tin cần cập nhật.');
  }

  const item = await updateAdminContentItem(contentType, itemId, fields);

  if (!item) {
    throw createHttpError(404, 'Không tìm thấy nội dung.');
  }

  return item;
}

async function deleteContentByAdmin(contentTypeInput, itemIdInput) {
  const contentType = normalizeContentType(contentTypeInput);
  const itemId = normalizeContentItemId(itemIdInput);
  const deletedItem = await deleteAdminContentItem(contentType, itemId);

  if (!deletedItem) {
    throw createHttpError(404, 'Không tìm thấy nội dung.');
  }
}

async function updateUserByAdmin(adminUserId, targetUserIdInput, payload) {
  const targetUserId = normalizeUserId(targetUserIdInput);
  const role = normalizeOptionalValue(payload?.role, USER_ROLES, 'Vai trò người dùng không hợp lệ.');
  const status = normalizeOptionalValue(
    payload?.status,
    USER_STATUSES,
    'Trạng thái người dùng không hợp lệ.',
  );

  if (!role && !status) {
    throw createHttpError(400, 'Vui lòng chọn thông tin cần cập nhật.');
  }

  if (targetUserId === Number(adminUserId) && role && role !== 'admin') {
    throw createHttpError(400, 'Không thể gỡ quyền admin của chính tài khoản đang dùng.');
  }

  if (targetUserId === Number(adminUserId) && status && status !== 'active') {
    throw createHttpError(400, 'Không thể khóa tài khoản admin đang dùng.');
  }

  const user = await updateAdminUser(targetUserId, {
    role,
    status,
  });

  if (!user) {
    throw createHttpError(404, 'Không tìm thấy người dùng.');
  }

  return user;
}

module.exports = {
  createContentByAdmin,
  deleteContentByAdmin,
  getAdminContentItems,
  getAdminOverview,
  getAdminUsers,
  updateContentByAdmin,
  updateUserByAdmin,
};
