function notFoundHandler(req, res) {
  res.status(404).json({
    message: 'Không tìm thấy endpoint.',
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status >= 500 ? 'Lỗi máy chủ nội bộ.' : error.message;

  return res.status(status).json({
    message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
