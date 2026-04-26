const { pool } = require('../config/db');

async function listBookmarks(userId) {
  const query = `
    SELECT
      id,
      lesson_id AS "lessonId",
      vocabulary_id AS "vocabularyId",
      kanji_id AS "kanjiId",
      grammar_point_id AS "grammarPointId",
      details,
      created_at AS "createdAt"
    FROM learning_logs
    WHERE user_id = $1
      AND activity_type = 'bookmark'
    ORDER BY created_at DESC
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
}

async function createBookmark({ userId, lessonId, vocabularyId, kanjiId, grammarPointId, details }) {
  const query = `
    INSERT INTO learning_logs (
      user_id,
      lesson_id,
      vocabulary_id,
      kanji_id,
      grammar_point_id,
      activity_type,
      details,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, 'bookmark', $6::jsonb, NOW())
    RETURNING
      id,
      lesson_id AS "lessonId",
      vocabulary_id AS "vocabularyId",
      kanji_id AS "kanjiId",
      grammar_point_id AS "grammarPointId",
      details,
      created_at AS "createdAt"
  `;

  const values = [
    userId,
    lessonId,
    vocabularyId,
    kanjiId,
    grammarPointId,
    JSON.stringify(details),
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function deleteBookmarkById(userId, bookmarkId) {
  const query = `
    DELETE FROM learning_logs
    WHERE id = $1
      AND user_id = $2
      AND activity_type = 'bookmark'
    RETURNING id
  `;

  const { rows } = await pool.query(query, [bookmarkId, userId]);
  return rows[0] || null;
}

module.exports = {
  listBookmarks,
  createBookmark,
  deleteBookmarkById,
};
