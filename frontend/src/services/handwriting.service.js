import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Không nhận diện được chữ viết tay.'
}

export async function fetchHandwritingHealth() {
  try {
    const response = await apiClient.get('/handwriting/health')

    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function predictHandwriting({ imageDataUrl }) {
  try {
    const response = await apiClient.post('/handwriting/predict', {
      imageDataUrl,
    })

    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
