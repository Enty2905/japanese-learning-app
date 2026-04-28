import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthSession } from '../../hooks/use-auth-session'
import { notifyLoginRequired } from './auth-guard'

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthSession()

  useEffect(() => {
    if (!isAuthenticated) {
      notifyLoginRequired()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return children
}
