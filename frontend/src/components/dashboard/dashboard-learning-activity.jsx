const LEVEL_TONES = {
  N5: 'blue',
  N4: 'green',
  N3: 'orange',
  N2: 'rose',
  N1: 'violet',
}

const ACTIVITY_LABELS = {
  complete_lesson: 'Bài học',
  submit_quiz: 'Quiz',
  review_vocabulary: 'Flashcard',
}

function formatActivityTime(value) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function LevelProgressItem({ item }) {
  const tone = LEVEL_TONES[item.level] || 'blue'

  return (
    <article className="activity-level-item">
      <div className="activity-level-head">
        <span className={`activity-level-badge ${tone}`}>{item.level}</span>
        <strong>{item.completionRate || 0}%</strong>
      </div>
      <div className="activity-level-track" aria-hidden="true">
        <div
          className={`activity-level-fill ${tone}`}
          style={{ width: `${item.completionRate || 0}%` }}
        />
      </div>
      <p>
        {item.completedLessons || 0}/{item.totalLessons || 0} bài
      </p>
    </article>
  )
}

function RecentActivityItem({ item }) {
  const label = ACTIVITY_LABELS[item.type] || 'Học tập'

  return (
    <article className="activity-log-item">
      <div>
        <span>{label}</span>
        <h3>{item.title}</h3>
        {item.details?.score !== undefined ? (
          <p>Điểm: {item.details.score}/100</p>
        ) : null}
        {item.details?.reviewedCards ? (
          <p>{item.details.reviewedCards} thẻ đã ôn</p>
        ) : null}
      </div>
      <time dateTime={item.createdAt}>{formatActivityTime(item.createdAt)}</time>
    </article>
  )
}

export function DashboardLearningActivity({ activity }) {
  const recentActivities = Array.isArray(activity?.recentActivities)
    ? activity.recentActivities
    : []
  const levelProgress = Array.isArray(activity?.levelProgress)
    ? activity.levelProgress
    : []

  return (
    <section className="learning-activity" aria-labelledby="learning-activity-title">
      <div className="activity-summary">
        <div className="dashboard-section-heading">
          <span>Lịch sử học tập</span>
          <h2 id="learning-activity-title">Nhịp học gần đây</h2>
          <p>Theo dõi streak, số bài trong tuần và tiến độ từng cấp JLPT.</p>
        </div>

        <div className="activity-summary-grid">
          <article>
            <span>Streak</span>
            <strong>{activity?.studyStreak || 0}</strong>
            <p>ngày liên tiếp</p>
          </article>
          <article>
            <span>Tuần này</span>
            <strong>{activity?.completedThisWeek || 0}</strong>
            <p>bài đã hoàn thành</p>
          </article>
          <article>
            <span>Ngày học</span>
            <strong>{activity?.activeDays || 0}</strong>
            <p>ngày có hoạt động</p>
          </article>
        </div>
      </div>

      <div className="activity-body">
        <section className="activity-panel">
          <header>
            <h3>Tiến độ theo cấp</h3>
          </header>
          <div className="activity-level-list">
            {levelProgress.map((item) => (
              <LevelProgressItem key={item.level} item={item} />
            ))}
          </div>
        </section>

        <section className="activity-panel">
          <header>
            <h3>Hoạt động gần đây</h3>
          </header>
          <div className="activity-log-list">
            {recentActivities.length > 0 ? (
              recentActivities.map((item) => (
                <RecentActivityItem key={item.id} item={item} />
              ))
            ) : (
              <p className="activity-empty">Chưa có hoạt động học tập nào.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
