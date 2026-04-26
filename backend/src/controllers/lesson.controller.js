const {
  getLessonsByLevel,
  getLessonByLevelAndNumber,
} = require('../services/lesson.service');

async function getLessonsByLevelController(req, res, next) {
  try {
    const lessons = await getLessonsByLevel(req.params.level);

    res.status(200).json({
      level: req.params.level,
      lessons,
    });
  } catch (error) {
    next(error);
  }
}

async function getLessonDetailController(req, res, next) {
  try {
    const lesson = await getLessonByLevelAndNumber(
      req.params.level,
      req.params.lessonNumber,
    );

    res.status(200).json(lesson);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLessonsByLevelController,
  getLessonDetailController,
};
