const { loginUser, registerUser } = require('../services/auth.service');

async function registerController(req, res, next) {
  try {
    const result = await registerUser(req.body || {});

    res.status(201).json({
      message: 'Đăng ký thành công.',
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
      message: 'Đăng nhập thành công.',
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
