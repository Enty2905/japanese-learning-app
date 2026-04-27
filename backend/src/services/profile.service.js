const { findUserById } = require('../models/user.model');
const { createHttpError } = require('../utils/http-error');

async function getMyProfile(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw createHttpError(404, 'Không tìm thấy hồ sơ người dùng.');
  }

  return user;
}

module.exports = {
  getMyProfile,
};
