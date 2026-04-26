import { useEffect, useState } from 'react'
import { fetchLessonDetail } from '../services/lessons.service'

function createInitialState() {
  return {
    lesson: null,
    isLoading: true,
    errorMessage: '',
  }
}

export function useLessonDetail(level, lessonNumber) {
  const [state, setState] = useState(createInitialState)

  useEffect(() => {
    let isMounted = true

    setState({
      lesson: null,
      isLoading: true,
      errorMessage: '',
    })

    fetchLessonDetail(level, lessonNumber)
      .then((lesson) => {
        if (!isMounted) {
          return
        }

        setState({
          lesson,
          isLoading: false,
          errorMessage: '',
        })
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        setState({
          lesson: null,
          isLoading: false,
          errorMessage: error.message,
        })
      })

    return () => {
      isMounted = false
    }
  }, [level, lessonNumber])

  return state
}
