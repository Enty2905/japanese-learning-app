import { useEffect, useState } from 'react'
import { fetchLessonsByLevel } from '../services/lessons.service'

function createInitialState() {
  return {
    lessons: [],
    isLoading: true,
    errorMessage: '',
  }
}

export function useLessonsData(level) {
  const [state, setState] = useState(createInitialState)

  useEffect(() => {
    let isMounted = true

    async function loadLessons() {
      setState((previousState) => ({
        ...previousState,
        isLoading: true,
        errorMessage: '',
      }))

      try {
        const lessons = await fetchLessonsByLevel(level)

        if (!isMounted) {
          return
        }

        setState({
          lessons,
          isLoading: false,
          errorMessage: '',
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState({
          lessons: [],
          isLoading: false,
          errorMessage: error.message,
        })
      }
    }

    loadLessons()

    return () => {
      isMounted = false
    }
  }, [level])

  return state
}
