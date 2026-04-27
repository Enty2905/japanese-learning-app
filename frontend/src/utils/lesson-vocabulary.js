function normalizeVocabularyEntry(entry, index) {
  if (typeof entry === 'string') {
    return {
      japanese: `単語${index}`,
      romaji: entry,
      english: `Từ ${index}`,
    }
  }

  if (typeof entry === 'object' && entry !== null) {
    return {
      japanese: entry.japanese || entry.word || `単語${index}`,
      romaji: entry.romaji || entry.reading || `tango${index}`,
      english: entry.meaningVi || entry.english || entry.meaning || `Từ ${index}`,
    }
  }

  return {
    japanese: `単語${index}`,
    romaji: `tango${index}`,
    english: `Từ ${index}`,
  }
}

export function normalizeLessonVocabulary(vocabulary) {
  if (!Array.isArray(vocabulary)) {
    return []
  }

  return vocabulary.map((entry, index) => normalizeVocabularyEntry(entry, index))
}
