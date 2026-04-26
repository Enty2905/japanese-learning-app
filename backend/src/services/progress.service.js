const {
  getLessonProgressSummary,
  getVocabularyProgressSummary,
  getKanjiProgressSummary,
} = require('../models/progress.model');

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getProgressOverview(userId) {
  const [lessonSummary, vocabularySummary, kanjiSummary] = await Promise.all([
    getLessonProgressSummary(userId),
    getVocabularyProgressSummary(userId),
    getKanjiProgressSummary(userId),
  ]);

  return {
    lessons: {
      total: normalizeNumber(lessonSummary.totalLessons),
      completed: normalizeNumber(lessonSummary.completedLessons),
      averageProgress: normalizeNumber(lessonSummary.averageProgress),
    },
    vocabulary: {
      tracked: normalizeNumber(vocabularySummary.trackedVocabulary),
      mastered: normalizeNumber(vocabularySummary.masteredVocabulary),
    },
    kanji: {
      tracked: normalizeNumber(kanjiSummary.trackedKanji),
      mastered: normalizeNumber(kanjiSummary.masteredKanji),
    },
  };
}

module.exports = {
  getProgressOverview,
};
