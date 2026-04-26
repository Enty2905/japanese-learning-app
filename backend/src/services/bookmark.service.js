const {
  createBookmark,
  deleteBookmarkById,
  listBookmarks,
} = require('../models/bookmark.model');
const { createHttpError } = require('../utils/http-error');

const BOOKMARK_ITEM_TYPE_MAP = {
  lesson: 'lessonId',
  vocabulary: 'vocabularyId',
  kanji: 'kanjiId',
  grammar: 'grammarPointId',
};

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createHttpError(400, `${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function buildBookmarkReference(itemType, itemId) {
  const normalizedItemType = typeof itemType === 'string' ? itemType.trim().toLowerCase() : '';
  const referenceKey = BOOKMARK_ITEM_TYPE_MAP[normalizedItemType];

  if (!referenceKey) {
    throw createHttpError(400, 'itemType must be one of: lesson, vocabulary, kanji, grammar.');
  }

  const parsedItemId = parsePositiveInteger(itemId, 'itemId');

  return {
    lessonId: null,
    vocabularyId: null,
    kanjiId: null,
    grammarPointId: null,
    [referenceKey]: parsedItemId,
    normalizedItemType,
  };
}

function toBookmarkResponse(row) {
  const details = row.details || {};

  return {
    id: row.id,
    itemType: details.itemType || '',
    itemId: details.itemId || null,
    title: details.title || '',
    note: details.note || '',
    lessonId: row.lessonId,
    vocabularyId: row.vocabularyId,
    kanjiId: row.kanjiId,
    grammarPointId: row.grammarPointId,
    createdAt: row.createdAt,
  };
}

async function getMyBookmarks(userId) {
  const bookmarkRows = await listBookmarks(userId);
  return bookmarkRows.map(toBookmarkResponse);
}

async function addBookmark(userId, payload) {
  const { itemType, itemId, title, note } = payload || {};

  const { lessonId, vocabularyId, kanjiId, grammarPointId, normalizedItemType } =
    buildBookmarkReference(itemType, itemId);

  const bookmarkRow = await createBookmark({
    userId,
    lessonId,
    vocabularyId,
    kanjiId,
    grammarPointId,
    details: {
      itemType: normalizedItemType,
      itemId: Number(itemId),
      title: typeof title === 'string' ? title.trim() : '',
      note: typeof note === 'string' ? note.trim() : '',
    },
  });

  return toBookmarkResponse(bookmarkRow);
}

async function removeBookmark(userId, bookmarkIdInput) {
  const bookmarkId = parsePositiveInteger(bookmarkIdInput, 'bookmarkId');
  const deletedRow = await deleteBookmarkById(userId, bookmarkId);

  if (!deletedRow) {
    throw createHttpError(404, 'Bookmark not found.');
  }
}

module.exports = {
  getMyBookmarks,
  addBookmark,
  removeBookmark,
};
