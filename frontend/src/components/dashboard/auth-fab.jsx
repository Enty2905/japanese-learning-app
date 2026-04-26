import { Link } from 'react-router-dom'
import { useAuthSession } from '../../hooks/use-auth-session'

function buildAvatarLabel(user) {
  const candidate = user?.displayName || user?.fullName || user?.email || ''
  const normalizedCandidate = candidate.trim()

  if (!normalizedCandidate) {
    return 'U'
  }

  const parts = normalizedCandidate.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return normalizedCandidate.slice(0, 2).toUpperCase()
}

export function AuthFab() {
  const { isAuthenticated, user } = useAuthSession()

  if (isAuthenticated) {
    return (
      <Link to="/profile" className="auth-fab auth-fab--avatar" aria-label="Open profile">
        <span className="auth-fab-avatar-text">{buildAvatarLabel(user)}</span>
      </Link>
    )
  }

  return (
    <Link to="/auth" className="auth-fab" aria-label="Open login or sign up page">
      <span>Login</span>
      <span>/</span>
      <span>Sign Up</span>
    </Link>
  )
}
