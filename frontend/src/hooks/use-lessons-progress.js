import { useEffect, useState } from 'react'
import {
  completeLesson,
  fetchCompletedLessons,
} from '../services/progress.service'

function createInitialState() {
  return {
    completedLessons: new Set(),
    isProgressLoading: true,
    progressErrorMessage: '',
  }
}

function parseLessonId(lessonId) {
  const match = /^([a-z][0-9])-l([1-9][0-9]*)$/i.exec(lessonId || '')

  if (!match) {
    return null
  }

  return {
    level: match[1].toLowerCase(),
    lessonNumber: Number(match[2]),
  }
}

function parseLessonPayload(lessonInput) {
  if (typeof lessonInput === 'string') {
    return parseLessonId(lessonInput)
  }

  if (typeof lessonInput === 'object' && lessonInput !== null) {
    return parseLessonId(lessonInput.id)
  }

  return null
}

export function useLessonsProgress() {
  const [state, setState] = useState(createInitialState)

  useEffect(() => {
    let isMounted = true

    async function loadCompletedLessons() {
      setState((previousState) => ({
        ...previousState,
        isProgressLoading: true,
        progressErrorMessage: '',
      }))

      try {
        const completedLessons = await fetchCompletedLessons()

        if (!isMounted) {
          return
        }

        setState({
          completedLessons: new Set(completedLessons),
          isProgressLoading: false,
          progressErrorMessage: '',
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState({
          completedLessons: new Set(),
          isProgressLoading: false,
          progressErrorMessage: error.message,
        })
      }
    }

    loadCompletedLessons()

    return () => {
      isMounted = false
    }
  }, [])

  const markLessonCompleted = async (lessonInput) => {
    const lessonPayload = parseLessonPayload(lessonInput)

    if (!lessonPayload) {
      return null
    }

    const progress = await completeLesson(lessonPayload)
    const completedLessonId = progress?.lessonId

    if (completedLessonId) {
      setState((previousState) => {
        const nextCompletedLessons = new Set(previousState.completedLessons)
        nextCompletedLessons.add(completedLessonId)

        return {
          ...previousState,
          completedLessons: nextCompletedLessons,
          progressErrorMessage: '',
        }
      })
    }

    return progress
  }

  return {
    completedLessons: state.completedLessons,
    isProgressLoading: state.isProgressLoading,
    progressErrorMessage: state.progressErrorMessage,
    markLessonCompleted,
  }
}
