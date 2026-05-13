import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Không gửi được câu hỏi cho AI Assistant.'
}

export async function sendAssistantMessage({
  message,
  sessionId,
  level,
}) {
  try {
    const response = await apiClient.post('/assistant/chat', {
      message,
      sessionId,
      level,
    })

    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function fetchAssistantSessions() {
  try {
    const response = await apiClient.get('/assistant/sessions')

    return response.data.sessions || []
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function fetchAssistantSessionMessages(sessionId) {
  try {
    const response = await apiClient.get(`/assistant/sessions/${sessionId}`)

    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
