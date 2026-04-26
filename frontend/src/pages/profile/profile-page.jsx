import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { useAuthSession } from '../../hooks/use-auth-session'
import { fetchMyBookmarks } from '../../services/bookmark.service'
import { clearAuthSession } from '../../services/auth-session.service'
import { fetchMyProfile } from '../../services/profile.service'
import { fetchProgressOverview } from '../../services/progress.service'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './profile-page.css'

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

function formatErrorMessage(errors) {
  if (errors.length === 0) {
    return ''
  }

  return errors.join(' | ')
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthSession()
  const [profile, setProfile] = useState(null)
  const [progressOverview, setProgressOverview] = useState(null)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let isMounted = true

    setIsLoading(true)
    setErrorMessage('')

    Promise.allSettled([
      fetchMyProfile(),
      fetchProgressOverview(),
      fetchMyBookmarks(),
    ])
      .then((results) => {
        if (!isMounted) {
          return
        }

        const nextErrors = []

        const profileResult = results[0]
        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value)
        } else {
          nextErrors.push(profileResult.reason?.message || 'Failed to load profile.')
        }

        const progressResult = results[1]
        if (progressResult.status === 'fulfilled') {
          setProgressOverview(progressResult.value)
        } else {
          nextErrors.push(progressResult.reason?.message || 'Failed to load progress.')
        }

        const bookmarkResult = results[2]
        if (bookmarkResult.status === 'fulfilled') {
          setBookmarkCount(bookmarkResult.value.length)
        } else {
          nextErrors.push(bookmarkResult.reason?.message || 'Failed to load bookmarks.')
        }

        setErrorMessage(formatErrorMessage(nextErrors))
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  const displayUser = useMemo(() => profile || user, [profile, user])

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  const handleLogout = () => {
    clearAuthSession()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="dashboard-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="dashboard-main profile-main">
        <section className="profile-card">
          <header className="profile-header">
            <div className="profile-avatar">{buildAvatarLabel(displayUser)}</div>

            <div className="profile-identity">
              <h1>{displayUser?.fullName || displayUser?.displayName || 'User Profile'}</h1>
              <p>{displayUser?.email || ''}</p>
            </div>
          </header>

          <div className="profile-actions">
            <button type="button" onClick={handleLogout} className="profile-logout-btn">
              Log out
            </button>
            <Link to="/" className="profile-back-link">
              Back to Dashboard
            </Link>
          </div>

          {isLoading ? <p className="profile-feedback">Loading protected profile APIs...</p> : null}

          {!isLoading && errorMessage ? (
            <p className="profile-feedback profile-feedback--error">{errorMessage}</p>
          ) : null}
        </section>

        <section className="profile-stats-grid" aria-label="User account data">
          <article className="profile-stat-card">
            <p className="profile-stat-label">Role</p>
            <h2 className="profile-stat-value">{displayUser?.role || 'student'}</h2>
          </article>

          <article className="profile-stat-card">
            <p className="profile-stat-label">Lesson Completed</p>
            <h2 className="profile-stat-value">{progressOverview?.lessons?.completed || 0}</h2>
          </article>

          <article className="profile-stat-card">
            <p className="profile-stat-label">Tracked Vocabulary</p>
            <h2 className="profile-stat-value">{progressOverview?.vocabulary?.tracked || 0}</h2>
          </article>

          <article className="profile-stat-card">
            <p className="profile-stat-label">Bookmarks</p>
            <h2 className="profile-stat-value">{bookmarkCount}</h2>
          </article>
        </section>
      </main>
    </div>
  )
}
