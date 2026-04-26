const {
  findKanjiByCharacters,
  findKanjiExamples,
  findKanjiMatches,
  findVocabularyExamples,
  findVocabularyMatches,
} = require('../models/dictionary.model');
const { createHttpError } = require('../utils/http-error');

const DEFAULT_LIMIT = 8;
const MAX_QUERY_LENGTH = 80;
const SUPPORTED_TYPES = new Set(['vocabulary', 'kanji']);

function normalizeSearchType(typeInput) {
  const type = typeof typeInput === 'string' ? typeInput.trim().toLowerCase() : 'vocabulary';

  if (!SUPPORTED_TYPES.has(type)) {
    throw createHttpError(400, 'Search type must be vocabulary or kanji.');
  }

  return type;
}

function normalizeSearchQuery(queryInput) {
  const query = typeof queryInput === 'string' ? queryInput.trim() : '';

  if (!query) {
    return '';
  }

  if (query.length > MAX_QUERY_LENGTH) {
    throw createHttpError(400, 'Search query is too long.');
  }

  return query;
}

function groupRowsById(rows, idField) {
  return rows.reduce((groups, row) => {
    const id = row[idField];

    if (!groups.has(id)) {
      groups.set(id, []);
    }

    groups.get(id).push(row);
    return groups;
  }, new Map());
}

function extractKanjiCharacters(text) {
  return Array.from(text || '').filter((character, index, characters) => {
    return /[\u3400-\u9fff]/u.test(character) && characters.indexOf(character) === index;
  });
}

function mapVocabulary(row, examplesByVocabularyId) {
  return {
    id: row.id,
    word: row.word,
    kana: row.kana || '',
    romaji: row.romaji || '',
    meaningVi: row.meaningVi || '',
    meaningEn: row.meaningEn || '',
    wordType: row.wordType || '',
    jlptLevel: row.jlptLevel || '',
    accent: row.accent || '',
    audioUrl: row.audioUrl || '',
    imageUrl: row.imageUrl || '',
    notes: row.notes || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    examples: examplesByVocabularyId.get(row.id) || [],
  };
}

function mapKanji(row, examplesByKanjiId = new Map()) {
  return {
    id: row.id,
    kanji: row.kanji,
    onyomi: row.onyomi || '',
    kunyomi: row.kunyomi || '',
    meaningVi: row.meaningVi || '',
    meaningEn: row.meaningEn || '',
    strokeCount: row.strokeCount || null,
    radical: row.radical || '',
    jlptLevel: row.jlptLevel || '',
    unicodeCode: row.unicodeCode || '',
    writingSvgUrl: row.writingSvgUrl || '',
    hanViet: row.hanViet || '',
    mnemonic: row.mnemonic || '',
    examples: examplesByKanjiId.get(row.id) || [],
  };
}

async function searchVocabulary(query) {
  const vocabularyRows = await findVocabularyMatches(query, DEFAULT_LIMIT);
  const vocabularyIds = vocabularyRows.map((row) => row.id);
  const exampleRows = await findVocabularyExamples(vocabularyIds);
  const examplesByVocabularyId = groupRowsById(exampleRows, 'vocabularyId');
  const kanjiCharacters = vocabularyRows.flatMap((row) => extractKanjiCharacters(row.word));
  const uniqueKanjiCharacters = [...new Set(kanjiCharacters)];
  const relatedKanjiRows = await findKanjiByCharacters(uniqueKanjiCharacters);

  return {
    vocabulary: vocabularyRows.map((row) => mapVocabulary(row, examplesByVocabularyId)),
    kanji: relatedKanjiRows.map((row) => mapKanji(row)),
  };
}

async function searchKanji(query) {
  const kanjiRows = await findKanjiMatches(query, DEFAULT_LIMIT);
  const kanjiIds = kanjiRows.map((row) => row.id);
  const exampleRows = await findKanjiExamples(kanjiIds);
  const examplesByKanjiId = groupRowsById(exampleRows, 'kanjiId');

  return {
    vocabulary: [],
    kanji: kanjiRows.map((row) => mapKanji(row, examplesByKanjiId)),
  };
}

async function searchDictionary(typeInput, queryInput) {
  const type = normalizeSearchType(typeInput);
  const query = normalizeSearchQuery(queryInput);

  if (!query) {
    return {
      type,
      query,
      vocabulary: [],
      kanji: [],
    };
  }

  const result = type === 'kanji'
    ? await searchKanji(query)
    : await searchVocabulary(query);

  return {
    type,
    query,
    ...result,
  };
}

module.exports = {
  searchDictionary,
};
