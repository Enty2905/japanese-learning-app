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

    setState((previousState) => ({
      ...previousState,
      isLoading: true,
      errorMessage: '',
    }))

    fetchLessonsByLevel(level)
      .then((lessons) => {
        if (!isMounted) {
          return
        }

        setState({
          lessons,
          isLoading: false,
          errorMessage: '',
        })
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        setState({
          lessons: [],
          isLoading: false,
          errorMessage: error.message,
        })
      })

    return () => {
      isMounted = false
    }
  }, [level])

  return state
}
