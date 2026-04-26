const { loginUser, registerUser } = require('../services/auth.service');

async function registerController(req, res, next) {
  try {
    const result = await registerUser(req.body || {});

    res.status(201).json({
      message: 'Register successful.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

async function loginController(req, res, next) {
  try {
    const result = await loginUser(req.body || {});

    res.status(200).json({
      message: 'Login successful.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerController,
  loginController,
};
