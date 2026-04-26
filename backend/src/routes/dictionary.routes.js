const express = require('express');
const { searchDictionaryController } = require('../controllers/dictionary.controller');

const dictionaryRouter = express.Router();

dictionaryRouter.get('/search', searchDictionaryController);

module.exports = {
  dictionaryRouter,
};
