import { Link, NavLink } from 'react-router-dom'
import { AuthFab } from './auth-fab'

export function DashboardNav({ navItems }) {
  return (
    <>
      <header className="top-nav">
        <Link to="/" className="brand" aria-label="Trang chủ Học tiếng Nhật">
          <div className="brand-logo">JP</div>
          <div className="brand-text">
            <span>Japanese </span>
            <span>Learning</span>
          </div>
        </Link>

        <nav className="nav-links" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <AuthFab />
      </header>

      <Link to="/assistant" className="assistant-robot-fab" aria-label="Mở chat với AI">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="assistant-robot-icon"
          aria-hidden="true"
        >
          <rect x="5" y="8" width="14" height="11" rx="3" />
          <path d="M12 4v3" />
          <path d="M9 13h.01" />
          <path d="M15 13h.01" />
          <path d="M9.5 16h5" />
        </svg>
      </Link>
    </>
  )
}
