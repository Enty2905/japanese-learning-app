import { Link, Navigate, useParams } from 'react-router-dom'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { useLessonsData } from '../../hooks/use-lessons-data'
import { useLessonsProgress } from '../../hooks/use-lessons-progress'
import { lessonLevelMeta, lessonLevels } from './lesson-levels'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './lessons-page.css'

const DEFAULT_LEVEL = lessonLevels[0]

function isValidLessonLevel(level) {
  return typeof level === 'string' && lessonLevels.includes(level)
}

function calculateCompletionRate(completedCount, totalCount) {
  if (totalCount === 0) {
    return 0
  }

  return Math.round((completedCount / totalCount) * 100)
}

export function LessonsPage() {
  const { level } = useParams()
  const { completedLessons } = useLessonsProgress()
  const normalizedLevel = isValidLessonLevel(level) ? level : DEFAULT_LEVEL

  const {
    lessons: currentLessons,
    isLoading,
    errorMessage,
  } = useLessonsData(normalizedLevel)

  if (!isValidLessonLevel(level)) {
    return <Navigate to={`/lessons/${DEFAULT_LEVEL}`} replace />
  }

  const currentLevelMeta = lessonLevelMeta[level]
  const completedInLevel = currentLessons.filter((lesson) =>
    completedLessons.has(lesson.id),
  ).length
  const completionRate = calculateCompletionRate(
    completedInLevel,
    currentLessons.length,
  )

  return (
    <div className="lessons-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="lessons-main">
        <section className={`lessons-hero lessons-hero--${currentLevelMeta.gradientClass}`}>
          <h1>{currentLevelMeta.title}</h1>
          <p>{currentLevelMeta.description}</p>

          <div className="lessons-hero-meta">
            <span>{currentLessons.length} bài học</span>
            <span>•</span>
            <span>Hoàn thành {completionRate}%</span>
          </div>

          <div className="lessons-hero-progress-track" aria-hidden="true">
            <div
              className="lessons-hero-progress-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </section>

        <section className="lessons-level-tabs" aria-label="Cấp độ bài học">
          {lessonLevels.map((itemLevel) => (
            <Link
              key={itemLevel}
              to={`/lessons/${itemLevel}`}
              className={`lessons-level-tab${itemLevel === level ? ' is-active' : ''}`}
            >
              {itemLevel.toUpperCase()}
            </Link>
          ))}
        </section>

        <section className="lessons-grid" aria-label="Danh sách bài học">
          {isLoading ? (
            <p className="lessons-feedback">Đang tải bài học từ cơ sở dữ liệu...</p>
          ) : null}

          {!isLoading && errorMessage ? (
            <p className="lessons-feedback lessons-feedback--error">{errorMessage}</p>
          ) : null}

          {!isLoading && !errorMessage && currentLessons.length === 0 ? (
            <p className="lessons-feedback">Chưa có bài học cho cấp độ này.</p>
          ) : null}

          {!isLoading && !errorMessage
            ? currentLessons.map((lesson, index) => {
                const previousLesson = currentLessons[index - 1]
                const isCompleted = completedLessons.has(lesson.id)
                const isLocked =
                  Boolean(previousLesson) && !completedLessons.has(previousLesson.id)

                return (
                  <Link
                    key={lesson.id}
                    to={isLocked ? '#' : `/lessons/${level}/${lesson.lessonNumber}`}
                    className={`lesson-card${isLocked ? ' is-locked' : ''}`}
                    onClick={(event) => {
                      if (isLocked) {
                        event.preventDefault()
                      }
                    }}
                  >
                    <header className="lesson-card-head">
                      <div>
                        <h3>{lesson.title}</h3>
                        <p>{lesson.description}</p>
                      </div>
                      <span className="lesson-status-badge" aria-hidden="true">
                        {isLocked ? 'KHÓA' : isCompleted ? 'XONG' : ''}
                      </span>
                    </header>

                    <div className="lesson-card-meta">
                      <span>{lesson.estimatedTime} phút</span>
                      <span>•</span>
                      <span>{lesson.vocabularyCount || 0} từ</span>
                    </div>

                    {isLocked ? (
                      <p className="lesson-lock-note">Hoàn thành bài trước để mở khóa.</p>
                    ) : null}
                  </Link>
                )
              })
            : null}
        </section>
      </main>
    </div>
  )
}
