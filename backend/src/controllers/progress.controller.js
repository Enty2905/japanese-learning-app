const { getProgressOverview } = require('../services/progress.service');

async function getProgressOverviewController(req, res, next) {
  try {
    const overview = await getProgressOverview(req.authUser.id);

    res.status(200).json({
      overview,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProgressOverviewController,
};
