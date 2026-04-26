const {
  createFlashcards,
  deleteFlashcard,
  listFlashcards,
} = require('../models/flashcard.model');
const { createHttpError } = require('../utils/http-error');

const MAX_FRONT_LENGTH = 255;
const MAX_BACK_LENGTH = 2000;
const MAX_BULK_CARDS = 100;

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createHttpError(400, `${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function normalizeText(value, fieldName, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (!text) {
    throw createHttpError(400, `${fieldName} is required.`);
  }

  if (text.length > maxLength) {
    throw createHttpError(400, `${fieldName} is too long.`);
  }

  return text;
}

function normalizeCards(payload) {
  const rawCards = Array.isArray(payload?.cards)
    ? payload.cards
    : [{ frontText: payload?.frontText, backText: payload?.backText }];

  if (rawCards.length === 0) {
    throw createHttpError(400, 'At least one flashcard is required.');
  }

  if (rawCards.length > MAX_BULK_CARDS) {
    throw createHttpError(400, `You can create up to ${MAX_BULK_CARDS} flashcards at once.`);
  }

  return rawCards.map((card) => ({
    frontText: normalizeText(card?.frontText, 'frontText', MAX_FRONT_LENGTH),
    backText: normalizeText(card?.backText, 'backText', MAX_BACK_LENGTH),
  }));
}

function toFlashcardResponse(row) {
  return {
    id: row.id,
    frontText: row.frontText,
    backText: row.backText,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getMyFlashcards(userId) {
  const rows = await listFlashcards(userId);
  return rows.map(toFlashcardResponse);
}

async function addMyFlashcards(userId, payload) {
  const cards = normalizeCards(payload);
  const rows = await createFlashcards(userId, cards);
  return rows.map(toFlashcardResponse);
}

async function removeMyFlashcard(userId, flashcardIdInput) {
  const flashcardId = parsePositiveInteger(flashcardIdInput, 'flashcardId');
  const deletedRow = await deleteFlashcard(userId, flashcardId);

  if (!deletedRow) {
    throw createHttpError(404, 'Flashcard not found.');
  }
}

module.exports = {
  addMyFlashcards,
  getMyFlashcards,
  removeMyFlashcard,
};
