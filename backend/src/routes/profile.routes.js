const express = require('express');
const { getMyProfileController } = require('../controllers/profile.controller');

const profileRouter = express.Router();

profileRouter.get('/me', getMyProfileController);

module.exports = {
  profileRouter,
};
