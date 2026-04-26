const { searchDictionary } = require('../services/dictionary.service');

async function searchDictionaryController(req, res, next) {
  try {
    const result = await searchDictionary(req.query.type, req.query.q);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  searchDictionaryController,
};
