import { Link } from 'react-router-dom'
import { useAuthSession } from '../../hooks/use-auth-session'

export function AuthFab() {
  const { isAuthenticated, user } = useAuthSession()
  const name = user?.displayName || user?.fullName || 'Hồ sơ'
  return isAuthenticated ? (
    <Link to="/profile" className="auth-fab auth-fab--avatar" aria-label={`Mở hồ sơ của ${name}`}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-3a7 7 0 0 1 14 0v3" /></svg>
      <span>Hồ sơ</span>
    </Link>
  ) : (
    <Link to="/auth" className="auth-fab"><span>Đăng nhập</span><span aria-hidden="true">↗</span></Link>
  )
}
