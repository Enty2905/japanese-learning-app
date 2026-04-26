import { Link, Navigate, useParams } from 'react-router-dom'
import { CheckIcon, VolumeIcon } from '../../components/hiragana/hiragana-icons'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { useLessonDetail } from '../../hooks/use-lesson-detail'
import { useLessonsProgress } from '../../hooks/use-lessons-progress'
import { normalizeLessonVocabulary } from '../../utils/lesson-vocabulary'
import { lessonLevelMeta, lessonLevels } from './lesson-levels'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './lessons-page.css'

const DEFAULT_LEVEL = lessonLevels[0]

function isValidLessonLevel(level) {
  return typeof level === 'string' && lessonLevels.includes(level)
}

function createLessonContent(lesson, normalizedVocabulary) {
  if (typeof lesson?.content === 'string' && lesson.content.trim()) {
    return lesson.content
  }

  const topic = lesson?.title || 'Lesson'
  const firstVocabulary = normalizedVocabulary[0]
    ? `${normalizedVocabulary[0].japanese} (${normalizedVocabulary[0].romaji})`
    : 'No vocabulary yet'

  return `# ${topic}\nIn this lesson, we will practice vocabulary from the database.\n\n## Vocabulary\n${firstVocabulary}`
}

function renderLessonContent(content) {
  return content.split('\n').map((line, index) => {
    if (line.startsWith('# ')) {
      return <h1 key={`line-${index}`}>{line.slice(2)}</h1>
    }

    if (line.startsWith('## ')) {
      return <h2 key={`line-${index}`}>{line.slice(3)}</h2>
    }

    if (line.trim()) {
      return <p key={`line-${index}`}>{line}</p>
    }

    return <br key={`line-${index}`} />
  })
}

function playVocabularyWord(word) {
  if (!word || typeof window === 'undefined') {
    return
  }

  if (!('speechSynthesis' in window)) {
    return
  }

  const utterance = new window.SpeechSynthesisUtterance(word.japanese)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.9

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

function BookIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function ArrowLeftIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

export function LessonDetailPage() {
  const { level, lessonNumber } = useParams()
  const parsedLessonNumber = Number(lessonNumber)
  const normalizedLevel = isValidLessonLevel(level) ? level : DEFAULT_LEVEL
  const normalizedLessonNumber =
    Number.isInteger(parsedLessonNumber) && parsedLessonNumber > 0
      ? parsedLessonNumber
      : 1
  const { completedLessons, markLessonCompleted } = useLessonsProgress()
  const {
    lesson,
    isLoading,
    errorMessage,
  } = useLessonDetail(normalizedLevel, normalizedLessonNumber)

  if (!isValidLessonLevel(level)) {
    return <Navigate to={`/lessons/${DEFAULT_LEVEL}`} replace />
  }

  if (!Number.isInteger(parsedLessonNumber) || parsedLessonNumber <= 0) {
    return <Navigate to={`/lessons/${level}`} replace />
  }

  const previousLessonId = `${level}-l${parsedLessonNumber - 1}`
  const isLocked = parsedLessonNumber > 1 && !completedLessons.has(previousLessonId)

  if (isLocked) {
    return (
      <div className="lessons-page">
        <DashboardNav navItems={NAV_ITEMS} />

        <main className="lessons-main">
          <section className="lesson-detail-card">
            <h1>Lesson Locked</h1>
            <p>Complete the previous lesson before opening this one.</p>
            <Link to={`/lessons/${level}`} className="lesson-primary-btn">
              Back to {level.toUpperCase()} Lessons
            </Link>
          </section>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="lessons-page">
        <DashboardNav navItems={NAV_ITEMS} />

        <main className="lessons-main">
          <section className="lesson-detail-card">
            <p className="lessons-feedback">Loading lesson from database...</p>
          </section>
        </main>
      </div>
    )
  }

  if (errorMessage || !lesson) {
    return (
      <div className="lessons-page">
        <DashboardNav navItems={NAV_ITEMS} />

        <main className="lessons-main">
          <section className="lesson-detail-card">
            <p className="lessons-feedback lessons-feedback--error">
              {errorMessage || 'Lesson not found.'}
            </p>
            <Link to={`/lessons/${level}`} className="lesson-primary-btn">
              Back to Lessons
            </Link>
          </section>
        </main>
      </div>
    )
  }

  const isCompleted = completedLessons.has(lesson.id)
  const levelMeta = lessonLevelMeta[level]
  const normalizedVocabulary = normalizeLessonVocabulary(lesson.vocabulary)
  const lessonContent = createLessonContent(lesson, normalizedVocabulary)

  const handleMarkComplete = () => {
    if (isCompleted) {
      return
    }

    markLessonCompleted({
      id: lesson.id,
      vocabulary: normalizedVocabulary,
    })
  }

  return (
    <div className="lessons-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="lessons-main lessons-main--detail">
        <div>
          <Link to={`/lessons/${level}`} className="lesson-back-link">
            <ArrowLeftIcon className="lesson-back-icon" />
            Back to Lessons
          </Link>
        </div>

        <section className={`lessons-hero lessons-hero--${levelMeta.gradientClass}`}>
          <div className="lesson-hero-head">
            <div className="lesson-hero-title-group">
              <BookIcon className="lesson-hero-icon" />
              <div>
                <h1>{lesson.title}</h1>
                <p>{lesson.description}</p>
              </div>
            </div>

            {isCompleted ? (
              <div className="lesson-completed-badge" aria-label="Completed">
                <CheckIcon className="lesson-completed-icon" />
              </div>
            ) : null}
          </div>

          <div className="lessons-hero-meta">
            <span>{lesson.estimatedTime} minutes</span>
            <span>•</span>
            <span>{normalizedVocabulary.length} vocabulary words</span>
          </div>
        </section>

        <div className="lesson-detail-layout">
          <div className="lesson-detail-main-column">
            <section className="lesson-detail-card">
              <div className="lesson-content-prose">
                {renderLessonContent(lessonContent)}
              </div>
            </section>

            <section className="lesson-detail-card">
              <h2 className="lesson-section-title">Practice Exercises</h2>

              <div className="lesson-exercises-list">
                <article className="lesson-exercise-item">
                  <p className="lesson-exercise-title">Write each vocabulary word 5 times</p>
                  <div className="lesson-word-chips">
                    {normalizedVocabulary.slice(0, 3).map((word) => (
                      <span key={`chip-${word.japanese}`} className="lesson-word-chip">
                        {word.japanese}
                      </span>
                    ))}
                  </div>
                </article>

                <article className="lesson-exercise-item">
                  <p className="lesson-exercise-title">Create sentences using the new vocabulary</p>
                  <p className="lesson-exercise-note">
                    Try to form at least 3 sentences using words from this lesson.
                  </p>
                </article>

                <article className="lesson-exercise-item">
                  <p className="lesson-exercise-title">Listen and repeat</p>
                  <p className="lesson-exercise-note">
                    Practice pronunciation by listening to native speakers and repeating after them.
                  </p>
                </article>
              </div>
            </section>

            <button
              type="button"
              onClick={handleMarkComplete}
              className={`lesson-mark-btn lessons-hero--${levelMeta.gradientClass}`}
              disabled={isCompleted}
            >
              <CheckIcon className="lesson-mark-icon" />
              <span>{isCompleted ? 'Completed' : 'Mark as Complete'}</span>
            </button>
          </div>

          <aside className="lesson-vocabulary-sidebar">
            <section className="lesson-vocabulary-card">
              <h3>Vocabulary</h3>

              <div className="lesson-vocabulary-list">
                {normalizedVocabulary.map((word, index) => (
                  <article
                    key={`vocab-${word.japanese}-${index}`}
                    className="lesson-vocabulary-item"
                  >
                    <div className="lesson-vocabulary-head">
                      <div>
                        <div className="lesson-vocabulary-japanese">{word.japanese}</div>
                        <div className="lesson-vocabulary-romaji">{word.romaji}</div>
                      </div>

                      <button
                        type="button"
                        className="lesson-vocabulary-sound-btn"
                        onClick={() => playVocabularyWord(word)}
                        aria-label={`Play pronunciation for ${word.romaji}`}
                      >
                        <VolumeIcon className="lesson-vocabulary-sound-icon" />
                      </button>
                    </div>

                    <p className="lesson-vocabulary-meaning">{word.english}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
