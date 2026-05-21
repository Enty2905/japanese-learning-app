import apiClient from './api-client'

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Không tải được dữ liệu quản trị.'
}

export async function fetchAdminOverview() {
  try {
    const response = await apiClient.get('/admin/overview')
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function fetchAdminUsers(filters) {
  try {
    const response = await apiClient.get('/admin/users', {
      params: filters,
    })

    return {
      users: Array.isArray(response.data?.users) ? response.data.users : [],
      pagination: response.data?.pagination || null,
    }
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function fetchAdminContent(contentType, filters) {
  try {
    const response = await apiClient.get(`/admin/content/${contentType}`, {
      params: filters,
    })

    return {
      items: Array.isArray(response.data?.items) ? response.data.items : [],
      pagination: response.data?.pagination || null,
    }
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function createAdminContent(contentType, payload) {
  try {
    const response = await apiClient.post(`/admin/content/${contentType}`, payload)
    return response.data?.item || null
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function updateAdminContent(contentType, itemId, payload) {
  try {
    const response = await apiClient.patch(`/admin/content/${contentType}/${itemId}`, payload)
    return response.data?.item || null
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function deleteAdminContent(contentType, itemId) {
  try {
    await apiClient.delete(`/admin/content/${contentType}/${itemId}`)
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

export async function updateAdminUser(userId, payload) {
  try {
    const response = await apiClient.patch(`/admin/users/${userId}`, payload)
    return response.data?.user || null
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
