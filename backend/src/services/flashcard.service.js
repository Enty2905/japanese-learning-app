const {
  createFlashcardSet,
  deleteFlashcardSet,
  findFlashcardsForReview,
  findFlashcardSetById,
  listFlashcardSets,
  listFlashcardsBySetId,
} = require('../models/flashcard.model');
const {
  createLearningLog,
  saveVocabularyReviewResults,
} = require('../models/progress.model');
const { pool } = require('../config/db');
const { createHttpError } = require('../utils/http-error');

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_FRONT_LENGTH = 255;
const MAX_BACK_LENGTH = 2000;
const MAX_SET_CARDS = 200;
const MAX_REVIEW_CARDS = 200;
const FIELD_LABELS = {
  cardId: 'Ma flashcard',
  setId: 'Mã bộ flashcard',
  title: 'Tên bộ flashcard',
  description: 'Mô tả',
  frontText: 'Mặt trước',
  backText: 'Mặt sau',
};

function getFieldLabel(fieldName) {
  return FIELD_LABELS[fieldName] || fieldName;
}

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createHttpError(400, `${getFieldLabel(fieldName)} phải là số nguyên dương.`);
  }

  return parsed;
}

function normalizeRequiredText(value, fieldName, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (!text) {
    throw createHttpError(400, `${getFieldLabel(fieldName)} là bắt buộc.`);
  }

  if (text.length > maxLength) {
    throw createHttpError(400, `${getFieldLabel(fieldName)} quá dài.`);
  }

  return text;
}

function normalizeOptionalText(value, fieldName, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (text.length > maxLength) {
    throw createHttpError(400, `${getFieldLabel(fieldName)} quá dài.`);
  }

  return text || null;
}

function normalizeCards(payload) {
  const rawCards = Array.isArray(payload?.cards) ? payload.cards : [];

  if (rawCards.length === 0) {
    throw createHttpError(400, 'Cần ít nhất một flashcard.');
  }

  if (rawCards.length > MAX_SET_CARDS) {
    throw createHttpError(400, `Một bộ chỉ có thể chứa tối đa ${MAX_SET_CARDS} flashcard.`);
  }

  return rawCards.map((card) => ({
    frontText: normalizeRequiredText(card?.frontText, 'frontText', MAX_FRONT_LENGTH),
    backText: normalizeRequiredText(card?.backText, 'backText', MAX_BACK_LENGTH),
  }));
}

function normalizeReviewResults(payload) {
  const rawResults = Array.isArray(payload?.results) ? payload.results : [];

  if (rawResults.length === 0) {
    throw createHttpError(400, 'Can it nhat mot ket qua on tap.');
  }

  if (rawResults.length > MAX_REVIEW_CARDS) {
    throw createHttpError(400, `Chi co the luu toi da ${MAX_REVIEW_CARDS} ket qua on tap.`);
  }

  const resultsByCardId = new Map();

  for (const result of rawResults) {
    const cardId = parsePositiveInteger(result?.cardId, 'cardId');
    resultsByCardId.set(cardId, {
      cardId,
      isCorrect: Boolean(result?.isCorrect),
    });
  }

  return [...resultsByCardId.values()];
}

function toFlashcardResponse(row) {
  return {
    id: row.id,
    setId: row.setId,
    vocabularyId: row.vocabularyId || null,
    frontText: row.frontText,
    backText: row.backText,
    masteryLevel: row.masteryLevel ?? null,
    nextReviewAt: row.nextReviewAt || null,
    correctCount: row.correctCount ?? 0,
    wrongCount: row.wrongCount ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toFlashcardSetResponse(row, cards = null) {
  const response = {
    id: row.id,
    title: row.title,
    description: row.description || '',
    cardCount: row.cardCount || 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  if (cards) {
    response.cards = cards.map(toFlashcardResponse);
    response.cardCount = response.cards.length;
  }

  return response;
}

async function getMyFlashcardSets(userId) {
  const rows = await listFlashcardSets(userId);
  return rows.map((row) => toFlashcardSetResponse(row));
}

async function getMyFlashcardSet(userId, setIdInput) {
  const setId = parsePositiveInteger(setIdInput, 'setId');
  const flashcardSet = await findFlashcardSetById(userId, setId);

  if (!flashcardSet) {
    throw createHttpError(404, 'Không tìm thấy bộ flashcard.');
  }

  const cards = await listFlashcardsBySetId(userId, setId);
  return toFlashcardSetResponse(flashcardSet, cards);
}

async function addMyFlashcardSet(userId, payload) {
  const title = normalizeRequiredText(payload?.title, 'title', MAX_TITLE_LENGTH);
  const description = normalizeOptionalText(payload?.description, 'description', MAX_DESCRIPTION_LENGTH);
  const cards = normalizeCards(payload);
  const createdSet = await createFlashcardSet({
    userId,
    title,
    description,
    cards,
  });

  return toFlashcardSetResponse(createdSet, createdSet.cards);
}

async function removeMyFlashcardSet(userId, setIdInput) {
  const setId = parsePositiveInteger(setIdInput, 'setId');
  const deletedRow = await deleteFlashcardSet(userId, setId);

  if (!deletedRow) {
    throw createHttpError(404, 'Không tìm thấy bộ flashcard.');
  }
}

async function saveMyFlashcardReview(userId, setIdInput, payload) {
  const setId = parsePositiveInteger(setIdInput, 'setId');
  const results = normalizeReviewResults(payload);
  const flashcardSet = await findFlashcardSetById(userId, setId);

  if (!flashcardSet) {
    throw createHttpError(404, 'Khong tim thay bo flashcard.');
  }

  const cardRows = await findFlashcardsForReview(
    userId,
    setId,
    results.map((result) => result.cardId),
  );
  const cardRowsById = new Map(cardRows.map((card) => [Number(card.id), card]));
  const vocabularyResults = results
    .map((result) => {
      const card = cardRowsById.get(result.cardId);

      if (!card?.vocabularyId) {
        return null;
      }

      return {
        vocabularyId: Number(card.vocabularyId),
        isCorrect: result.isCorrect,
      };
    })
    .filter(Boolean);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const vocabularyProgress = await saveVocabularyReviewResults(
      client,
      userId,
      vocabularyResults,
    );
    await createLearningLog(client, {
      userId,
      activityType: 'review_vocabulary',
      details: {
        setId,
        setTitle: flashcardSet.title,
        reviewedCards: results.length,
        trackedVocabulary: vocabularyProgress.trackedCount,
      },
    });
    await client.query('COMMIT');

    return {
      reviewedCards: results.length,
      trackedVocabulary: vocabularyProgress.trackedCount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  addMyFlashcardSet,
  getMyFlashcardSet,
  getMyFlashcardSets,
  removeMyFlashcardSet,
  saveMyFlashcardReview,
};
