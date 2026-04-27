import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Không tải được tiến độ.'
}

export async function fetchProgressOverview() {
  try {
    const response = await apiClient.get('/progress/overview')
    return response.data?.overview || null
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
