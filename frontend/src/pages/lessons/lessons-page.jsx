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
  const {
    completedLessons,
    isProgressLoading,
    progressErrorMessage,
  } = useLessonsProgress()
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
  const isPageLoading = isLoading || isProgressLoading
  const pageErrorMessage = errorMessage || progressErrorMessage
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

      <main className="lessons-main" id="main-content" tabIndex={-1}>
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
              aria-current={itemLevel === level ? 'page' : undefined}
              className={`lessons-level-tab${itemLevel === level ? ' is-active' : ''}`}
            >
              {itemLevel.toUpperCase()}
            </Link>
          ))}
        </section>

        <section className="lessons-grid" aria-label="Danh sách bài học">
          {isPageLoading ? (
            <p role="status" className="lessons-feedback">Đang tải bài học từ cơ sở dữ liệu...</p>
          ) : null}

          {!isPageLoading && pageErrorMessage ? (
            <p role="alert" className="lessons-feedback lessons-feedback--error">{pageErrorMessage}</p>
          ) : null}

          {!isPageLoading && !pageErrorMessage && currentLessons.length === 0 ? (
            <p role="status" className="lessons-feedback">Chưa có bài học cho cấp độ này.</p>
          ) : null}

          {!isPageLoading && !pageErrorMessage
            ? currentLessons.map((lesson, index) => {
                const previousLesson = currentLessons[index - 1]
                const isCompleted = completedLessons.has(lesson.id)
                const isLocked =
                  Boolean(previousLesson) && !completedLessons.has(previousLesson.id)

                return (
                  <Link
                    key={lesson.id}
                    to={isLocked ? '#' : `/lessons/${level}/${lesson.lessonNumber}`}
                    aria-disabled={isLocked || undefined}
                    className={`lesson-card${isLocked ? ' is-locked' : ''}`}
                    onClick={(event) => {
                      if (isLocked) {
                        event.preventDefault()
                      }
                    }}
                  >
                    <span className="lesson-chapter" aria-hidden="true">{String(lesson.lessonNumber).padStart(2, '0')}</span>
                    <header className="lesson-card-head">
                      <div>
                        <h3>{lesson.title}</h3>
                        <p>{lesson.description}</p>
                      </div>
                      <span className="lesson-status-badge">
                        {isLocked ? 'KHÓA' : isCompleted ? 'XONG' : ''}
                      </span>
                    </header>

                    <div className="lesson-card-meta">
                      <span>{lesson.estimatedTime} phút</span>
                      <span>•</span>
                      <span>{lesson.vocabularyCount || 0} từ</span>
                      <span>•</span>
                      <span>{lesson.grammarCount || 0} ngữ pháp</span>
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
