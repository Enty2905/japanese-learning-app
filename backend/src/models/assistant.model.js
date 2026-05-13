const { pool } = require('../config/db');

let ensureAssistantTablesPromise = null;

function ensureAssistantTables() {
  if (!ensureAssistantTablesPromise) {
    const query = `
      CREATE TABLE IF NOT EXISTS ai_chat_sessions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_chat_messages (
        id BIGSERIAL PRIMARY KEY,
        session_id BIGINT NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
        sender VARCHAR(20) NOT NULL,
        message_text TEXT NOT NULL,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE ai_chat_messages
      ADD COLUMN IF NOT EXISTS metadata JSONB NULL;
    `;

    ensureAssistantTablesPromise = pool.query(query);
  }

  return ensureAssistantTablesPromise;
}

async function createChatSession({ userId, title }) {
  await ensureAssistantTables();

  const query = `
    INSERT INTO ai_chat_sessions (
      user_id,
      title,
      status,
      created_at,
      updated_at
    )
    VALUES ($1, $2, 'active', NOW(), NOW())
    RETURNING
      id,
      title,
      status,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const { rows } = await pool.query(query, [userId, title]);
  return rows[0];
}

async function findChatSessionById(userId, sessionId) {
  await ensureAssistantTables();

  const query = `
    SELECT
      id,
      title,
      status,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM ai_chat_sessions
    WHERE user_id = $1
      AND id = $2
      AND status = 'active'
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId, sessionId]);
  return rows[0] || null;
}

async function listChatSessions(userId, limit) {
  await ensureAssistantTables();

  const query = `
    SELECT
      id,
      title,
      status,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM ai_chat_sessions
    WHERE user_id = $1
      AND status = 'active'
    ORDER BY updated_at DESC, id DESC
    LIMIT $2
  `;

  const { rows } = await pool.query(query, [userId, limit]);
  return rows;
}

async function touchChatSession(sessionId) {
  await ensureAssistantTables();

  const query = `
    UPDATE ai_chat_sessions
    SET updated_at = NOW()
    WHERE id = $1
  `;

  await pool.query(query, [sessionId]);
}

async function createChatMessage({
  sessionId,
  sender,
  messageText,
  metadata = null,
}) {
  await ensureAssistantTables();

  const query = `
    INSERT INTO ai_chat_messages (
      session_id,
      sender,
      message_text,
      metadata,
      created_at
    )
    VALUES ($1, $2, $3, $4::jsonb, NOW())
    RETURNING
      id,
      sender,
      message_text AS "messageText",
      metadata,
      created_at AS "createdAt"
  `;

  const { rows } = await pool.query(query, [
    sessionId,
    sender,
    messageText,
    metadata ? JSON.stringify(metadata) : null,
  ]);

  await touchChatSession(sessionId);
  return rows[0];
}

async function findChatMessages(userId, sessionId, limit) {
  await ensureAssistantTables();

  const query = `
    SELECT
      messages.id,
      messages.sender,
      messages.message_text AS "messageText",
      messages.metadata,
      messages.created_at AS "createdAt"
    FROM ai_chat_messages messages
    INNER JOIN ai_chat_sessions sessions
      ON sessions.id = messages.session_id
    WHERE sessions.user_id = $1
      AND sessions.id = $2
      AND sessions.status = 'active'
    ORDER BY messages.created_at DESC, messages.id DESC
    LIMIT $3
  `;

  const { rows } = await pool.query(query, [userId, sessionId, limit]);
  return rows.reverse();
}

async function findVocabularyContext(searchPatterns, limit) {
  if (searchPatterns.length === 0) {
    return [];
  }

  const query = `
    SELECT DISTINCT
      id,
      word,
      kana,
      romaji,
      meaning_vi AS "meaningVi",
      meaning_en AS "meaningEn",
      word_type AS "wordType",
      jlpt_level AS "jlptLevel",
      lesson_number AS "lessonNumber"
    FROM vocabulary
    WHERE EXISTS (
      SELECT 1
      FROM unnest($1::text[]) AS pattern(value)
      WHERE word ILIKE pattern.value
        OR kana ILIKE pattern.value
        OR romaji ILIKE pattern.value
        OR meaning_vi ILIKE pattern.value
        OR meaning_en ILIKE pattern.value
    )
    ORDER BY "jlptLevel" DESC NULLS LAST, "lessonNumber" ASC NULLS LAST, id ASC
    LIMIT $2
  `;

  const { rows } = await pool.query(query, [searchPatterns, limit]);
  return rows;
}

async function findKanjiContext(searchPatterns, limit) {
  if (searchPatterns.length === 0) {
    return [];
  }

  const query = `
    SELECT DISTINCT
      id,
      kanji,
      onyomi,
      kunyomi,
      meaning_vi AS "meaningVi",
      meaning_en AS "meaningEn",
      jlpt_level AS "jlptLevel",
      han_viet AS "hanViet",
      mnemonic
    FROM kanji
    WHERE EXISTS (
      SELECT 1
      FROM unnest($1::text[]) AS pattern(value)
      WHERE kanji ILIKE pattern.value
        OR onyomi ILIKE pattern.value
        OR kunyomi ILIKE pattern.value
        OR meaning_vi ILIKE pattern.value
        OR meaning_en ILIKE pattern.value
        OR han_viet ILIKE pattern.value
    )
    ORDER BY "jlptLevel" DESC NULLS LAST, id ASC
    LIMIT $2
  `;

  const { rows } = await pool.query(query, [searchPatterns, limit]);
  return rows;
}

async function findGrammarContext(searchPatterns, limit) {
  if (searchPatterns.length === 0) {
    return [];
  }

  const query = `
    WITH matched_grammar AS (
      SELECT DISTINCT
        id,
        title,
        pattern,
        meaning_vi AS "meaningVi",
        formation,
        explanation,
        usage_note AS "usageNote",
        jlpt_level AS "jlptLevel"
      FROM grammar_points
      WHERE EXISTS (
        SELECT 1
        FROM unnest($1::text[]) AS pattern_lookup(value)
        WHERE pattern ILIKE pattern_lookup.value
          OR title ILIKE pattern_lookup.value
          OR meaning_vi ILIKE pattern_lookup.value
          OR formation ILIKE pattern_lookup.value
          OR explanation ILIKE pattern_lookup.value
          OR usage_note ILIKE pattern_lookup.value
      )
      ORDER BY "jlptLevel" DESC NULLS LAST, id ASC
      LIMIT $2
    )
    SELECT
      matched_grammar.*,
      grammar_examples.id AS "exampleId",
      grammar_examples.example_jp AS "exampleJp",
      grammar_examples.example_kana AS "exampleKana",
      grammar_examples.example_vi AS "exampleVi"
    FROM matched_grammar
    LEFT JOIN grammar_examples
      ON grammar_examples.grammar_point_id = matched_grammar.id
    ORDER BY matched_grammar.id ASC, grammar_examples.id ASC
  `;

  const { rows } = await pool.query(query, [searchPatterns, limit]);
  return rows;
}

module.exports = {
  createChatMessage,
  createChatSession,
  findChatMessages,
  findChatSessionById,
  findGrammarContext,
  findKanjiContext,
  findVocabularyContext,
  listChatSessions,
};
