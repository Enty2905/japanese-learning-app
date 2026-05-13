const express = require('express');
const {
  completeLessonController,
  getLearningActivityController,
  getCompletedLessonsController,
  getProgressOverviewController,
  saveLessonQuizController,
} = require('../controllers/progress.controller');

const progressRouter = express.Router();

progressRouter.get('/overview', getProgressOverviewController);
progressRouter.get('/activity', getLearningActivityController);
progressRouter.get('/lessons', getCompletedLessonsController);
progressRouter.post('/lesson-complete', completeLessonController);
progressRouter.post('/lesson-quiz', saveLessonQuizController);

module.exports = {
  progressRouter,
};
