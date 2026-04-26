const { pool } = require('../config/db');

let ensureFlashcardTablePromise = null;

function ensureFlashcardTable() {
  if (!ensureFlashcardTablePromise) {
    const query = `
      CREATE TABLE IF NOT EXISTS user_flashcards (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        front_text VARCHAR(255) NOT NULL,
        back_text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    ensureFlashcardTablePromise = pool.query(query);
  }

  return ensureFlashcardTablePromise;
}

async function listFlashcards(userId) {
  await ensureFlashcardTable();

  const query = `
    SELECT
      id,
      front_text AS "frontText",
      back_text AS "backText",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM user_flashcards
    WHERE user_id = $1
    ORDER BY created_at DESC, id DESC
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
}

async function createFlashcards(userId, cards) {
  await ensureFlashcardTable();

  const values = [];
  const placeholders = cards.map((card, index) => {
    const offset = index * 3;

    values.push(userId, card.frontText, card.backText);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, NOW(), NOW())`;
  });

  const query = `
    INSERT INTO user_flashcards (
      user_id,
      front_text,
      back_text,
      created_at,
      updated_at
    )
    VALUES ${placeholders.join(', ')}
    RETURNING
      id,
      front_text AS "frontText",
      back_text AS "backText",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

async function deleteFlashcard(userId, flashcardId) {
  await ensureFlashcardTable();

  const query = `
    DELETE FROM user_flashcards
    WHERE id = $1
      AND user_id = $2
    RETURNING id
  `;

  const { rows } = await pool.query(query, [flashcardId, userId]);
  return rows[0] || null;
}

module.exports = {
  createFlashcards,
  deleteFlashcard,
  listFlashcards,
};
