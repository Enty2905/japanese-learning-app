const { pool } = require('../config/db');

let ensureHistoryTablePromise = null;

function ensureDictionarySearchHistoryTable() {
  if (!ensureHistoryTablePromise) {
    const query = `
      CREATE TABLE IF NOT EXISTS dictionary_search_history (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        query_text VARCHAR(80) NOT NULL,
        search_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    ensureHistoryTablePromise = pool.query(query);
  }

  return ensureHistoryTablePromise;
}

async function findVocabularyMatches(queryText, limit) {
  const containsPattern = `%${queryText}%`;
  const startsPattern = `${queryText}%`;
  const query = `
    SELECT
      id,
      word,
      kana,
      romaji,
      meaning_vi AS "meaningVi",
      meaning_en AS "meaningEn",
      word_type AS "wordType",
      jlpt_level AS "jlptLevel",
      accent,
      audio_url AS "audioUrl",
      image_url AS "imageUrl",
      notes,
      tags
    FROM vocabulary
    WHERE word ILIKE $1
      OR kana ILIKE $1
      OR romaji ILIKE $1
      OR meaning_vi ILIKE $1
      OR meaning_en ILIKE $1
    ORDER BY
      CASE
        WHEN word = $2 THEN 0
        WHEN kana = $2 THEN 1
        WHEN word ILIKE $3 THEN 2
        WHEN kana ILIKE $3 THEN 3
        ELSE 4
      END,
      id ASC
    LIMIT $4
  `;

  const { rows } = await pool.query(query, [
    containsPattern,
    queryText,
    startsPattern,
    limit,
  ]);
  return rows;
}

async function findVocabularyExamples(vocabularyIds) {
  if (vocabularyIds.length === 0) {
    return [];
  }

  const query = `
    SELECT
      id,
      vocabulary_id AS "vocabularyId",
      example_jp AS "exampleJp",
      example_kana AS "exampleKana",
      example_vi AS "exampleVi",
      audio_url AS "audioUrl"
    FROM vocabulary_examples
    WHERE vocabulary_id = ANY($1::bigint[])
    ORDER BY vocabulary_id ASC, id ASC
  `;

  const { rows } = await pool.query(query, [vocabularyIds]);
  return rows;
}

async function findKanjiMatches(queryText, limit) {
  const containsPattern = `%${queryText}%`;
  const startsPattern = `${queryText}%`;
  const query = `
    SELECT
      id,
      kanji,
      onyomi,
      kunyomi,
      meaning_vi AS "meaningVi",
      meaning_en AS "meaningEn",
      stroke_count AS "strokeCount",
      radical,
      jlpt_level AS "jlptLevel",
      unicode_code AS "unicodeCode",
      writing_svg_url AS "writingSvgUrl",
      han_viet AS "hanViet",
      mnemonic
    FROM kanji
    WHERE kanji ILIKE $1
      OR onyomi ILIKE $1
      OR kunyomi ILIKE $1
      OR meaning_vi ILIKE $1
      OR meaning_en ILIKE $1
      OR han_viet ILIKE $1
    ORDER BY
      CASE
        WHEN kanji = $2 THEN 0
        WHEN han_viet ILIKE $3 THEN 1
        WHEN onyomi ILIKE $3 THEN 2
        WHEN kunyomi ILIKE $3 THEN 3
        ELSE 4
      END,
      id ASC
    LIMIT $4
  `;

  const { rows } = await pool.query(query, [
    containsPattern,
    queryText,
    startsPattern,
    limit,
  ]);
  return rows;
}

async function findKanjiByCharacters(characters) {
  if (characters.length === 0) {
    return [];
  }

  const query = `
    SELECT
      id,
      kanji,
      onyomi,
      kunyomi,
      meaning_vi AS "meaningVi",
      meaning_en AS "meaningEn",
      stroke_count AS "strokeCount",
      radical,
      jlpt_level AS "jlptLevel",
      unicode_code AS "unicodeCode",
      writing_svg_url AS "writingSvgUrl",
      han_viet AS "hanViet",
      mnemonic
    FROM kanji
    WHERE kanji = ANY($1::text[])
    ORDER BY array_position($1::text[], kanji)
  `;

  const { rows } = await pool.query(query, [characters]);
  return rows;
}

async function findKanjiExamples(kanjiIds) {
  if (kanjiIds.length === 0) {
    return [];
  }

  const query = `
    SELECT
      id,
      kanji_id AS "kanjiId",
      example_jp AS "exampleJp",
      example_kana AS "exampleKana",
      example_vi AS "exampleVi",
      audio_url AS "audioUrl"
    FROM kanji_examples
    WHERE kanji_id = ANY($1::bigint[])
    ORDER BY kanji_id ASC, id ASC
  `;

  const { rows } = await pool.query(query, [kanjiIds]);
  return rows;
}

async function findRandomKanjiMemoryHints(limit) {
  const query = `
    SELECT
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
    WHERE mnemonic IS NOT NULL
      AND BTRIM(mnemonic) <> ''
    ORDER BY RANDOM()
    LIMIT $1
  `;

  const { rows } = await pool.query(query, [limit]);
  return rows;
}

async function createDictionarySearchHistory({ userId, queryText, searchType }) {
  await ensureDictionarySearchHistoryTable();

  const query = `
    INSERT INTO dictionary_search_history (user_id, query_text, search_type)
    VALUES ($1, $2, $3)
  `;

  await pool.query(query, [userId, queryText, searchType]);
}

async function findDictionarySearchHistory(userId, limit) {
  await ensureDictionarySearchHistoryTable();

  const query = `
    SELECT query_text AS "queryText", search_type AS "searchType", MAX(created_at) AS "createdAt"
    FROM dictionary_search_history
    WHERE user_id = $1
    GROUP BY query_text, search_type
    ORDER BY "createdAt" DESC
    LIMIT $2
  `;

  const { rows } = await pool.query(query, [userId, limit]);
  return rows;
}

module.exports = {
  createDictionarySearchHistory,
  findDictionarySearchHistory,
  findKanjiByCharacters,
  findKanjiExamples,
  findKanjiMatches,
  findRandomKanjiMemoryHints,
  findVocabularyExamples,
  findVocabularyMatches,
};
