import { useState } from 'react'

const DEFAULT_STATS = Object.freeze({
  lessonsCompleted: 0,
  wordsUnlocked: 0,
  flashcardsCreated: 0,
  studyStreak: 0,
})

function createDefaultStats() {
  return {
    lessonsCompleted: DEFAULT_STATS.lessonsCompleted,
    wordsUnlocked: DEFAULT_STATS.wordsUnlocked,
    flashcardsCreated: DEFAULT_STATS.flashcardsCreated,
    studyStreak: DEFAULT_STATS.studyStreak,
  }
}

function parseProgressStats(savedProgress) {
  try {
    const progress = JSON.parse(savedProgress)

    return {
      lessonsCompleted: progress.completedLessons?.length || 0,
      wordsUnlocked: progress.unlockedWords?.length || 0,
      flashcardsCreated:
        progress.createdFlashcards?.length || progress.passedQuizzes?.length || 0,
      studyStreak: progress.studyStreak || 0,
    }
  } catch {
    return createDefaultStats()
  }
}

function getStatsFromStorage() {
  if (typeof window === 'undefined') {
    return createDefaultStats()
  }

  const savedProgress = window.localStorage.getItem('japaneseProgress')
  if (!savedProgress) {
    return createDefaultStats()
  }

  return parseProgressStats(savedProgress)
}

export function useDashboardStats() {
  const [stats] = useState(getStatsFromStorage)

  return stats
}
