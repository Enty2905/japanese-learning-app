const {
  completeLessonProgress,
  getLearningActivityDates,
  getCompletedLessonSlugs,
  getLessonProgressSummary,
  getLevelProgressRows,
  getRecentLearningLogs,
  getUserLocalToday,
  getVocabularyProgressSummary,
  getKanjiProgressSummary,
  getWeeklyCompletedLessonCount,
  saveLessonQuizProgress,
} = require('../models/progress.model');
const { createHttpError } = require('../utils/http-error');

const SUPPORTED_LEVELS = new Set(['n1', 'n2', 'n3', 'n4', 'n5']);
const MAX_QUIZ_QUESTIONS = 20;
const RECENT_ACTIVITY_LIMIT = 8;

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculateStudyStreak(activityDates, today) {
  if (!today || activityDates.length === 0) {
    return 0;
  }

  const dateSet = new Set(activityDates);
  let cursor = today;

  if (!dateSet.has(cursor)) {
    cursor = addDays(today, -1);
  }

  let streak = 0;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function createActivityTitle(row) {
  const lessonTitle = row.lessonTitle || row.details?.lessonSlug || 'bài học';

  const titleMap = {
    complete_lesson: `Hoàn thành ${lessonTitle}`,
    submit_quiz: `Nộp bài kiểm tra ${lessonTitle}`,
    review_vocabulary: 'Ôn tập flashcard',
  };

  return titleMap[row.activityType] || 'Hoạt động học tập';
}

function mapRecentActivity(row) {
  return {
    id: row.id,
    type: row.activityType,
    title: createActivityTitle(row),
    lessonTitle: row.lessonTitle || '',
    lessonSlug: row.lessonSlug || row.details?.lessonSlug || '',
    lessonLevel: row.lessonLevel || '',
    details: row.details || {},
    createdAt: row.createdAt,
  };
}

function mapLevelProgress(row) {
  const totalLessons = normalizeNumber(row.totalLessons);
  const completedLessons = normalizeNumber(row.completedLessons);

  return {
    level: row.level,
    totalLessons,
    completedLessons,
    completionRate: totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0,
  };
}

function normalizeLevel(levelInput) {
  if (typeof levelInput !== 'string') {
    throw createHttpError(400, 'Vui lòng chọn cấp độ bài học.');
  }

  const level = levelInput.trim().toLowerCase();
  if (!SUPPORTED_LEVELS.has(level)) {
    throw createHttpError(400, 'Cấp độ bài học không được hỗ trợ.');
  }

  return level;
}

function normalizeLessonNumber(lessonNumberInput) {
  const lessonNumber = Number(lessonNumberInput);

  if (!Number.isInteger(lessonNumber) || lessonNumber <= 0) {
    throw createHttpError(400, 'Số bài học phải là số nguyên dương.');
  }

  return lessonNumber;
}

function normalizeQuizCount(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_QUIZ_QUESTIONS) {
    throw createHttpError(400, `${fieldName} khong hop le.`);
  }

  return parsed;
}

function normalizeVocabularyResults(value) {
  const rawResults = Array.isArray(value) ? value : [];

  return rawResults
    .map((result) => ({
      vocabularyId: Number(result?.vocabularyId),
      isCorrect: Boolean(result?.isCorrect),
    }))
    .filter((result) => Number.isInteger(result.vocabularyId) && result.vocabularyId > 0)
    .slice(0, MAX_QUIZ_QUESTIONS);
}

async function getProgressOverview(userId) {
  const [
    lessonSummary,
    vocabularySummary,
    kanjiSummary,
    activityDates,
    today,
    weeklyLessonSummary,
    levelProgressRows,
  ] = await Promise.all([
    getLessonProgressSummary(userId),
    getVocabularyProgressSummary(userId),
    getKanjiProgressSummary(userId),
    getLearningActivityDates(userId),
    getUserLocalToday(userId),
    getWeeklyCompletedLessonCount(userId),
    getLevelProgressRows(userId),
  ]);
  const studyStreak = calculateStudyStreak(activityDates, today);

  return {
    lessons: {
      total: normalizeNumber(lessonSummary.totalLessons),
      completed: normalizeNumber(lessonSummary.completedLessons),
      averageProgress: normalizeNumber(lessonSummary.averageProgress),
      completedThisWeek: normalizeNumber(weeklyLessonSummary.completedThisWeek),
    },
    vocabulary: {
      tracked: normalizeNumber(vocabularySummary.trackedVocabulary),
      mastered: normalizeNumber(vocabularySummary.masteredVocabulary),
    },
    kanji: {
      tracked: normalizeNumber(kanjiSummary.trackedKanji),
      mastered: normalizeNumber(kanjiSummary.masteredKanji),
    },
    activity: {
      studyStreak,
      activeDays: activityDates.length,
    },
    levelProgress: levelProgressRows.map(mapLevelProgress),
  };
}

async function getLearningActivity(userId) {
  const [
    activityDates,
    today,
    weeklyLessonSummary,
    recentRows,
    levelProgressRows,
  ] = await Promise.all([
    getLearningActivityDates(userId),
    getUserLocalToday(userId),
    getWeeklyCompletedLessonCount(userId),
    getRecentLearningLogs(userId, RECENT_ACTIVITY_LIMIT),
    getLevelProgressRows(userId),
  ]);

  return {
    studyStreak: calculateStudyStreak(activityDates, today),
    completedThisWeek: normalizeNumber(weeklyLessonSummary.completedThisWeek),
    activeDays: activityDates.length,
    recentActivities: recentRows.map(mapRecentActivity),
    levelProgress: levelProgressRows.map(mapLevelProgress),
  };
}

async function getCompletedLessons(userId) {
  return getCompletedLessonSlugs(userId);
}

async function markLessonComplete(userId, payload) {
  const level = normalizeLevel(payload?.level);
  const lessonNumber = normalizeLessonNumber(payload?.lessonNumber);
  const progress = await completeLessonProgress({
    userId,
    level,
    lessonNumber,
  });

  if (!progress) {
    throw createHttpError(404, 'Không tìm thấy bài học.');
  }

  return progress;
}

async function saveLessonQuiz(userId, payload) {
  const level = normalizeLevel(payload?.level);
  const lessonNumber = normalizeLessonNumber(payload?.lessonNumber);
  const correctCount = normalizeQuizCount(payload?.correctCount, 'So cau dung');
  const questionCount = normalizeQuizCount(payload?.questionCount, 'So cau hoi');

  if (questionCount === 0 || correctCount > questionCount) {
    throw createHttpError(400, 'Ket qua bai kiem tra khong hop le.');
  }

  const score = Math.round((correctCount / questionCount) * 100);
  const progress = await saveLessonQuizProgress({
    userId,
    level,
    lessonNumber,
    score,
    correctCount,
    questionCount,
    vocabularyResults: normalizeVocabularyResults(payload?.vocabularyResults),
  });

  if (!progress) {
    throw createHttpError(404, 'Khong tim thay bai hoc.');
  }

  return progress;
}

module.exports = {
  getCompletedLessons,
  getLearningActivity,
  getProgressOverview,
  markLessonComplete,
  saveLessonQuiz,
};
