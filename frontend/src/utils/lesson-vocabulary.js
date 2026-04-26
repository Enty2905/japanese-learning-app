function normalizeVocabularyEntry(entry, index) {
  if (typeof entry === 'string') {
    return {
      japanese: `単語${index}`,
      romaji: entry,
      english: `Word ${index}`,
    }
  }

  if (typeof entry === 'object' && entry !== null) {
    return {
      japanese: entry.japanese || entry.word || `単語${index}`,
      romaji: entry.romaji || entry.reading || `tango${index}`,
      english: entry.english || entry.meaning || `Word ${index}`,
    }
  }

  return {
    japanese: `単語${index}`,
    romaji: `tango${index}`,
    english: `Word ${index}`,
  }
}

export function normalizeLessonVocabulary(vocabulary) {
  if (!Array.isArray(vocabulary)) {
    return []
  }

  return vocabulary.map((entry, index) => normalizeVocabularyEntry(entry, index))
}
