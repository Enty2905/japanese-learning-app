const {
  createContentByAdmin,
  deleteContentByAdmin,
  getAdminContentItems,
  getAdminOverview,
  getAdminUsers,
  updateContentByAdmin,
  updateUserByAdmin,
} = require('../services/admin.service');

async function getAdminOverviewController(req, res, next) {
  try {
    const overview = await getAdminOverview();

    res.status(200).json(overview);
  } catch (error) {
    next(error);
  }
}

async function getAdminUsersController(req, res, next) {
  try {
    const result = await getAdminUsers(req.query);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAdminContentController(req, res, next) {
  try {
    const result = await getAdminContentItems(req.params.contentType, req.query);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createAdminContentController(req, res, next) {
  try {
    const item = await createContentByAdmin(req.params.contentType, req.body);

    res.status(201).json({
      message: 'Đã tạo nội dung.',
      item,
    });
  } catch (error) {
    next(error);
  }
}

async function updateAdminContentController(req, res, next) {
  try {
    const item = await updateContentByAdmin(
      req.params.contentType,
      req.params.itemId,
      req.body,
    );

    res.status(200).json({
      message: 'Đã cập nhật nội dung.',
      item,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAdminContentController(req, res, next) {
  try {
    await deleteContentByAdmin(req.params.contentType, req.params.itemId);

    res.status(200).json({
      message: 'Đã xóa nội dung.',
    });
  } catch (error) {
    next(error);
  }
}

async function updateAdminUserController(req, res, next) {
  try {
    const user = await updateUserByAdmin(req.authUser.id, req.params.userId, req.body);

    res.status(200).json({
      message: 'Đã cập nhật người dùng.',
      user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAdminContentController,
  deleteAdminContentController,
  getAdminContentController,
  getAdminOverviewController,
  getAdminUsersController,
  updateAdminContentController,
  updateAdminUserController,
};
