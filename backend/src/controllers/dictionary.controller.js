const {
  getDictionarySearchHistory,
  getRandomKanjiMemoryHints,
  searchDictionary,
} = require('../services/dictionary.service');

async function searchDictionaryController(req, res, next) {
  try {
    const result = await searchDictionary(req.query.type, req.query.q, req.authUser?.id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getDictionarySearchHistoryController(req, res, next) {
  try {
    const history = await getDictionarySearchHistory(req.authUser?.id);

    res.status(200).json({
      history,
    });
  } catch (error) {
    next(error);
  }
}

async function getKanjiMemoryHintsController(req, res, next) {
  try {
    const hints = await getRandomKanjiMemoryHints();

    res.status(200).json({
      hints,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDictionarySearchHistoryController,
  getKanjiMemoryHintsController,
  searchDictionaryController,
};
