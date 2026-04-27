const { createHttpError } = require('../utils/http-error');
const { verifyAccessToken } = require('../utils/token');

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return '';
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return '';
  }

  return token;
}

function authenticateToken(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw createHttpError(401, 'Vui lòng đăng nhập để tiếp tục.');
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      throw createHttpError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    req.authUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticateToken,
};
