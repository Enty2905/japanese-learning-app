import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CheckIcon, VolumeIcon } from '../../components/hiragana/hiragana-icons'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { useLessonDetail } from '../../hooks/use-lesson-detail'
import { useLessonsProgress } from '../../hooks/use-lessons-progress'
import { saveLessonQuiz } from '../../services/progress.service'
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

  const topic = lesson?.title || 'Bài học'
  const firstVocabulary = normalizedVocabulary[0]
    ? `${normalizedVocabulary[0].japanese} (${normalizedVocabulary[0].romaji})`
    : 'Chưa có từ vựng'

  return `# ${topic}\nTrong bài này, chúng ta sẽ luyện từ vựng từ cơ sở dữ liệu.\n\n## Từ vựng\n${firstVocabulary}`
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

function renderGrammarExample(example) {
  return (
    <article key={example.id || example.exampleJp} className="lesson-grammar-example">
      <strong>{example.exampleJp}</strong>
      {example.exampleKana ? <span>{example.exampleKana}</span> : null}
      <p>{example.exampleVi}</p>
    </article>
  )
}

function LessonGrammarSection({ grammar }) {
  if (!Array.isArray(grammar) || grammar.length === 0) {
    return (
      <section className="lesson-detail-card">
        <h2 className="lesson-section-title">Ngữ pháp</h2>
        <p className="lesson-empty-note">Bài học này chưa có mẫu ngữ pháp được liên kết.</p>
      </section>
    )
  }

  return (
    <section className="lesson-detail-card lesson-grammar-card">
      <div className="lesson-section-head">
        <h2 className="lesson-section-title">Ngữ pháp</h2>
        <span>{grammar.length} mẫu</span>
      </div>

      <div className="lesson-grammar-list">
        {grammar.map((item) => (
          <article key={item.id || item.pattern} className="lesson-grammar-item">
            <header>
              <h3>{item.pattern}</h3>
              {item.jlptLevel ? <span>{item.jlptLevel}</span> : null}
            </header>

            <p className="lesson-grammar-meaning">{item.meaningVi}</p>

            {item.formation ? (
              <p className="lesson-grammar-detail">
                <strong>Cấu trúc:</strong> {item.formation}
              </p>
            ) : null}

            {item.explanation ? (
              <p className="lesson-grammar-detail">{item.explanation}</p>
            ) : null}

            {item.usageNote ? (
              <p className="lesson-grammar-detail">
                <strong>Ghi chú:</strong> {item.usageNote}
              </p>
            ) : null}

            {Array.isArray(item.examples) && item.examples.length > 0 ? (
              <div className="lesson-grammar-examples">
                {item.examples.slice(0, 2).map(renderGrammarExample)}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
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

function normalizeAnswer(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function createOptionSet(correctOption, vocabulary, pickValue, seed = 0) {
  const distractors = []

  for (const word of vocabulary) {
    const option = pickValue(word)

    if (option && option !== correctOption && !distractors.includes(option)) {
      distractors.push(option)
    }

    if (distractors.length >= 3) {
      break
    }
  }

  const options = [...distractors]
  const insertIndex = seed % (options.length + 1)
  options.splice(insertIndex, 0, correctOption)

  return options
}

function buildLessonQuiz(vocabulary) {
  return vocabulary.slice(0, 8).flatMap((word, index) => {
    const questions = []
    const meaning = word.meaningVi || word.english

    if (meaning) {
      questions.push({
        id: `meaning-${word.id || index}`,
        type: 'choice',
        vocabularyId: word.id,
        prompt: `Chọn nghĩa đúng của "${word.japanese}"`,
        answer: meaning,
        options: createOptionSet(meaning, vocabulary, (item) => item.meaningVi || item.english, index),
      })
    }

    if (word.romaji) {
      questions.push({
        id: `romaji-${word.id || index}`,
        type: 'text',
        vocabularyId: word.id,
        prompt: `Nhập romaji/kana của "${word.japanese}"`,
        answer: word.romaji,
        acceptedAnswers: [word.romaji, word.kana].filter(Boolean),
      })
    }

    questions.push({
      id: `listen-${word.id || index}`,
      type: 'listen',
      vocabularyId: word.id,
      prompt: 'Nghe phát âm rồi chọn từ đúng',
      answer: word.japanese,
      word,
      options: createOptionSet(word.japanese, vocabulary, (item) => item.japanese, index + 2),
    })

    return questions
  }).slice(0, 10)
}

function LessonQuiz({
  level,
  lessonNumber,
  questions,
  onCompleted,
}) {
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizResult, setQuizResult] = useState(null)
  const [isSavingQuiz, setIsSavingQuiz] = useState(false)
  const [quizErrorMessage, setQuizErrorMessage] = useState('')

  if (questions.length === 0) {
    return null
  }

  const handleAnswerChange = (questionId, value) => {
    setQuizAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: value,
    }))
  }

  const handleResetQuiz = () => {
    setQuizAnswers({})
    setQuizResult(null)
    setQuizErrorMessage('')
  }

  const handleSubmitQuiz = async (event) => {
    event.preventDefault()

    if (isSavingQuiz) {
      return
    }

    const checkedQuestions = questions.map((question) => {
      const answer = quizAnswers[question.id]
      const acceptedAnswers = question.acceptedAnswers || [question.answer]
      const isCorrect = acceptedAnswers.some((acceptedAnswer) => {
        return normalizeAnswer(acceptedAnswer) === normalizeAnswer(answer)
      })

      return {
        ...question,
        isCorrect,
        userAnswer: answer,
      }
    })
    const correctCount = checkedQuestions.filter((question) => question.isCorrect).length
    const vocabularyResults = checkedQuestions
      .filter((question) => question.vocabularyId)
      .map((question) => ({
        vocabularyId: question.vocabularyId,
        isCorrect: question.isCorrect,
      }))

    setIsSavingQuiz(true)
    setQuizErrorMessage('')

    try {
      const progress = await saveLessonQuiz({
        level,
        lessonNumber,
        correctCount,
        questionCount: questions.length,
        vocabularyResults,
      })

      setQuizResult({
        correctCount,
        questionCount: questions.length,
        score: progress?.quizScore ?? Math.round((correctCount / questions.length) * 100),
        questions: checkedQuestions.map((question, index) => ({
          id: question.id,
          position: index + 1,
          prompt: question.prompt,
          userAnswer: question.userAnswer,
          correctAnswer: question.answer,
          isCorrect: question.isCorrect,
        })),
      })
      onCompleted()
    } catch (error) {
      setQuizErrorMessage(error.message)
    } finally {
      setIsSavingQuiz(false)
    }
  }

  const canSubmit = questions.every((question) => {
    return normalizeAnswer(quizAnswers[question.id])
  })
  const isQuizCompleted = Boolean(quizResult)
  const wrongQuestions = quizResult?.questions?.filter((question) => !question.isCorrect) || []

  return (
    <section className="lesson-detail-card lesson-quiz-card">
      <div className="lesson-quiz-head">
        <div>
          <h2 className="lesson-section-title">Bài kiểm tra nhanh</h2>
          <p>Hoàn thành quiz để lưu điểm và cập nhật tiến độ từ vựng.</p>
        </div>
        {quizResult ? (
          <strong>{quizResult.score}/100</strong>
        ) : null}
      </div>

      <form onSubmit={handleSubmitQuiz} className="lesson-quiz-form">
        {questions.map((question, index) => (
          <article key={question.id} className="lesson-quiz-question">
            <div className="lesson-quiz-question-head">
              <span>{index + 1}</span>
              <h3>{question.prompt}</h3>
              {question.type === 'listen' ? (
                <button
                  type="button"
                  className="lesson-vocabulary-sound-btn"
                  onClick={() => playVocabularyWord(question.word)}
                  aria-label="Nghe phát âm"
                >
                  <VolumeIcon className="lesson-vocabulary-sound-icon" />
                </button>
              ) : null}
            </div>

            {question.type === 'text' ? (
              <input
                className="lesson-quiz-input"
                value={quizAnswers[question.id] || ''}
                onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                aria-label={question.prompt}
                disabled={isQuizCompleted}
              />
            ) : (
              <div className="lesson-quiz-options">
                {question.options.map((option) => (
                  <label key={`${question.id}-${option}`} className="lesson-quiz-option">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={quizAnswers[question.id] === option}
                      onChange={() => handleAnswerChange(question.id, option)}
                      disabled={isQuizCompleted}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </article>
        ))}

        {quizErrorMessage ? (
          <p role="alert" className="lessons-feedback lessons-feedback--error">{quizErrorMessage}</p>
        ) : null}

        {quizResult ? (
          <div className="lesson-quiz-review" aria-live="polite">
            <div className="lesson-quiz-review-head">
              <h3>Câu cần ôn lại</h3>
              <p>Kiểm tra lại các câu trả lời sai trước khi chuyển sang bài tiếp theo.</p>
            </div>

            {wrongQuestions.length > 0 ? (
              <div className="lesson-quiz-review-list">
                {wrongQuestions.map((question) => (
                  <article key={question.id} className="lesson-quiz-review-item">
                    <strong>Câu {question.position}: {question.prompt}</strong>
                    <p>
                      <span>Bạn trả lời:</span> {question.userAnswer}
                    </p>
                    <p>
                      <span>Đáp án đúng:</span> {question.correctAnswer}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="lesson-quiz-review-success">Bạn đã làm đúng toàn bộ câu hỏi.</p>
            )}
          </div>
        ) : null}

        {quizResult ? (
          <p role="status" className="lessons-feedback">
            Đúng {quizResult.correctCount}/{quizResult.questionCount}. Điểm cao nhất đã được lưu.
          </p>
        ) : null}

        {quizResult ? (
          <div className="lesson-quiz-actions">
            <Link to={`/lessons/${level}`} className="lesson-primary-btn">
              Về danh sách bài học
            </Link>
            <button type="button" className="lesson-secondary-btn" onClick={handleResetQuiz}>
              Làm lại bài kiểm tra
            </button>
          </div>
        ) : null}

        <button
          type="submit"
          className={`lesson-mark-btn lessons-hero--${level}${isQuizCompleted ? ' lesson-quiz-submit--hidden' : ''}`}
          disabled={!canSubmit || isSavingQuiz || isQuizCompleted}
        >
          {isSavingQuiz ? 'Đang lưu...' : 'Nộp bài kiểm tra'}
        </button>
      </form>
    </section>
  )
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
  const {
    completedLessons,
    isProgressLoading,
    progressErrorMessage,
    markLessonCompleted,
  } = useLessonsProgress()
  const [isCompleting, setIsCompleting] = useState(false)
  const [completeErrorMessage, setCompleteErrorMessage] = useState('')
  const {
    lesson,
    isLoading,
    errorMessage,
  } = useLessonDetail(normalizedLevel, normalizedLessonNumber)
  const normalizedVocabulary = useMemo(
    () => normalizeLessonVocabulary(lesson?.vocabulary),
    [lesson],
  )
  const quizQuestions = useMemo(
    () => buildLessonQuiz(normalizedVocabulary),
    [normalizedVocabulary],
  )

  if (!isValidLessonLevel(level)) {
    return <Navigate to={`/lessons/${DEFAULT_LEVEL}`} replace />
  }

  if (!Number.isInteger(parsedLessonNumber) || parsedLessonNumber <= 0) {
    return <Navigate to={`/lessons/${level}`} replace />
  }

  const previousLessonId = `${level}-l${parsedLessonNumber - 1}`
  const isLocked =
    !isProgressLoading &&
    parsedLessonNumber > 1 &&
    !completedLessons.has(previousLessonId)

  if (isLocked) {
    return (
      <div className="lessons-page">
        <DashboardNav navItems={NAV_ITEMS} />

        <main className="lessons-main" id="main-content" tabIndex={-1}>
          <section className="lesson-detail-card">
            <h1>Bài học đang bị khóa</h1>
            <p>Hãy hoàn thành bài trước trước khi mở bài này.</p>
            <Link to={`/lessons/${level}`} className="lesson-primary-btn">
              Quay lại bài học {level.toUpperCase()}
            </Link>
          </section>
        </main>
      </div>
    )
  }

  if (isLoading || isProgressLoading) {
    return (
      <div className="lessons-page">
        <DashboardNav navItems={NAV_ITEMS} />

        <main className="lessons-main" id="main-content" tabIndex={-1}>
          <section className="lesson-detail-card">
            <p role="status" className="lessons-feedback">Đang tải bài học từ cơ sở dữ liệu...</p>
          </section>
        </main>
      </div>
    )
  }

  if (errorMessage || progressErrorMessage || !lesson) {
    return (
      <div className="lessons-page">
        <DashboardNav navItems={NAV_ITEMS} />

        <main className="lessons-main" id="main-content" tabIndex={-1}>
          <section className="lesson-detail-card">
            <p role="alert" className="lessons-feedback lessons-feedback--error">
              {errorMessage || progressErrorMessage || 'Không tìm thấy bài học.'}
            </p>
            <Link to={`/lessons/${level}`} className="lesson-primary-btn">
              Quay lại bài học
            </Link>
          </section>
        </main>
      </div>
    )
  }

  const isCompleted = completedLessons.has(lesson.id)
  const levelMeta = lessonLevelMeta[level]
  const lessonContent = createLessonContent(lesson, normalizedVocabulary)

  const handleMarkComplete = async () => {
    if (isCompleted || isCompleting) {
      return
    }

    setIsCompleting(true)
    setCompleteErrorMessage('')

    try {
      await markLessonCompleted(lesson.id)
    } catch (error) {
      setCompleteErrorMessage(error.message)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="lessons-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="lessons-main lessons-main--detail" id="main-content" tabIndex={-1}>
        <div>
          <Link to={`/lessons/${level}`} className="lesson-back-link">
            <ArrowLeftIcon className="lesson-back-icon" />
            Quay lại bài học
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
              <div className="lesson-completed-badge" aria-label="Đã hoàn thành">
                <CheckIcon className="lesson-completed-icon" />
              </div>
            ) : null}
          </div>

          <div className="lessons-hero-meta">
            <span>{lesson.estimatedTime} phút</span>
            <span>•</span>
            <span>{normalizedVocabulary.length} từ vựng</span>
            <span>•</span>
            <span>{lesson.grammarCount || lesson.grammar?.length || 0} mẫu ngữ pháp</span>
          </div>
        </section>

        <div className="lesson-detail-layout">
          <div className="lesson-detail-main-column">
            <section className="lesson-detail-card">
              <div className="lesson-content-prose">
                {renderLessonContent(lessonContent)}
              </div>
            </section>

            <LessonGrammarSection grammar={lesson.grammar} />

            <section className="lesson-detail-card">
              <h2 className="lesson-section-title">Bài luyện tập</h2>

              <div className="lesson-exercises-list">
                <article className="lesson-exercise-item">
                  <p className="lesson-exercise-title">Viết mỗi từ vựng 5 lần</p>
                  <div className="lesson-word-chips">
                    {normalizedVocabulary.slice(0, 3).map((word) => (
                      <span key={`chip-${word.japanese}`} className="lesson-word-chip">
                        {word.japanese}
                      </span>
                    ))}
                  </div>
                </article>

                <article className="lesson-exercise-item">
                  <p className="lesson-exercise-title">Đặt câu với từ vựng mới</p>
                  <p className="lesson-exercise-note">
                    Hãy thử đặt ít nhất 3 câu với các từ trong bài học này.
                  </p>
                </article>

                <article className="lesson-exercise-item">
                  <p className="lesson-exercise-title">Nghe và lặp lại</p>
                  <p className="lesson-exercise-note">
                    Luyện phát âm bằng cách nghe người bản xứ và lặp lại theo họ.
                  </p>
                </article>
              </div>
            </section>

            <LessonQuiz
              key={lesson.id}
              level={level}
              lessonNumber={parsedLessonNumber}
              questions={quizQuestions}
              onCompleted={() => markLessonCompleted(lesson.id).catch(() => {})}
            />

            <button
              type="button"
              onClick={handleMarkComplete}
              className={`lesson-mark-btn lessons-hero--${levelMeta.gradientClass}`}
              disabled={isCompleted || isCompleting}
            >
              <CheckIcon className="lesson-mark-icon" />
              <span>
                {isCompleted
                  ? 'Đã hoàn thành'
                  : isCompleting
                    ? 'Đang lưu...'
                    : 'Đánh dấu hoàn thành'}
              </span>
            </button>

            {completeErrorMessage ? (
              <p role="alert" className="lessons-feedback lessons-feedback--error">{completeErrorMessage}</p>
            ) : null}
          </div>

          <aside className="lesson-vocabulary-sidebar">
            <section className="lesson-vocabulary-card">
              <h3>Từ vựng</h3>

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
                        aria-label={`Nghe phát âm ${word.romaji}`}
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
