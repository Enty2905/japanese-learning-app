const express = require('express');
const {
  createBookmarkController,
  deleteBookmarkController,
  getMyBookmarksController,
} = require('../controllers/bookmark.controller');

const bookmarkRouter = express.Router();

bookmarkRouter.get('/', getMyBookmarksController);
bookmarkRouter.post('/', createBookmarkController);
bookmarkRouter.delete('/:bookmarkId', deleteBookmarkController);

module.exports = {
  bookmarkRouter,
};
