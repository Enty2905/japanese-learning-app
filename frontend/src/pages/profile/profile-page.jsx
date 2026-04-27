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

function getRoleLabel(role) {
  const roleLabels = {
    admin: 'Quản trị viên',
    student: 'Học viên',
    teacher: 'Giáo viên',
  }

  return roleLabels[role] || role || 'Học viên'
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

    async function loadProfileData() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const results = await Promise.allSettled([
          fetchMyProfile(),
          fetchProgressOverview(),
          fetchMyBookmarks(),
        ])

        if (!isMounted) {
          return
        }

        const nextErrors = []

        const profileResult = results[0]
        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value)
        } else {
          nextErrors.push(profileResult.reason?.message || 'Không tải được hồ sơ.')
        }

        const progressResult = results[1]
        if (progressResult.status === 'fulfilled') {
          setProgressOverview(progressResult.value)
        } else {
          nextErrors.push(progressResult.reason?.message || 'Không tải được tiến độ.')
        }

        const bookmarkResult = results[2]
        if (bookmarkResult.status === 'fulfilled') {
          setBookmarkCount(bookmarkResult.value.length)
        } else {
          nextErrors.push(bookmarkResult.reason?.message || 'Không tải được dấu trang.')
        }

        setErrorMessage(formatErrorMessage(nextErrors))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfileData()

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
              <h1>{displayUser?.fullName || displayUser?.displayName || 'Hồ sơ người dùng'}</h1>
              <p>{displayUser?.email || ''}</p>
            </div>
          </header>

          <div className="profile-actions">
            <button type="button" onClick={handleLogout} className="profile-logout-btn">
              Đăng xuất
            </button>
            <Link to="/" className="profile-back-link">
              Về trang chủ
            </Link>
          </div>

          {isLoading ? <p className="profile-feedback">Đang tải dữ liệu hồ sơ...</p> : null}

          {!isLoading && errorMessage ? (
            <p className="profile-feedback profile-feedback--error">{errorMessage}</p>
          ) : null}
        </section>

        <section className="profile-stats-grid" aria-label="Dữ liệu tài khoản người dùng">
          <article className="profile-stat-card">
            <p className="profile-stat-label">Vai trò</p>
            <h2 className="profile-stat-value">{getRoleLabel(displayUser?.role)}</h2>
          </article>

          <article className="profile-stat-card">
            <p className="profile-stat-label">Bài học đã hoàn thành</p>
            <h2 className="profile-stat-value">{progressOverview?.lessons?.completed || 0}</h2>
          </article>

          <article className="profile-stat-card">
            <p className="profile-stat-label">Từ vựng đang theo dõi</p>
            <h2 className="profile-stat-value">{progressOverview?.vocabulary?.tracked || 0}</h2>
          </article>

          <article className="profile-stat-card">
            <p className="profile-stat-label">Dấu trang</p>
            <h2 className="profile-stat-value">{bookmarkCount}</h2>
          </article>
        </section>
      </main>
    </div>
  )
}
