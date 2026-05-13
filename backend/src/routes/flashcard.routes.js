const express = require('express');
const {
  createFlashcardSetController,
  deleteFlashcardSetController,
  getMyFlashcardSetController,
  getMyFlashcardSetsController,
  saveFlashcardReviewController,
} = require('../controllers/flashcard.controller');

const flashcardRouter = express.Router();

flashcardRouter.get('/', getMyFlashcardSetsController);
flashcardRouter.post('/', createFlashcardSetController);
flashcardRouter.get('/:setId', getMyFlashcardSetController);
flashcardRouter.post('/:setId/review', saveFlashcardReviewController);
flashcardRouter.delete('/:setId', deleteFlashcardSetController);

module.exports = {
  flashcardRouter,
};
