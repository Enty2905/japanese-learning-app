const {
  findLessonsByLevel,
  findVocabularyByLesson,
} = require('../models/vocabulary.model');
const { createHttpError } = require('../utils/http-error');

const SUPPORTED_LEVELS = new Set(['n1', 'n2', 'n3', 'n4', 'n5']);

function normalizeLevel(level) {
  if (typeof level !== 'string') {
    throw createHttpError(400, 'Lesson level is required.');
  }

  const normalizedLevel = level.trim().toLowerCase();
  if (!SUPPORTED_LEVELS.has(normalizedLevel)) {
    throw createHttpError(400, 'Unsupported lesson level.');
  }

  return normalizedLevel;
}

function normalizeLessonNumber(lessonNumberInput) {
  const parsedLessonNumber = Number(lessonNumberInput);

  if (!Number.isInteger(parsedLessonNumber) || parsedLessonNumber <= 0) {
    throw createHttpError(400, 'Lesson number must be a positive integer.');
  }

  return parsedLessonNumber;
}

function createLessonId(level, lessonNumber) {
  return `${level}-l${lessonNumber}`;
}

function createLessonDescription(level, lessonNumber, vocabularyCount) {
  return `Lesson ${lessonNumber} for ${level.toUpperCase()} with ${vocabularyCount} vocabulary words.`;
}

function mapVocabularyRowToItem(row) {
  return {
    id: row.id,
    japanese: row.word,
    kana: row.kana,
    romaji: row.romaji || row.kana || row.word,
    english: row.meaningEn || row.meaningVi || '',
    meaningVi: row.meaningVi || '',
    meaningEn: row.meaningEn || '',
    wordType: row.wordType || '',
    jlptLevel: row.jlptLevel || '',
  };
}

function buildLessonSummary(level, row) {
  const estimatedTime = Math.max(12, Math.min(40, Math.round(row.vocabularyCount * 1.4)));

  return {
    id: createLessonId(level, row.lessonNumber),
    lessonNumber: row.lessonNumber,
    title: `Lesson ${row.lessonNumber}`,
    description: createLessonDescription(level, row.lessonNumber, row.vocabularyCount),
    estimatedTime,
    vocabularyCount: row.vocabularyCount,
    // Temporary fallback until grammar and kanji are mapped by lesson.
    grammar: row.sampleWord ? [row.sampleWord] : [],
    kanji: row.sampleWord ? [row.sampleWord] : [],
  };
}

function buildLessonContent(lessonNumber, vocabularyItems) {
  const sampleWords = vocabularyItems
    .slice(0, 5)
    .map((item) => `- ${item.japanese} (${item.romaji})`)
    .join('\n');

  return `# Lesson ${lessonNumber}\nPractice the vocabulary below and create your own example sentences.\n\n## Vocabulary\n${sampleWords}`;
}

async function getLessonsByLevel(levelInput) {
  const level = normalizeLevel(levelInput);
  const levelRows = await findLessonsByLevel(level.toUpperCase());

  return levelRows.map((row) => buildLessonSummary(level, row));
}

async function getLessonByLevelAndNumber(levelInput, lessonNumberInput) {
  const level = normalizeLevel(levelInput);
  const lessonNumber = normalizeLessonNumber(lessonNumberInput);
  const vocabularyRows = await findVocabularyByLesson(level.toUpperCase(), lessonNumber);

  if (vocabularyRows.length === 0) {
    throw createHttpError(404, 'Lesson not found.');
  }

  const vocabulary = vocabularyRows.map(mapVocabularyRowToItem);

  return {
    id: createLessonId(level, lessonNumber),
    lessonNumber,
    title: `Lesson ${lessonNumber}`,
    description: createLessonDescription(level, lessonNumber, vocabulary.length),
    estimatedTime: Math.max(12, Math.min(40, Math.round(vocabulary.length * 1.4))),
    vocabulary,
    // Temporary fallback until grammar and kanji have lesson mapping.
    grammar: vocabulary.slice(0, 8).map((item) => `${item.japanese} - ${item.english}`),
    kanji: vocabulary.slice(0, 8).map((item) => item.japanese),
    content: buildLessonContent(lessonNumber, vocabulary),
  };
}

module.exports = {
  getLessonsByLevel,
  getLessonByLevelAndNumber,
};
