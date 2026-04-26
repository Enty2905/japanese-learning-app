import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Unable to load lesson data.'
}

export async function fetchLessonsByLevel(level) {
  try {
    const response = await apiClient.get(`/lessons/${level}`)
    return Array.isArray(response.data?.lessons) ? response.data.lessons : []
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export async function fetchLessonDetail(level, lessonNumber) {
  try {
    const response = await apiClient.get(`/lessons/${level}/${lessonNumber}`)
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}
