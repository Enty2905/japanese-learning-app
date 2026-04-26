const express = require('express');
const {
  createFlashcardsController,
  deleteFlashcardController,
  getMyFlashcardsController,
} = require('../controllers/flashcard.controller');

const flashcardRouter = express.Router();

flashcardRouter.get('/', getMyFlashcardsController);
flashcardRouter.post('/', createFlashcardsController);
flashcardRouter.delete('/:flashcardId', deleteFlashcardController);

module.exports = {
  flashcardRouter,
};
