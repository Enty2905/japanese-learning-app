const { pool } = require('../config/db');

async function findLessonsByLevel(level) {
  const query = `
    WITH vocabulary_lessons AS (
      SELECT
        lesson_number AS "lessonNumber",
        LOWER(jlpt_level) || '-l' || lesson_number AS slug,
        COUNT(*)::int AS "vocabularyCount",
        MIN(word) AS "sampleWord"
      FROM vocabulary
      WHERE lesson_number IS NOT NULL
        AND LOWER(jlpt_level) = LOWER($1)
      GROUP BY lesson_number, jlpt_level
    )
    SELECT
      vocabulary_lessons."lessonNumber",
      vocabulary_lessons."vocabularyCount",
      vocabulary_lessons."sampleWord",
      COALESCE(COUNT(DISTINCT lesson_grammar_points.grammar_point_id), 0)::int AS "grammarCount"
    FROM vocabulary_lessons
    LEFT JOIN lessons
      ON lessons.slug = vocabulary_lessons.slug
    LEFT JOIN lesson_grammar_points
      ON lesson_grammar_points.lesson_id = lessons.id
    GROUP BY
      vocabulary_lessons."lessonNumber",
      vocabulary_lessons."vocabularyCount",
      vocabulary_lessons."sampleWord"
    ORDER BY vocabulary_lessons."lessonNumber" ASC
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

async function findGrammarByLesson(level, lessonNumber) {
  const lessonSlug = `${level.toLowerCase()}-l${lessonNumber}`;
  const query = `
    SELECT
      grammar_points.id,
      grammar_points.title,
      grammar_points.pattern,
      grammar_points.meaning_vi AS "meaningVi",
      grammar_points.explanation,
      grammar_points.usage_note AS "usageNote",
      grammar_points.restriction,
      grammar_points.nuance,
      grammar_points.formation,
      grammar_points.jlpt_level AS "jlptLevel",
      grammar_examples.id AS "exampleId",
      grammar_examples.example_jp AS "exampleJp",
      grammar_examples.example_kana AS "exampleKana",
      grammar_examples.example_vi AS "exampleVi",
      grammar_examples.audio_url AS "exampleAudioUrl"
    FROM lessons
    INNER JOIN lesson_grammar_points
      ON lesson_grammar_points.lesson_id = lessons.id
    INNER JOIN grammar_points
      ON grammar_points.id = lesson_grammar_points.grammar_point_id
    LEFT JOIN grammar_examples
      ON grammar_examples.grammar_point_id = grammar_points.id
    WHERE lessons.slug = $1
    ORDER BY
      lesson_grammar_points.position ASC,
      grammar_points.id ASC,
      grammar_examples.id ASC
  `;

  const { rows } = await pool.query(query, [lessonSlug]);
  return rows;
}

module.exports = {
  findGrammarByLesson,
  findLessonsByLevel,
  findVocabularyByLesson,
};
