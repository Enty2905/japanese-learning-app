const { pool } = require('../config/db');

async function findLessonsByLevel(level) {
  const query = `
    SELECT
      lesson_number AS "lessonNumber",
      COUNT(*)::int AS "vocabularyCount",
      MIN(word) AS "sampleWord"
    FROM vocabulary
    WHERE lesson_number IS NOT NULL
      AND LOWER(jlpt_level) = LOWER($1)
    GROUP BY lesson_number
    ORDER BY lesson_number ASC
  `;

  const { rows } = await pool.query(query, [level]);
  return rows;
}

async function findVocabularyByLesson(level, lessonNumber) {
  const query = `
    SELECT
      id,
      lesson_number AS "lessonNumber",
      word,
      kana,
      romaji,
      meaning_vi AS "meaningVi",
      meaning_en AS "meaningEn",
      word_type AS "wordType",
      jlpt_level AS "jlptLevel"
    FROM vocabulary
    WHERE lesson_number = $1
      AND LOWER(jlpt_level) = LOWER($2)
    ORDER BY id ASC
  `;

  const { rows } = await pool.query(query, [lessonNumber, level]);
  return rows;
}

module.exports = {
  findLessonsByLevel,
  findVocabularyByLesson,
};
