const express = require('express');
const {
  createFlashcardSetController,
  deleteFlashcardSetController,
  getMyFlashcardSetController,
  getMyFlashcardSetsController,
} = require('../controllers/flashcard.controller');

const flashcardRouter = express.Router();

flashcardRouter.get('/', getMyFlashcardSetsController);
flashcardRouter.post('/', createFlashcardSetController);
flashcardRouter.get('/:setId', getMyFlashcardSetController);
flashcardRouter.delete('/:setId', deleteFlashcardSetController);

module.exports = {
  flashcardRouter,
};
