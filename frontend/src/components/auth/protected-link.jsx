import { Link, NavLink } from 'react-router-dom'
import { useAuthSession } from '../../hooks/use-auth-session'
import { isLoginRequiredPath } from './auth-guard'

function joinClassName(className, isLocked) {
  if (!isLocked) {
    return className
  }

  return [className, 'is-auth-locked'].filter(Boolean).join(' ')
}

function useProtectedClick(to, onClick) {
  const { isAuthenticated } = useAuthSession()
  const isLocked = isLoginRequiredPath(to) && !isAuthenticated

  const handleClick = (event) => onClick?.(event)
  const pathname = typeof to === 'string' ? to : `${to.pathname || '/'}${to.search || ''}${to.hash || ''}`

  return {
    destination: isLocked ? `/auth?redirect=${encodeURIComponent(pathname)}` : to,
    isLocked,
    handleClick,
  }
}

export function ProtectedLink({ to, className, onClick, ...props }) {
  const { isLocked, handleClick, destination } = useProtectedClick(to, onClick)

  return (
    <Link
      {...props}
      to={destination}
      className={joinClassName(className, isLocked)}
      title={isLocked ? 'Đăng nhập để tiếp tục' : props.title}
      onClick={handleClick}
    />
  )
}

export function ProtectedNavLink({ to, className, onClick, ...props }) {
  const { isLocked, handleClick, destination } = useProtectedClick(to, onClick)
  const resolvedClassName = typeof className === 'function'
    ? (navState) => joinClassName(className(navState), isLocked)
    : joinClassName(className, isLocked)

  return (
    <NavLink
      {...props}
      to={destination}
      className={resolvedClassName}
      title={isLocked ? 'Đăng nhập để tiếp tục' : props.title}
      onClick={handleClick}
    />
  )
}
