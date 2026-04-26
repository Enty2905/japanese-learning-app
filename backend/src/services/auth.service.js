const { createUser, findUserByEmail } = require('../models/user.model');
const { createHttpError } = require('../utils/http-error');
const { hashPassword, verifyPassword } = require('../utils/password');
const { createAccessToken } = require('../utils/token');

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeFullName(fullName) {
  return typeof fullName === 'string' ? fullName.trim() : '';
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function validateRegisterPayload({ fullName, email, password }) {
  if (!fullName) {
    throw createHttpError(400, 'Full name is required.');
  }

  if (!email) {
    throw createHttpError(400, 'Email is required.');
  }

  if (!validatePassword(password)) {
    throw createHttpError(400, 'Password must be at least 6 characters.');
  }
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    timezone: user.timezone,
  };
}

async function registerUser({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedFullName = normalizeFullName(name);

  validateRegisterPayload({
    fullName: normalizedFullName,
    email: normalizedEmail,
    password,
  });

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw createHttpError(409, 'Email is already registered.');
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    email: normalizedEmail,
    passwordHash,
    fullName: normalizedFullName,
  });

  return {
    user: sanitizeUser(user),
    token: createAccessToken(user),
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw createHttpError(400, 'Email is required.');
  }

  if (!password) {
    throw createHttpError(400, 'Password is required.');
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    throw createHttpError(401, 'Invalid email or password.');
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw createHttpError(401, 'Invalid email or password.');
  }

  return {
    user: sanitizeUser(user),
    token: createAccessToken(user),
  };
}

module.exports = {
  registerUser,
  loginUser,
};
