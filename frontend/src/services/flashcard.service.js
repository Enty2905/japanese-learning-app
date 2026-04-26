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

export async function fetchMyFlashcards() {
  try {
    const response = await apiClient.get('/flashcards')
    return Array.isArray(response.data?.flashcards) ? response.data.flashcards : []
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function createMyFlashcards(cards) {
  try {
    const response = await apiClient.post('/flashcards', { cards })
    return Array.isArray(response.data?.flashcards) ? response.data.flashcards : []
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function deleteMyFlashcard(flashcardId) {
  try {
    await apiClient.delete(`/flashcards/${flashcardId}`)
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
