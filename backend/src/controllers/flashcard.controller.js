const {
  addMyFlashcardSet,
  getMyFlashcardSet,
  getMyFlashcardSets,
  removeMyFlashcardSet,
} = require('../services/flashcard.service');

async function getMyFlashcardSetsController(req, res, next) {
  try {
    const sets = await getMyFlashcardSets(req.authUser.id);

    res.status(200).json({
      sets,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyFlashcardSetController(req, res, next) {
  try {
    const flashcardSet = await getMyFlashcardSet(req.authUser.id, req.params.setId);

    res.status(200).json({
      set: flashcardSet,
    });
  } catch (error) {
    next(error);
  }
}

async function createFlashcardSetController(req, res, next) {
  try {
    const flashcardSet = await addMyFlashcardSet(req.authUser.id, req.body);

    res.status(201).json({
      message: 'Flashcard set created.',
      set: flashcardSet,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteFlashcardSetController(req, res, next) {
  try {
    await removeMyFlashcardSet(req.authUser.id, req.params.setId);

    res.status(200).json({
      message: 'Flashcard set deleted.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createFlashcardSetController,
  deleteFlashcardSetController,
  getMyFlashcardSetController,
  getMyFlashcardSetsController,
};
