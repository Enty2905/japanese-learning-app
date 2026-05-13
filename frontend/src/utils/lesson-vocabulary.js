function normalizeVocabularyEntry(entry, index) {
  if (typeof entry === 'string') {
    return {
      id: null,
      japanese: `単語${index}`,
      kana: '',
      romaji: entry,
      english: `Tu ${index}`,
      meaningVi: '',
    }
  }

  if (typeof entry === 'object' && entry !== null) {
    return {
      id: entry.id || null,
      japanese: entry.japanese || entry.word || `単語${index}`,
      kana: entry.kana || '',
      romaji: entry.romaji || entry.reading || `tango${index}`,
      english: entry.meaningVi || entry.english || entry.meaning || `Tu ${index}`,
      meaningVi: entry.meaningVi || '',
    }
  }

  return {
    id: null,
    japanese: `単語${index}`,
    kana: '',
    romaji: `tango${index}`,
    english: `Tu ${index}`,
    meaningVi: '',
  }
}

export function normalizeLessonVocabulary(vocabulary) {
  if (!Array.isArray(vocabulary)) {
    return []
  }

  return vocabulary.map((entry, index) => normalizeVocabularyEntry(entry, index))
}
