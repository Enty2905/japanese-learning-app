const express = require('express');
const {
  getHandwritingHealthController,
  predictHandwritingController,
} = require('../controllers/handwriting.controller');

const handwritingRouter = express.Router();

handwritingRouter.get('/health', getHandwritingHealthController);
handwritingRouter.post('/predict', predictHandwritingController);

module.exports = {
  handwritingRouter,
};
