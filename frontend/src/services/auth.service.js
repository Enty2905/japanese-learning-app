import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Đã xảy ra lỗi ngoài ý muốn.'
}

export async function register(payload) {
  try {
    const response = await apiClient.post('/auth/register', payload)
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function login(payload) {
  try {
    const response = await apiClient.post('/auth/login', payload)
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
