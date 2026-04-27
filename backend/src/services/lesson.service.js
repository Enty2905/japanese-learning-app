const {
  findLessonsByLevel,
  findVocabularyByLesson,
} = require('../models/vocabulary.model');
const { createHttpError } = require('../utils/http-error');

const SUPPORTED_LEVELS = new Set(['n1', 'n2', 'n3', 'n4', 'n5']);

function normalizeLevel(level) {
  if (typeof level !== 'string') {
    throw createHttpError(400, 'Vui lòng chọn cấp độ bài học.');
  }

  const normalizedLevel = level.trim().toLowerCase();
  if (!SUPPORTED_LEVELS.has(normalizedLevel)) {
    throw createHttpError(400, 'Cấp độ bài học không được hỗ trợ.');
  }

  return normalizedLevel;
}

function normalizeLessonNumber(lessonNumberInput) {
  const parsedLessonNumber = Number(lessonNumberInput);

  if (!Number.isInteger(parsedLessonNumber) || parsedLessonNumber <= 0) {
    throw createHttpError(400, 'Số bài học phải là số nguyên dương.');
  }

  return parsedLessonNumber;
}

function createLessonId(level, lessonNumber) {
  return `${level}-l${lessonNumber}`;
}

function createLessonDescription(level, lessonNumber, vocabularyCount) {
  return `Bài ${lessonNumber} cấp độ ${level.toUpperCase()} với ${vocabularyCount} từ vựng.`;
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
    title: `Bài ${row.lessonNumber}`,
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

  return `# Bài ${lessonNumber}\nLuyện các từ vựng bên dưới và tự đặt câu ví dụ của riêng bạn.\n\n## Từ vựng\n${sampleWords}`;
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
    throw createHttpError(404, 'Không tìm thấy bài học.');
  }

  const vocabulary = vocabularyRows.map(mapVocabularyRowToItem);

  return {
    id: createLessonId(level, lessonNumber),
    lessonNumber,
    title: `Bài ${lessonNumber}`,
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
