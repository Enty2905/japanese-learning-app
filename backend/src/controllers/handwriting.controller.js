const {
  getHandwritingHealth,
  predictHandwriting,
} = require('../services/handwriting.service');

async function getHandwritingHealthController(req, res, next) {
  try {
    const health = await getHandwritingHealth();

    res.status(200).json(health);
  } catch (error) {
    next(error);
  }
}

async function predictHandwritingController(req, res, next) {
  try {
    const result = await predictHandwriting(req.body || {});

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHandwritingHealthController,
  predictHandwritingController,
};
