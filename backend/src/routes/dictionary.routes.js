const express = require('express');
const {
  getDictionarySearchHistoryController,
  getKanjiMemoryHintsController,
  searchDictionaryController,
} = require('../controllers/dictionary.controller');
const { verifyAccessToken } = require('../utils/token');

const dictionaryRouter = express.Router();

function attachOptionalAuthUser(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (typeof authorizationHeader !== 'string') {
    next();
    return;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    next();
    return;
  }

  const payload = verifyAccessToken(token);
  if (payload) {
    req.authUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }

  next();
}

dictionaryRouter.get('/history', attachOptionalAuthUser, getDictionarySearchHistoryController);
dictionaryRouter.get('/kanji-memory-hints', getKanjiMemoryHintsController);
dictionaryRouter.get('/search', attachOptionalAuthUser, searchDictionaryController);

module.exports = {
  dictionaryRouter,
};
