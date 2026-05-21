const express = require('express');
const {
  createAdminContentController,
  deleteAdminContentController,
  getAdminContentController,
  getAdminOverviewController,
  getAdminUsersController,
  updateAdminContentController,
  updateAdminUserController,
} = require('../controllers/admin.controller');

const adminRouter = express.Router();

adminRouter.get('/overview', getAdminOverviewController);
adminRouter.get('/content/:contentType', getAdminContentController);
adminRouter.post('/content/:contentType', createAdminContentController);
adminRouter.patch('/content/:contentType/:itemId', updateAdminContentController);
adminRouter.delete('/content/:contentType/:itemId', deleteAdminContentController);
adminRouter.get('/users', getAdminUsersController);
adminRouter.patch('/users/:userId', updateAdminUserController);

module.exports = {
  adminRouter,
};
