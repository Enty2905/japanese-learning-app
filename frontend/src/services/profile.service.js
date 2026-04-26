import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Unable to load profile data.'
}

export async function fetchMyProfile() {
  try {
    const response = await apiClient.get('/profile/me')
    return response.data?.profile || null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}
