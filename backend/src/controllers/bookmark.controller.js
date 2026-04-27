const {
  addBookmark,
  getMyBookmarks,
  removeBookmark,
} = require('../services/bookmark.service');

async function getMyBookmarksController(req, res, next) {
  try {
    const bookmarks = await getMyBookmarks(req.authUser.id);

    res.status(200).json({
      bookmarks,
    });
  } catch (error) {
    next(error);
  }
}

async function createBookmarkController(req, res, next) {
  try {
    const bookmark = await addBookmark(req.authUser.id, req.body);

    res.status(201).json({
      message: 'Đã tạo dấu trang.',
      bookmark,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteBookmarkController(req, res, next) {
  try {
    await removeBookmark(req.authUser.id, req.params.bookmarkId);

    res.status(200).json({
      message: 'Đã xóa dấu trang.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyBookmarksController,
  createBookmarkController,
  deleteBookmarkController,
};
