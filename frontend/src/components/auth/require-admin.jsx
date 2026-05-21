import { Navigate } from 'react-router-dom'
import { useAuthSession } from '../../hooks/use-auth-session'

export function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuthSession()

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
