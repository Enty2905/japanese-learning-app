import { useState } from 'react'
import { normalizeLessonVocabulary } from '../utils/lesson-vocabulary'

const PROGRESS_STORAGE_KEY = 'japaneseProgress'

function readProgress() {
  if (typeof window === 'undefined') {
    return {}
  }

  const savedProgress = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
  if (!savedProgress) {
    return {}
  }

  try {
    const parsedProgress = JSON.parse(savedProgress)
    return typeof parsedProgress === 'object' && parsedProgress !== null
      ? parsedProgress
      : {}
  } catch {
    return {}
  }
}

function readCompletedLessons() {
  const progress = readProgress()
  const completedLessons = progress.completedLessons

  return Array.isArray(completedLessons) ? new Set(completedLessons) : new Set()
}

function persistCompletedLessons(completedLessons) {
  if (typeof window === 'undefined') {
    return
  }

  const progress = readProgress()

  window.localStorage.setItem(
    PROGRESS_STORAGE_KEY,
    JSON.stringify({
      ...progress,
      completedLessons: Array.from(completedLessons),
    }),
  )
}

function persistProgress(completedLessons, unlockedWords) {
  if (typeof window === 'undefined') {
    return
  }

  const progress = readProgress()
  const existingUnlockedWords = Array.isArray(progress.unlockedWords)
    ? progress.unlockedWords
    : []
  const mergedUnlockedWords = Array.from(
    new Set([...existingUnlockedWords, ...unlockedWords]),
  )

  window.localStorage.setItem(
    PROGRESS_STORAGE_KEY,
    JSON.stringify({
      ...progress,
      completedLessons: Array.from(completedLessons),
      unlockedWords: mergedUnlockedWords,
    }),
  )
}

function parseLessonPayload(lessonInput) {
  if (typeof lessonInput === 'string') {
    return {
      lessonId: lessonInput,
      vocabulary: [],
    }
  }

  if (typeof lessonInput === 'object' && lessonInput !== null) {
    return {
      lessonId: lessonInput.id,
      vocabulary: normalizeLessonVocabulary(lessonInput.vocabulary),
    }
  }

  return {
    lessonId: '',
    vocabulary: [],
  }
}

export function useLessonsProgress() {
  const [completedLessons, setCompletedLessons] = useState(readCompletedLessons)

  const markLessonCompleted = (lessonInput) => {
    const { lessonId, vocabulary } = parseLessonPayload(lessonInput)

    if (!lessonId) {
      return
    }

    const unlockedWords = vocabulary.map((word) => word.japanese)

    setCompletedLessons((previousState) => {
      if (previousState.has(lessonId)) {
        persistCompletedLessons(previousState)
        return previousState
      }

      const nextState = new Set(previousState)
      nextState.add(lessonId)
      persistProgress(nextState, unlockedWords)

      return nextState
    })
  }

  return {
    completedLessons,
    markLessonCompleted,
  }
}
