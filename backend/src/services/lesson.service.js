const {
  findGrammarByLesson,
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

function createLessonDescription(level, lessonNumber, vocabularyCount, grammarCount) {
  const grammarPart = grammarCount > 0 ? ` và ${grammarCount} mẫu ngữ pháp` : '';
  return `Bài ${lessonNumber} cấp độ ${level.toUpperCase()} với ${vocabularyCount} từ vựng${grammarPart}.`;
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

function mapGrammarRowsToItems(rows) {
  const grammarById = new Map();

  for (const row of rows) {
    if (!grammarById.has(row.id)) {
      grammarById.set(row.id, {
        id: row.id,
        title: row.title || '',
        pattern: row.pattern,
        meaningVi: row.meaningVi || '',
        explanation: row.explanation || '',
        usageNote: row.usageNote || '',
        restriction: row.restriction || '',
        nuance: row.nuance || '',
        formation: row.formation || '',
        jlptLevel: row.jlptLevel || '',
        examples: [],
      });
    }

    if (row.exampleId) {
      grammarById.get(row.id).examples.push({
        id: row.exampleId,
        exampleJp: row.exampleJp,
        exampleKana: row.exampleKana || '',
        exampleVi: row.exampleVi || '',
        audioUrl: row.exampleAudioUrl || '',
      });
    }
  }

  return [...grammarById.values()];
}

function buildLessonSummary(level, row) {
  const estimatedTime = Math.max(
    12,
    Math.min(45, Math.round(row.vocabularyCount * 1.2 + row.grammarCount * 3)),
  );

  return {
    id: createLessonId(level, row.lessonNumber),
    lessonNumber: row.lessonNumber,
    title: `Bài ${row.lessonNumber}`,
    description: createLessonDescription(
      level,
      row.lessonNumber,
      row.vocabularyCount,
      row.grammarCount,
    ),
    estimatedTime,
    vocabularyCount: row.vocabularyCount,
    grammarCount: row.grammarCount || 0,
    grammar: [],
    // Temporary fallback until kanji are mapped by lesson.
    kanji: row.sampleWord ? [row.sampleWord] : [],
  };
}

function buildLessonContent(lessonNumber, vocabularyItems, grammarItems) {
  const sampleWords = vocabularyItems
    .slice(0, 5)
    .map((item) => `- ${item.japanese} (${item.romaji}): ${item.meaningVi || item.english}`)
    .join('\n');
  const sampleGrammar = grammarItems
    .slice(0, 3)
    .map((item) => `- ${item.pattern}: ${item.meaningVi}`)
    .join('\n');

  return `# Bài ${lessonNumber}\nLuyện từ vựng và ngữ pháp trọng tâm của bài.\n\n## Từ vựng\n${sampleWords}\n\n## Ngữ pháp\n${sampleGrammar || 'Chưa có mẫu ngữ pháp được liên kết.'}`;
}

async function getLessonsByLevel(levelInput) {
  const level = normalizeLevel(levelInput);
  const levelRows = await findLessonsByLevel(level.toUpperCase());

  return levelRows.map((row) => buildLessonSummary(level, row));
}

async function getLessonByLevelAndNumber(levelInput, lessonNumberInput) {
  const level = normalizeLevel(levelInput);
  const lessonNumber = normalizeLessonNumber(lessonNumberInput);
  const [vocabularyRows, grammarRows] = await Promise.all([
    findVocabularyByLesson(level.toUpperCase(), lessonNumber),
    findGrammarByLesson(level.toUpperCase(), lessonNumber),
  ]);

  if (vocabularyRows.length === 0) {
    throw createHttpError(404, 'Không tìm thấy bài học.');
  }

  const vocabulary = vocabularyRows.map(mapVocabularyRowToItem);
  const grammar = mapGrammarRowsToItems(grammarRows);

  return {
    id: createLessonId(level, lessonNumber),
    lessonNumber,
    title: `Bài ${lessonNumber}`,
    description: createLessonDescription(level, lessonNumber, vocabulary.length, grammar.length),
    estimatedTime: Math.max(
      12,
      Math.min(45, Math.round(vocabulary.length * 1.2 + grammar.length * 3)),
    ),
    vocabulary,
    grammar,
    grammarCount: grammar.length,
    grammarSummary: grammar.slice(0, 8).map((item) => `${item.pattern} - ${item.meaningVi}`),
    // Temporary fallback until kanji have lesson mapping.
    kanji: vocabulary.slice(0, 8).map((item) => item.japanese),
    content: buildLessonContent(lessonNumber, vocabulary, grammar),
  };
}

module.exports = {
  getLessonsByLevel,
  getLessonByLevelAndNumber,
};
