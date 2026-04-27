import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Không tải được dữ liệu hồ sơ.'
}

export async function fetchMyProfile() {
  try {
    const response = await apiClient.get('/profile/me')
    return response.data?.profile || null
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
