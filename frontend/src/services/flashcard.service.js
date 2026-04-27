import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Unable to load flashcards.'
}

export async function fetchMyFlashcardSets() {
  try {
    const response = await apiClient.get('/flashcards')
    return Array.isArray(response.data?.sets) ? response.data.sets : []
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function fetchMyFlashcardSet(setId) {
  try {
    const response = await apiClient.get(`/flashcards/${setId}`)
    return response.data?.set || null
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function createMyFlashcardSet(payload) {
  try {
    const response = await apiClient.post('/flashcards', payload)
    return response.data?.set || null
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function deleteMyFlashcardSet(setId) {
  try {
    await apiClient.delete(`/flashcards/${setId}`)
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
