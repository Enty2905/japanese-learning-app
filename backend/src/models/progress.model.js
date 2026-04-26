const { pool } = require('../config/db');

async function getLessonProgressSummary(userId) {
  const query = `
    SELECT
      COUNT(*)::int AS "totalLessons",
      COUNT(*) FILTER (WHERE status = 'completed')::int AS "completedLessons",
      COALESCE(AVG(progress_percent), 0)::numeric(5,2) AS "averageProgress"
    FROM user_lesson_progress
    WHERE user_id = $1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

async function getVocabularyProgressSummary(userId) {
  const query = `
    SELECT
      COUNT(*)::int AS "trackedVocabulary",
      COUNT(*) FILTER (WHERE mastery_level >= 3)::int AS "masteredVocabulary"
    FROM user_vocab_progress
    WHERE user_id = $1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

async function getKanjiProgressSummary(userId) {
  const query = `
    SELECT
      COUNT(*)::int AS "trackedKanji",
      COUNT(*) FILTER (WHERE mastery_level >= 3)::int AS "masteredKanji"
    FROM user_kanji_progress
    WHERE user_id = $1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

module.exports = {
  getLessonProgressSummary,
  getVocabularyProgressSummary,
  getKanjiProgressSummary,
};
