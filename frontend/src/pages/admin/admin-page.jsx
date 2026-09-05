import { useMemo, useState } from 'react'
import { AdminContentManager } from '../../components/admin/admin-content-manager'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { useAdminDashboard } from '../../hooks/use-admin-dashboard'
import { useAuthSession } from '../../hooks/use-auth-session'
import { updateAdminUser } from '../../services/admin.service'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './admin-page.css'

const ROLE_OPTIONS = [
  { value: 'student', label: 'Học viên' },
  { value: 'teacher', label: 'Giáo viên' },
  { value: 'admin', label: 'Admin' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Tạm dừng' },
  { value: 'banned', label: 'Bị khóa' },
]

const METRIC_CARDS = [
  {
    key: 'totalUsers',
    label: 'Người dùng',
    detailKey: 'activeUsers',
    detailLabel: 'đang hoạt động',
    icon: 'US',
    tone: 'blue',
  },
  {
    key: 'totalLessons',
    label: 'Bài học',
    detailKey: 'publishedLessons',
    detailLabel: 'đã xuất bản',
    icon: 'LS',
    tone: 'green',
  },
  {
    key: 'totalVocabulary',
    label: 'Từ vựng',
    icon: 'WD',
    tone: 'violet',
  },
  {
    key: 'totalKanji',
    label: 'Kanji',
    icon: 'KJ',
    tone: 'orange',
  },
  {
    key: 'totalGrammar',
    label: 'Ngữ pháp',
    icon: 'GR',
    tone: 'rose',
  },
  {
    key: 'totalFlashcardSets',
    label: 'Bộ flashcard',
    icon: 'FC',
    tone: 'teal',
  },
]

function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) {
    return 'Chưa có'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function getRoleLabel(role) {
  return ROLE_OPTIONS.find((item) => item.value === role)?.label || role || 'Học viên'
}

function getStatusLabel(status) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status || 'Hoạt động'
}

function getUserDisplayName(user) {
  return user.displayName || user.fullName || user.email
}

function AdminMetricGrid({ summary }) {
  return (
    <section className="admin-metric-grid" aria-label="Tổng quan hệ thống">
      {METRIC_CARDS.map((card) => (
        <article key={card.key} className="admin-metric-card">
          <div className="admin-metric-card__head">
            <span className={`admin-metric-card__icon admin-metric-card__icon--${card.tone}`}>
              {card.icon}
            </span>
            <span>{card.label}</span>
          </div>
          <strong>{formatNumber(summary?.[card.key])}</strong>
          {card.detailKey ? (
            <p>
              {formatNumber(summary?.[card.detailKey])} {card.detailLabel}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  )
}

function AdminBreakdown({ sectionId, title, items, getLabel }) {
  return (
    <section className="admin-panel" aria-labelledby={`${sectionId}-title`}>
      <header className="admin-panel__header">
        <h2 id={`${sectionId}-title`}>{title}</h2>
      </header>
      <div className="admin-breakdown-list">
        {items.length > 0 ? (
          items.map((item) => (
            <article key={item.role || item.status} className="admin-breakdown-item">
              <span>{getLabel(item.role || item.status)}</span>
              <strong>{formatNumber(item.count)}</strong>
            </article>
          ))
        ) : (
          <p className="admin-empty">Chưa có dữ liệu.</p>
        )}
      </div>
    </section>
  )
}

function AdminRecentUsers({ users }) {
  return (
    <section className="admin-panel" aria-labelledby="admin-recent-users-title">
      <header className="admin-panel__header">
        <h2 id="admin-recent-users-title">Người dùng mới</h2>
      </header>
      <div className="admin-recent-list">
        {users.length > 0 ? (
          users.map((user) => (
            <article key={user.id} className="admin-recent-item">
              <div>
                <strong>{getUserDisplayName(user)}</strong>
                <span>{user.email}</span>
              </div>
              <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time>
            </article>
          ))
        ) : (
          <p className="admin-empty">Chưa có người dùng mới.</p>
        )}
      </div>
    </section>
  )
}

function AdminUsersTable({
  currentUserId,
  drafts,
  onDraftChange,
  onSaveUser,
  savingUserId,
  users,
}) {
  if (users.length === 0) {
    return <p className="admin-empty">Không tìm thấy người dùng phù hợp.</p>
  }

  return (
    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Bảng người dùng, cuộn ngang để xem thêm cột">
      <table className="admin-users-table">
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Đăng nhập gần nhất</th>
            <th aria-label="Thao tác" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const draft = drafts[user.id] || {
              role: user.role,
              status: user.status,
            }
            const hasChanges = draft.role !== user.role || draft.status !== user.status
            const isSaving = savingUserId === user.id
            const isCurrentUser = Number(currentUserId) === Number(user.id)

            return (
              <tr key={user.id}>
                <td>
                  <div className="admin-user-cell">
                    <strong>{getUserDisplayName(user)}</strong>
                    <span>{user.email}</span>
                    {isCurrentUser ? <em>Tài khoản hiện tại</em> : null}
                  </div>
                </td>
                <td>
                  <label className="admin-select-label">
                    <span>Vai trò</span>
                    <select
                      value={draft.role}
                      disabled={isSaving || isCurrentUser}
                      onChange={(event) => onDraftChange(user, 'role', event.target.value)}
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </td>
                <td>
                  <label className="admin-select-label">
                    <span>Trạng thái</span>
                    <select
                      value={draft.status}
                      disabled={isSaving || isCurrentUser}
                      onChange={(event) => onDraftChange(user, 'status', event.target.value)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </td>
                <td>{formatDate(user.lastLoginAt)}</td>
                <td>
                  <button
                    type="button"
                    className="admin-save-btn"
                    disabled={!hasChanges || isSaving || isCurrentUser}
                    onClick={() => onSaveUser(user)}
                  >
                    {isSaving ? 'Đang lưu' : 'Lưu'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function AdminPage() {
  const { user } = useAuthSession()
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
    role: 'all',
    status: 'all',
  })
  const [drafts, setDrafts] = useState({})
  const [savingUserId, setSavingUserId] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const adminFilters = useMemo(
    () => ({
      page: filters.page,
      limit: 8,
      search: filters.search,
      role: filters.role,
      status: filters.status,
    }),
    [filters],
  )
  const {
    overview,
    users,
    pagination,
    isLoading,
    errorMessage,
    reload,
  } = useAdminDashboard(adminFilters)

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: 1,
      search: searchInput.trim(),
    }))
  }

  const handleFilterChange = (key, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: 1,
      [key]: value,
    }))
  }

  const handlePageChange = (nextPage) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }))
  }

  const handleDraftChange = (targetUser, key, value) => {
    setDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[targetUser.id] || {
        role: targetUser.role,
        status: targetUser.status,
      }

      return {
        ...currentDrafts,
        [targetUser.id]: {
          ...currentDraft,
          [key]: value,
        },
      }
    })
  }

  const handleSaveUser = async (targetUser) => {
    const draft = drafts[targetUser.id] || {
      role: targetUser.role,
      status: targetUser.status,
    }

    setSavingUserId(targetUser.id)
    setSaveMessage('')
    setSaveErrorMessage('')

    try {
      await updateAdminUser(targetUser.id, draft)
      setDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts }
        delete nextDrafts[targetUser.id]
        return nextDrafts
      })
      setSaveMessage(`Đã cập nhật ${getUserDisplayName(targetUser)}.`)
      reload()
    } catch (error) {
      setSaveErrorMessage(error.message)
    } finally {
      setSavingUserId(null)
    }
  }

  return (
    <div className="dashboard-page admin-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="dashboard-main admin-main" id="main-content" tabIndex={-1}>
        <section className="admin-hero">
          <div>
            <span>Admin</span>
            <h1>Quản trị hệ thống học tiếng Nhật</h1>
            <p>{user?.fullName || user?.email || 'Admin'}</p>
          </div>
          <div className="admin-hero__meta">
            <strong>{formatNumber(overview?.summary?.totalLearningLogs)}</strong>
            <span>hoạt động học tập</span>
          </div>
        </section>

        {isLoading ? <p role="status" className="admin-feedback">Đang tải dữ liệu quản trị...</p> : null}
        {errorMessage ? <p role="alert" className="admin-feedback admin-feedback--error">{errorMessage}</p> : null}
        {saveMessage ? <p role="status" className="admin-feedback admin-feedback--success">{saveMessage}</p> : null}
        {saveErrorMessage ? (
          <p role="alert" className="admin-feedback admin-feedback--error">{saveErrorMessage}</p>
        ) : null}

        <AdminMetricGrid summary={overview?.summary} />
        <AdminContentManager />

        <div className="admin-insights">
          <AdminBreakdown
            sectionId="admin-role-breakdown"
            title="Vai trò"
            items={overview?.roleCounts || []}
            getLabel={getRoleLabel}
          />
          <AdminBreakdown
            sectionId="admin-status-breakdown"
            title="Trạng thái"
            items={overview?.statusCounts || []}
            getLabel={getStatusLabel}
          />
          <AdminRecentUsers users={overview?.recentUsers || []} />
        </div>

        <section className="admin-users-section" aria-labelledby="admin-users-title">
          <header className="admin-users-section__header">
            <div>
              <span>Users</span>
              <h2 id="admin-users-title">Quản lý người dùng</h2>
            </div>
            <form className="admin-filter-bar" onSubmit={handleSearchSubmit}>
              <label>
                <span>Tìm kiếm</span>
                <input
                  type="search"
                  value={searchInput}
                  placeholder="Email hoặc tên"
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </label>
              <label>
                <span>Vai trò</span>
                <select
                  value={filters.role}
                  onChange={(event) => handleFilterChange('role', event.target.value)}
                >
                  <option value="all">Tất cả</option>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Trạng thái</span>
                <select
                  value={filters.status}
                  onChange={(event) => handleFilterChange('status', event.target.value)}
                >
                  <option value="all">Tất cả</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Tìm</button>
            </form>
          </header>

          <AdminUsersTable
            currentUserId={user?.id}
            drafts={drafts}
            users={users}
            savingUserId={savingUserId}
            onDraftChange={handleDraftChange}
            onSaveUser={handleSaveUser}
          />

          <footer className="admin-pagination">
            <span>
              {formatNumber(pagination?.total)} người dùng · Trang {pagination?.page || 1}/
              {pagination?.totalPages || 1}
            </span>
            <div>
              <button
                type="button"
                disabled={!pagination || pagination.page <= 1}
                onClick={() => handlePageChange((pagination?.page || 1) - 1)}
              >
                Trước
              </button>
              <button
                type="button"
                disabled={!pagination || pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange((pagination?.page || 1) + 1)}
              >
                Sau
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  )
}
