const { getMyProfile } = require('../services/profile.service');

async function getMyProfileController(req, res, next) {
  try {
    const profile = await getMyProfile(req.authUser.id);

    res.status(200).json({
      profile,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyProfileController,
};
