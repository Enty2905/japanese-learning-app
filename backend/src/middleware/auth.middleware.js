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
      throw createHttpError(401, 'Authentication token is required.');
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      throw createHttpError(401, 'Invalid or expired authentication token.');
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
