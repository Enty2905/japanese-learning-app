import { Navigate, useLocation } from 'react-router-dom'
import { useAuthSession } from '../../hooks/use-auth-session'

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthSession()
  const location = useLocation()
  if (!isAuthenticated) {
    const destination = location.pathname + location.search + location.hash
    return <Navigate to={`/auth?redirect=${encodeURIComponent(destination)}`} replace />
  }
  return children
}
