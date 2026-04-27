import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Unable to search dictionary.'
}

export async function searchDictionary({ query, type }) {
  try {
    const response = await apiClient.get('/dictionary/search', {
      params: {
        q: query,
        type,
      },
    })

    return {
      type: response.data?.type || type,
      query: response.data?.query || query,
      vocabulary: Array.isArray(response.data?.vocabulary) ? response.data.vocabulary : [],
      kanji: Array.isArray(response.data?.kanji) ? response.data.kanji : [],
      history: Array.isArray(response.data?.history) ? response.data.history : [],
    }
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function fetchDictionaryHistory() {
  try {
    const response = await apiClient.get('/dictionary/history')
    return Array.isArray(response.data?.history) ? response.data.history : []
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function fetchKanjiMemoryHints() {
  try {
    const response = await apiClient.get('/dictionary/kanji-memory-hints')
    return Array.isArray(response.data?.hints) ? response.data.hints : []
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
