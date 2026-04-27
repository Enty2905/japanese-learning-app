import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Không tải được dấu trang.'
}

export async function fetchMyBookmarks() {
  try {
    const response = await apiClient.get('/bookmarks')
    return Array.isArray(response.data?.bookmarks) ? response.data.bookmarks : []
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
