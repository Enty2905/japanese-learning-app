import { Link, useLocation } from 'react-router-dom'
import { useRef } from 'react'
import { useAuthSession } from '../../hooks/use-auth-session'
import { ProtectedNavLink } from '../auth/protected-link'
import { AuthFab } from './auth-fab'

export function DashboardNav({ navItems }) {
  const { user } = useAuthSession()
  const location = useLocation()
  const menuRef = useRef(null)
  const visibleNavItems = user?.role === 'admin' && !navItems.some((item) => item.path === '/admin')
    ? [...navItems, { label: 'Quản trị', path: '/admin' }]
    : navItems
  const activePath = location.pathname.startsWith('/lessons') ? '/lessons' : location.pathname
  const renderLinks = () => visibleNavItems.map((item) => (
    <ProtectedNavLink
      key={item.path}
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) => `nav-link${isActive || activePath === item.path ? ' active' : ''}`}
      onClick={() => { if (menuRef.current) menuRef.current.open = false }}
    >
      {item.label === 'AI' ? 'Trợ lý học tập' : item.label}
    </ProtectedNavLink>
  ))

  return (
    <>
      <a className="skip-link" href="#main-content" onClick={() => document.querySelector('main')?.focus()}>Đến nội dung chính</a>
      <header className="top-nav">
        <Link to="/" className="brand" aria-label="Japanese Learning — Trang chủ">
          <span className="brand-logo" aria-hidden="true">JP</span>
          <span className="brand-text"><strong>Japanese Learning</strong><small>Học từng chút. Hiểu thật sâu.</small></span>
        </Link>
        <nav className="nav-links" aria-label="Điều hướng chính">{renderLinks()}</nav>
        <div className="nav-account"><AuthFab /></div>
        <details className="mobile-nav" ref={menuRef} key={location.pathname} onKeyDown={(event) => {
          if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() }
        }}>
          <summary aria-label="Mở menu điều hướng">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            Menu
          </summary>
          <nav aria-label="Điều hướng di động">{renderLinks()}</nav>
        </details>
      </header>
    </>
  )
}
