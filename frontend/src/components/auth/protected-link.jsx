import { Link, NavLink } from 'react-router-dom'
import { useAuthSession } from '../../hooks/use-auth-session'
import { isLoginRequiredPath, notifyLoginRequired } from './auth-guard'

function joinClassName(className, isLocked) {
  if (!isLocked) {
    return className
  }

  return [className, 'is-auth-locked'].filter(Boolean).join(' ')
}

function useProtectedClick(to, onClick) {
  const { isAuthenticated } = useAuthSession()
  const isLocked = isLoginRequiredPath(to) && !isAuthenticated

  const handleClick = (event) => {
    if (isLocked) {
      event.preventDefault()
      notifyLoginRequired()
      return
    }

    onClick?.(event)
  }

  return {
    isLocked,
    handleClick,
  }
}

export function ProtectedLink({ to, className, onClick, ...props }) {
  const { isLocked, handleClick } = useProtectedClick(to, onClick)

  return (
    <Link
      {...props}
      to={to}
      className={joinClassName(className, isLocked)}
      aria-disabled={isLocked || undefined}
      onClick={handleClick}
    />
  )
}

export function ProtectedNavLink({ to, className, onClick, ...props }) {
  const { isLocked, handleClick } = useProtectedClick(to, onClick)
  const resolvedClassName = typeof className === 'function'
    ? (navState) => joinClassName(className(navState), isLocked)
    : joinClassName(className, isLocked)

  return (
    <NavLink
      {...props}
      to={to}
      className={resolvedClassName}
      aria-disabled={isLocked || undefined}
      onClick={handleClick}
    />
  )
}
