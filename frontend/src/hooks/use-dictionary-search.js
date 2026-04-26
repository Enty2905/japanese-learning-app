import { useEffect, useState } from 'react'
import { searchDictionary } from '../services/dictionary.service'

function createInitialState() {
  return {
    result: {
      type: 'vocabulary',
      query: '',
      vocabulary: [],
      kanji: [],
    },
    isLoading: false,
    errorMessage: '',
  }
}

export function useDictionarySearch(query, type) {
  const [state, setState] = useState(createInitialState)

  useEffect(() => {
    let isMounted = true
    const normalizedQuery = typeof query === 'string' ? query.trim() : ''

    if (!normalizedQuery) {
      return () => {
        isMounted = false
      }
    }

    async function loadDictionaryResult() {
      setState((currentState) => ({
        ...currentState,
        isLoading: true,
        errorMessage: '',
      }))

      try {
        const result = await searchDictionary({
          query: normalizedQuery,
          type,
        })

        if (!isMounted) {
          return
        }

        setState({
          result,
          isLoading: false,
          errorMessage: '',
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState({
          result: {
            type,
            query: normalizedQuery,
            vocabulary: [],
            kanji: [],
          },
          isLoading: false,
          errorMessage: error.message,
        })
      }
    }

    loadDictionaryResult()

    return () => {
      isMounted = false
    }
  }, [query, type])

  if (!(typeof query === 'string' && query.trim())) {
    return {
      result: {
        type,
        query: '',
        vocabulary: [],
        kanji: [],
      },
      isLoading: false,
      errorMessage: '',
    }
  }

  return state
}
