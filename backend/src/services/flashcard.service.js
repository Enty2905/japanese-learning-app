const {
  createFlashcardSet,
  deleteFlashcardSet,
  findFlashcardSetById,
  listFlashcardSets,
  listFlashcardsBySetId,
} = require('../models/flashcard.model');
const { createHttpError } = require('../utils/http-error');

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_FRONT_LENGTH = 255;
const MAX_BACK_LENGTH = 2000;
const MAX_SET_CARDS = 200;

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createHttpError(400, `${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function normalizeRequiredText(value, fieldName, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (!text) {
    throw createHttpError(400, `${fieldName} is required.`);
  }

  if (text.length > maxLength) {
    throw createHttpError(400, `${fieldName} is too long.`);
  }

  return text;
}

function normalizeOptionalText(value, fieldName, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (text.length > maxLength) {
    throw createHttpError(400, `${fieldName} is too long.`);
  }

  return text || null;
}

function normalizeCards(payload) {
  const rawCards = Array.isArray(payload?.cards) ? payload.cards : [];

  if (rawCards.length === 0) {
    throw createHttpError(400, 'At least one flashcard is required.');
  }

  if (rawCards.length > MAX_SET_CARDS) {
    throw createHttpError(400, `A set can contain up to ${MAX_SET_CARDS} flashcards.`);
  }

  return rawCards.map((card) => ({
    frontText: normalizeRequiredText(card?.frontText, 'frontText', MAX_FRONT_LENGTH),
    backText: normalizeRequiredText(card?.backText, 'backText', MAX_BACK_LENGTH),
  }));
}

function toFlashcardResponse(row) {
  return {
    id: row.id,
    setId: row.setId,
    frontText: row.frontText,
    backText: row.backText,
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
    throw createHttpError(404, 'Flashcard set not found.');
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
    throw createHttpError(404, 'Flashcard set not found.');
  }
}

module.exports = {
  addMyFlashcardSet,
  getMyFlashcardSet,
  getMyFlashcardSets,
  removeMyFlashcardSet,
};
