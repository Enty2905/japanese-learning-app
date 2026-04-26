const express = require('express');
const {
  getLessonDetailController,
  getLessonsByLevelController,
} = require('../controllers/lesson.controller');

const lessonRouter = express.Router();

lessonRouter.get('/:level/:lessonNumber', getLessonDetailController);
lessonRouter.get('/:level', getLessonsByLevelController);

module.exports = {
  lessonRouter,
};
