const {
  addMyFlashcards,
  getMyFlashcards,
  removeMyFlashcard,
} = require('../services/flashcard.service');

async function getMyFlashcardsController(req, res, next) {
  try {
    const flashcards = await getMyFlashcards(req.authUser.id);

    res.status(200).json({
      flashcards,
    });
  } catch (error) {
    next(error);
  }
}

async function createFlashcardsController(req, res, next) {
  try {
    const flashcards = await addMyFlashcards(req.authUser.id, req.body);

    res.status(201).json({
      message: 'Flashcards created.',
      flashcards,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteFlashcardController(req, res, next) {
  try {
    await removeMyFlashcard(req.authUser.id, req.params.flashcardId);

    res.status(200).json({
      message: 'Flashcard deleted.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createFlashcardsController,
  deleteFlashcardController,
  getMyFlashcardsController,
};
