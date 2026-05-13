const {
  findGrammarByLesson,
  findVocabularyByLesson,
} = require('../models/vocabulary.model');
const {
  findGrammarContext,
  findKanjiContext,
  findVocabularyContext,
} = require('../models/assistant.model');

const MAX_SEARCH_TERMS = 8;
const DEFAULT_LEVEL = 'N5';
const STOP_WORDS = new Set([
  'anh',
  'cho',
  'cua',
  'của',
  'em',
  'giai',
  'giải',
  'gi',
  'gì',
  'hoc',
  'học',
  'la',
  'là',
  'minh',
  'mình',
  'nghia',
  'nghĩa',
  'nhat',
  'nhật',
  'the',
  'thế',
  'tieng',
  'tiếng',
  'toi',
  'tôi',
  'tu',
  'từ',
  'va',
  'và',
  'voi',
  'với',
]);

function normalizeLevel(levelInput) {
  const normalizedLevel = String(levelInput || DEFAULT_LEVEL).trim().toUpperCase();

  if (/^N[1-5]$/.test(normalizedLevel)) {
    return normalizedLevel;
  }

  return DEFAULT_LEVEL;
}

function normalizeTerm(term) {
  return String(term || '')
    .trim()
    .replace(/[?!.。、「」『』()[\]{}:,;]+$/g, '')
    .replace(/^[?!.。、「」『』()[\]{}:,;]+/g, '');
}

function extractSearchTerms(message) {
  const rawTerms = [
    ...String(message || '').matchAll(/[\u3040-\u30ff\u3400-\u9fff々ー]+/gu),
    ...String(message || '').matchAll(/[\p{L}\p{N}〜~]+/gu),
  ].map((match) => normalizeTerm(match[0]));
  const terms = [];

  for (const term of rawTerms) {
    const lowerTerm = term.toLowerCase();

    if (
      term.length < 2
      || STOP_WORDS.has(lowerTerm)
      || /^n[1-5]$/i.test(term)
      || /^\d+$/.test(term)
      || terms.some((currentTerm) => currentTerm.toLowerCase() === lowerTerm)
    ) {
      continue;
    }

    terms.push(term);

    if (terms.length >= MAX_SEARCH_TERMS) {
      break;
    }
  }

  return terms;
}

function createSearchPatterns(terms) {
  return terms.map((term) => `%${term}%`);
}

function parseLessonReference(message, selectedLevel) {
  const text = String(message || '');
  const levelMatch = text.match(/\bN([1-5])\b/i);
  const lessonMatch = text.match(/(?:bài|bai|lesson)\s*(\d{1,3})/i);

  if (!lessonMatch) {
    return null;
  }

  return {
    level: levelMatch ? `N${levelMatch[1]}` : normalizeLevel(selectedLevel),
    lessonNumber: Number(lessonMatch[1]),
  };
}

function groupGrammarRows(rows) {
  const grammarById = new Map();

  for (const row of rows) {
    if (!grammarById.has(row.id)) {
      grammarById.set(row.id, {
        id: row.id,
        pattern: row.pattern,
        title: row.title || '',
        meaningVi: row.meaningVi || '',
        formation: row.formation || '',
        explanation: row.explanation || '',
        usageNote: row.usageNote || '',
        jlptLevel: row.jlptLevel || '',
        examples: [],
      });
    }

    if (row.exampleId && grammarById.get(row.id).examples.length < 2) {
      grammarById.get(row.id).examples.push({
        exampleJp: row.exampleJp,
        exampleKana: row.exampleKana || '',
        exampleVi: row.exampleVi || '',
      });
    }
  }

  return [...grammarById.values()];
}

function formatVocabularyContext(vocabulary) {
  if (vocabulary.length === 0) {
    return '';
  }

  return [
    'TỪ VỰNG TRONG DATABASE:',
    ...vocabulary.map((item) => {
      const reading = [item.kana, item.romaji].filter(Boolean).join(', ');

      return `- ${item.word}${reading ? ` (${reading})` : ''}`
        + ` [${item.jlptLevel || 'không rõ cấp'}]`
        + `: ${item.meaningVi || item.meaningEn || 'chưa có nghĩa'}`
        + `${item.wordType ? `. Loại từ: ${item.wordType}` : ''}`
        + `${item.lessonNumber ? `. Bài ${item.lessonNumber}` : ''}`;
    }),
  ].join('\n');
}

function formatKanjiContext(kanji) {
  if (kanji.length === 0) {
    return '';
  }

  return [
    'KANJI TRONG DATABASE:',
    ...kanji.map((item) => (
      `- ${item.kanji} [${item.jlptLevel || 'không rõ cấp'}]: ${item.meaningVi || item.meaningEn || ''}`
      + `${item.hanViet ? `. Hán Việt: ${item.hanViet}` : ''}`
      + `${item.onyomi ? `. On: ${item.onyomi}` : ''}`
      + `${item.kunyomi ? `. Kun: ${item.kunyomi}` : ''}`
      + `${item.mnemonic ? `. Mẹo nhớ: ${item.mnemonic}` : ''}`
    )),
  ].join('\n');
}

function formatGrammarContext(grammar) {
  if (grammar.length === 0) {
    return '';
  }

  return [
    'NGỮ PHÁP TRONG DATABASE:',
    ...grammar.map((item) => {
      const examples = item.examples
        .map((example) => ` Ví dụ: ${example.exampleJp}${example.exampleKana ? ` (${example.exampleKana})` : ''} - ${example.exampleVi}`)
        .join('');

      return `- ${item.pattern} [${item.jlptLevel || 'không rõ cấp'}]: ${item.meaningVi}`
        + `${item.formation ? `. Cấu trúc: ${item.formation}` : ''}`
        + `${item.explanation ? `. Giải thích: ${item.explanation}` : ''}`
        + `${examples}`;
    }),
  ].join('\n');
}

function formatLessonContext(lessonContext) {
  if (!lessonContext) {
    return '';
  }

  const vocabularyLines = lessonContext.vocabulary
    .slice(0, 8)
    .map((item) => `- ${item.word} (${item.kana || item.romaji || ''}): ${item.meaningVi || item.meaningEn || ''}`);
  const grammarLines = groupGrammarRows(lessonContext.grammar)
    .slice(0, 5)
    .map((item) => `- ${item.pattern}: ${item.meaningVi}${item.formation ? `; ${item.formation}` : ''}`);

  return [
    `NGỮ CẢNH BÀI HỌC ${lessonContext.level} BÀI ${lessonContext.lessonNumber}:`,
    vocabularyLines.length > 0 ? 'Từ vựng:\n' + vocabularyLines.join('\n') : '',
    grammarLines.length > 0 ? 'Ngữ pháp:\n' + grammarLines.join('\n') : '',
  ].filter(Boolean).join('\n');
}

function buildSources({
  vocabulary,
  kanji,
  grammar,
  lessonContext,
}) {
  const sources = [];

  if (lessonContext) {
    sources.push({
      type: 'lesson',
      label: `${lessonContext.level} bài ${lessonContext.lessonNumber}`,
      detail: `${lessonContext.vocabulary.length} từ vựng, ${groupGrammarRows(lessonContext.grammar).length} mẫu ngữ pháp`,
    });
  }

  for (const item of vocabulary.slice(0, 5)) {
    sources.push({
      type: 'vocabulary',
      label: item.word,
      detail: item.meaningVi || item.meaningEn || '',
    });
  }

  for (const item of groupGrammarRows(grammar).slice(0, 5)) {
    sources.push({
      type: 'grammar',
      label: item.pattern,
      detail: item.meaningVi,
    });
  }

  for (const item of kanji.slice(0, 4)) {
    sources.push({
      type: 'kanji',
      label: item.kanji,
      detail: item.meaningVi || item.meaningEn || '',
    });
  }

  return sources.slice(0, 12);
}

async function buildRagContext({ message, selectedLevel }) {
  const level = normalizeLevel(selectedLevel);
  const terms = extractSearchTerms(message);
  const searchPatterns = createSearchPatterns(terms);
  const lessonReference = parseLessonReference(message, level);

  const [
    vocabulary,
    grammarRows,
    kanji,
    lessonVocabulary,
    lessonGrammar,
  ] = await Promise.all([
    findVocabularyContext(searchPatterns, 8),
    findGrammarContext(searchPatterns, 6),
    findKanjiContext(searchPatterns, 4),
    lessonReference
      ? findVocabularyByLesson(lessonReference.level, lessonReference.lessonNumber)
      : Promise.resolve([]),
    lessonReference
      ? findGrammarByLesson(lessonReference.level, lessonReference.lessonNumber)
      : Promise.resolve([]),
  ]);
  const lessonContext = lessonReference
    ? {
      ...lessonReference,
      vocabulary: lessonVocabulary,
      grammar: lessonGrammar,
    }
    : null;
  const grammar = groupGrammarRows(grammarRows);
  const contextText = [
    formatLessonContext(lessonContext),
    formatVocabularyContext(vocabulary),
    formatGrammarContext(grammar),
    formatKanjiContext(kanji),
  ].filter(Boolean).join('\n\n');

  return {
    level,
    terms,
    contextText,
    sources: buildSources({
      vocabulary,
      grammar: grammarRows,
      kanji,
      lessonContext,
    }),
  };
}

module.exports = {
  buildRagContext,
};
