const express = require('express');
const { getProgressOverviewController } = require('../controllers/progress.controller');

const progressRouter = express.Router();

progressRouter.get('/overview', getProgressOverviewController);

module.exports = {
  progressRouter,
};
