import axios from 'axios'
import { getAuthSession } from './auth-session.service'

const DEFAULT_API_BASE_URL = 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const session = getAuthSession()

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`
  }

  return config
})

export default apiClient
