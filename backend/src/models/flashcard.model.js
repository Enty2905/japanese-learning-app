const { pool } = require('../config/db');

let ensureFlashcardTablesPromise = null;

function ensureFlashcardTables() {
  if (!ensureFlashcardTablesPromise) {
    const query = `
      CREATE TABLE IF NOT EXISTS user_flashcard_sets (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_flashcards (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        set_id BIGINT NULL REFERENCES user_flashcard_sets(id) ON DELETE CASCADE,
        vocabulary_id BIGINT NULL REFERENCES vocabulary(id) ON DELETE SET NULL,
        front_text VARCHAR(255) NOT NULL,
        back_text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE user_flashcards
      ADD COLUMN IF NOT EXISTS set_id BIGINT NULL REFERENCES user_flashcard_sets(id) ON DELETE CASCADE;

      ALTER TABLE user_flashcards
      ADD COLUMN IF NOT EXISTS vocabulary_id BIGINT NULL REFERENCES vocabulary(id) ON DELETE SET NULL;

      WITH users_with_orphan_cards AS (
        SELECT DISTINCT user_id
        FROM user_flashcards
        WHERE set_id IS NULL
      ),
      created_sets AS (
        INSERT INTO user_flashcard_sets (
          user_id,
          title,
          description,
          created_at,
          updated_at
        )
        SELECT
          user_id,
          'Flash card da tao',
          'Bo the duoc tao tu flash card cu.',
          NOW(),
          NOW()
        FROM users_with_orphan_cards
        RETURNING id, user_id
      )
      UPDATE user_flashcards flashcards
      SET set_id = created_sets.id
      FROM created_sets
      WHERE flashcards.user_id = created_sets.user_id
        AND flashcards.set_id IS NULL;

      ALTER TABLE user_flashcards
      ALTER COLUMN set_id SET NOT NULL;

      UPDATE user_flashcards flashcards
      SET vocabulary_id = vocabulary.id
      FROM vocabulary
      WHERE flashcards.vocabulary_id IS NULL
        AND (
          LOWER(vocabulary.word) = LOWER(flashcards.front_text)
          OR LOWER(COALESCE(vocabulary.kana, '')) = LOWER(flashcards.front_text)
          OR LOWER(COALESCE(vocabulary.romaji, '')) = LOWER(flashcards.front_text)
        );
    `;

    ensureFlashcardTablesPromise = pool.query(query);
  }

  return ensureFlashcardTablesPromise;
}

async function listFlashcardSets(userId) {
  await ensureFlashcardTables();

  const query = `
    SELECT
      sets.id,
      sets.title,
      sets.description,
      sets.created_at AS "createdAt",
      sets.updated_at AS "updatedAt",
      COUNT(cards.id)::int AS "cardCount"
    FROM user_flashcard_sets sets
    LEFT JOIN user_flashcards cards
      ON cards.set_id = sets.id
      AND cards.user_id = sets.user_id
    WHERE sets.user_id = $1
    GROUP BY sets.id
    ORDER BY sets.created_at DESC, sets.id DESC
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
}

async function findFlashcardSetById(userId, setId) {
  await ensureFlashcardTables();

  const query = `
    SELECT
      id,
      title,
      description,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM user_flashcard_sets
    WHERE user_id = $1
      AND id = $2
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId, setId]);
  return rows[0] || null;
}

async function listFlashcardsBySetId(userId, setId) {
  await ensureFlashcardTables();

  const query = `
    SELECT
      cards.id,
      cards.set_id AS "setId",
      cards.vocabulary_id AS "vocabularyId",
      cards.front_text AS "frontText",
      cards.back_text AS "backText",
      cards.created_at AS "createdAt",
      cards.updated_at AS "updatedAt",
      progress.mastery_level AS "masteryLevel",
      progress.next_review_at AS "nextReviewAt",
      progress.correct_count AS "correctCount",
      progress.wrong_count AS "wrongCount"
    FROM user_flashcards cards
    LEFT JOIN user_vocab_progress progress
      ON progress.vocabulary_id = cards.vocabulary_id
      AND progress.user_id = cards.user_id
    WHERE cards.user_id = $1
      AND cards.set_id = $2
    ORDER BY cards.id ASC
  `;

  const { rows } = await pool.query(query, [userId, setId]);
  return rows;
}

async function resolveVocabularyIds(cards) {
  const frontTexts = [...new Set(cards.map((card) => card.frontText).filter(Boolean))];

  if (frontTexts.length === 0) {
    return new Map();
  }

  const query = `
    SELECT DISTINCT ON (lookup.front_text)
      lookup.front_text AS "frontText",
      vocabulary.id
    FROM unnest($1::text[]) AS lookup(front_text)
    INNER JOIN vocabulary
      ON LOWER(vocabulary.word) = LOWER(lookup.front_text)
      OR LOWER(COALESCE(vocabulary.kana, '')) = LOWER(lookup.front_text)
      OR LOWER(COALESCE(vocabulary.romaji, '')) = LOWER(lookup.front_text)
    ORDER BY lookup.front_text, vocabulary.id ASC
  `;

  const { rows } = await pool.query(query, [frontTexts]);
  return rows.reduce((vocabularyIds, row) => {
    vocabularyIds.set(row.frontText.toLowerCase(), row.id);
    return vocabularyIds;
  }, new Map());
}

async function createFlashcardSet({ userId, title, description, cards }) {
  await ensureFlashcardTables();
  const vocabularyIds = await resolveVocabularyIds(cards);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const setQuery = `
      INSERT INTO user_flashcard_sets (
        user_id,
        title,
        description,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING
        id,
        title,
        description,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;
    const setResult = await client.query(setQuery, [userId, title, description]);
    const flashcardSet = setResult.rows[0];
    const values = [];
    const placeholders = cards.map((card, index) => {
      const offset = index * 5;
      const vocabularyId = vocabularyIds.get(card.frontText.toLowerCase()) || null;

      values.push(userId, flashcardSet.id, vocabularyId, card.frontText, card.backText);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, NOW(), NOW())`;
    });

    const cardsQuery = `
      INSERT INTO user_flashcards (
        user_id,
        set_id,
        vocabulary_id,
        front_text,
        back_text,
        created_at,
        updated_at
      )
      VALUES ${placeholders.join(', ')}
      RETURNING
        id,
        set_id AS "setId",
        vocabulary_id AS "vocabularyId",
        front_text AS "frontText",
        back_text AS "backText",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;
    const cardsResult = await client.query(cardsQuery, values);

    await client.query('COMMIT');

    return {
      ...flashcardSet,
      cardCount: cardsResult.rows.length,
      cards: cardsResult.rows,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteFlashcardSet(userId, setId) {
  await ensureFlashcardTables();

  const query = `
    DELETE FROM user_flashcard_sets
    WHERE id = $1
      AND user_id = $2
    RETURNING id
  `;

  const { rows } = await pool.query(query, [setId, userId]);
  return rows[0] || null;
}

async function findFlashcardsForReview(userId, setId, cardIds) {
  await ensureFlashcardTables();

  if (cardIds.length === 0) {
    return [];
  }

  const query = `
    SELECT
      id,
      vocabulary_id AS "vocabularyId"
    FROM user_flashcards
    WHERE user_id = $1
      AND set_id = $2
      AND id = ANY($3::bigint[])
  `;

  const { rows } = await pool.query(query, [userId, setId, cardIds]);
  return rows;
}

module.exports = {
  createFlashcardSet,
  deleteFlashcardSet,
  findFlashcardsForReview,
  findFlashcardSetById,
  listFlashcardSets,
  listFlashcardsBySetId,
};
