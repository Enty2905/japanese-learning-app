import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { useAuthSession } from '../../hooks/use-auth-session'
import {
  createMyFlashcardSet,
  deleteMyFlashcardSet,
  fetchMyFlashcardSet,
  fetchMyFlashcardSets,
} from '../../services/flashcard.service'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './flashcards-page.css'

const TERM_SEPARATOR_OPTIONS = [
  { id: 'tab', label: 'Tab', value: '\t' },
  { id: 'comma', label: 'Phẩy', value: ',' },
  { id: 'custom', label: 'Tùy chỉnh', value: '' },
]

const CARD_SEPARATOR_OPTIONS = [
  { id: 'newline', label: 'Dòng mới', value: '\n' },
  { id: 'semicolon', label: 'Chấm phẩy', value: ';' },
  { id: 'custom', label: 'Tùy chỉnh', value: '' },
]

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function FolderIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 6.8A2.8 2.8 0 0 1 5.8 4h3.5l2 2.2h6.9A2.8 2.8 0 0 1 21 9v7.2a2.8 2.8 0 0 1-2.8 2.8H5.8A2.8 2.8 0 0 1 3 16.2V6.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 7h14M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 13h8l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getDisplayName(user) {
  return user?.displayName || user?.fullName || user?.email || 'bạn'
}

function splitByCardSeparator(text, separatorId, customSeparator) {
  if (!text.trim()) {
    return []
  }

  if (separatorId === 'newline') {
    return text.split(/\r?\n/)
  }

  const selectedOption = CARD_SEPARATOR_OPTIONS.find((option) => option.id === separatorId)
  const separator = separatorId === 'custom' ? customSeparator : selectedOption?.value

  if (!separator) {
    return []
  }

  return text.split(separator)
}

function parseBulkCards({
  text,
  termSeparatorId,
  customTermSeparator,
  cardSeparatorId,
  customCardSeparator,
}) {
  const selectedOption = TERM_SEPARATOR_OPTIONS.find((option) => option.id === termSeparatorId)
  const termSeparator = termSeparatorId === 'custom' ? customTermSeparator : selectedOption?.value

  if (!termSeparator) {
    return []
  }

  return splitByCardSeparator(text, cardSeparatorId, customCardSeparator)
    .map((rawCard) => rawCard.trim())
    .filter(Boolean)
    .map((rawCard) => {
      const [frontText, ...backParts] = rawCard.split(termSeparator)

      return {
        frontText: frontText?.trim() || '',
        backText: backParts.join(termSeparator).trim(),
      }
    })
    .filter((card) => card.frontText && card.backText)
}

function buildBlankCard() {
  return {
    frontText: '',
    backText: '',
  }
}

function SeparatorOption({ name, option, selectedValue, onChange }) {
  return (
    <label className="flashcards-radio">
      <input
        type="radio"
        name={name}
        value={option.id}
        checked={selectedValue === option.id}
        onChange={() => onChange(option.id)}
      />
      <span>{option.label}</span>
    </label>
  )
}

function BulkImportForm({
  bulkText,
  setBulkText,
  termSeparatorId,
  setTermSeparatorId,
  customTermSeparator,
  setCustomTermSeparator,
  cardSeparatorId,
  setCardSeparatorId,
  customCardSeparator,
  setCustomCardSeparator,
  previewCards,
}) {
  return (
    <div className="flashcards-import">
      <label className="flashcards-field">
        <span>Nhập dữ liệu</span>
        <textarea
          value={bulkText}
          onChange={(event) => setBulkText(event.target.value)}
          placeholder={'日本語\tTiếng Nhật\n学校\tTrường học\n先生\tGiáo viên'}
        />
      </label>

      <div className="flashcards-import-options">
        <section>
          <h3>Giữa thuật ngữ và định nghĩa</h3>
          {TERM_SEPARATOR_OPTIONS.map((option) => (
            <SeparatorOption
              key={option.id}
              name="term-separator"
              option={option}
              selectedValue={termSeparatorId}
              onChange={setTermSeparatorId}
            />
          ))}
          {termSeparatorId === 'custom' ? (
            <input
              className="flashcards-custom-separator"
              value={customTermSeparator}
              onChange={(event) => setCustomTermSeparator(event.target.value)}
              aria-label="Ký tự phân tách thuật ngữ"
            />
          ) : null}
        </section>

        <section>
          <h3>Giữa các thẻ</h3>
          {CARD_SEPARATOR_OPTIONS.map((option) => (
            <SeparatorOption
              key={option.id}
              name="card-separator"
              option={option}
              selectedValue={cardSeparatorId}
              onChange={setCardSeparatorId}
            />
          ))}
          {cardSeparatorId === 'custom' ? (
            <input
              className="flashcards-custom-separator"
              value={customCardSeparator}
              onChange={(event) => setCustomCardSeparator(event.target.value)}
              aria-label="Ký tự phân tách thẻ"
            />
          ) : null}
        </section>
      </div>

      <section className="flashcards-preview">
        <h3>Xem trước <span>{previewCards.length} thẻ</span></h3>
        {previewCards.length > 0 ? (
          <div className="flashcards-preview-list">
            {previewCards.slice(0, 6).map((card) => (
              <article key={`${card.frontText}-${card.backText}`}>
                <strong>{card.frontText}</strong>
                <span>{card.backText}</span>
              </article>
            ))}
          </div>
        ) : (
          <p>Không có nội dung để xem trước</p>
        )}
      </section>
    </div>
  )
}

function ManualCardsForm({ cards, onCardChange, onAddCard, onRemoveCard }) {
  return (
    <div className="flashcards-card-editor">
      {cards.map((card, index) => (
        <article key={`manual-card-${index + 1}`} className="flashcards-card-editor-row">
          <span>{index + 1}</span>
          <label className="flashcards-field">
            <span>Thuật ngữ</span>
            <input
              value={card.frontText}
              onChange={(event) => onCardChange(index, 'frontText', event.target.value)}
              placeholder="日本語"
            />
          </label>
          <label className="flashcards-field">
            <span>Định nghĩa</span>
            <input
              value={card.backText}
              onChange={(event) => onCardChange(index, 'backText', event.target.value)}
              placeholder="Tiếng Nhật"
            />
          </label>
          <button
            type="button"
            className="flashcards-icon-btn"
            onClick={() => onRemoveCard(index)}
            disabled={cards.length === 1}
            aria-label="Xóa thẻ"
          >
            <TrashIcon />
          </button>
        </article>
      ))}

      <button type="button" className="flashcards-secondary-btn flashcards-add-card-btn" onClick={onAddCard}>
        <PlusIcon />
        Thêm thẻ
      </button>
    </div>
  )
}

function CreateFlashcardSetDialog({
  isSaving,
  errorMessage,
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('manual')
  const [manualCards, setManualCards] = useState([buildBlankCard(), buildBlankCard()])
  const [bulkText, setBulkText] = useState('')
  const [termSeparatorId, setTermSeparatorId] = useState('tab')
  const [cardSeparatorId, setCardSeparatorId] = useState('newline')
  const [customTermSeparator, setCustomTermSeparator] = useState('')
  const [customCardSeparator, setCustomCardSeparator] = useState('')

  const previewCards = useMemo(
    () => parseBulkCards({
      text: bulkText,
      termSeparatorId,
      customTermSeparator,
      cardSeparatorId,
      customCardSeparator,
    }),
    [bulkText, termSeparatorId, customTermSeparator, cardSeparatorId, customCardSeparator],
  )

  const cardsToSubmit = mode === 'manual'
    ? manualCards
      .map((card) => ({
        frontText: card.frontText.trim(),
        backText: card.backText.trim(),
      }))
      .filter((card) => card.frontText && card.backText)
    : previewCards

  const handleCardChange = (index, field, value) => {
    setManualCards((currentCards) => currentCards.map((card, cardIndex) => {
      if (cardIndex !== index) {
        return card
      }

      return {
        ...card,
        [field]: value,
      }
    }))
  }

  const handleRemoveCard = (index) => {
    setManualCards((currentCards) => currentCards.filter((card, cardIndex) => cardIndex !== index))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      cards: cardsToSubmit,
    })
  }

  return (
    <div className="flashcards-modal-backdrop" role="presentation">
      <section className="flashcards-modal" role="dialog" aria-modal="true" aria-labelledby="flashcards-modal-title">
        <form onSubmit={handleSubmit}>
          <header className="flashcards-modal-head">
            <h2 id="flashcards-modal-title">Tạo một bộ thẻ mới</h2>
            <button type="button" className="flashcards-close-btn" onClick={onClose} aria-label="Đóng">
              &times;
            </button>
          </header>

          <div className="flashcards-set-fields">
            <label className="flashcards-field">
              <span>Tên bộ thẻ</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: 6 - Từ vựng"
              />
            </label>
            <label className="flashcards-field">
              <span>Mô tả</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Mô tả ngắn cho bộ thẻ"
              />
            </label>
          </div>

          <div className="flashcards-mode-tabs" role="tablist" aria-label="Cách nhập flash card">
            <button
              type="button"
              className={mode === 'manual' ? 'is-active' : ''}
              onClick={() => setMode('manual')}
            >
              Nhập tay
            </button>
            <button
              type="button"
              className={mode === 'bulk' ? 'is-active' : ''}
              onClick={() => setMode('bulk')}
            >
              Nhập nhiều
            </button>
          </div>

          {mode === 'manual' ? (
            <ManualCardsForm
              cards={manualCards}
              onCardChange={handleCardChange}
              onAddCard={() => setManualCards((currentCards) => [...currentCards, buildBlankCard()])}
              onRemoveCard={handleRemoveCard}
            />
          ) : (
            <BulkImportForm
              bulkText={bulkText}
              setBulkText={setBulkText}
              termSeparatorId={termSeparatorId}
              setTermSeparatorId={setTermSeparatorId}
              customTermSeparator={customTermSeparator}
              setCustomTermSeparator={setCustomTermSeparator}
              cardSeparatorId={cardSeparatorId}
              setCardSeparatorId={setCardSeparatorId}
              customCardSeparator={customCardSeparator}
              setCustomCardSeparator={setCustomCardSeparator}
              previewCards={previewCards}
            />
          )}

          {errorMessage ? <p className="flashcards-form-error">{errorMessage}</p> : null}

          <footer className="flashcards-modal-actions">
            <button type="button" className="flashcards-secondary-btn" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="flashcards-primary-btn"
              disabled={isSaving || !title.trim() || cardsToSubmit.length === 0}
            >
              {isSaving ? 'Đang tạo...' : `Tạo bộ ${cardsToSubmit.length} thẻ`}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function FlashcardSetCard({ flashcardSet, onDelete }) {
  return (
    <article className="flashcards-set-card">
      <Link to={`/flashcards/${flashcardSet.id}`} className="flashcards-set-link">
        <div className="flashcards-set-icon">
          <FolderIcon />
        </div>
        <div>
          <h2>{flashcardSet.title}</h2>
          <p>{flashcardSet.cardCount} thuật ngữ - Tác giả: bạn</p>
          {flashcardSet.description ? <small>{flashcardSet.description}</small> : null}
        </div>
      </Link>

      <button
        type="button"
        className="flashcards-icon-btn"
        onClick={() => onDelete(flashcardSet.id)}
        aria-label="Xóa bộ thẻ"
      >
        <TrashIcon />
      </button>
    </article>
  )
}

function FlashcardSetsView({
  user,
  sets,
  isLoading,
  errorMessage,
  onOpenDialog,
  onDeleteSet,
}) {
  return (
    <main className="dashboard-main flashcards-main">
      <section className="flashcards-hero">
        <div className="flashcards-folder-icon">
          <FolderIcon />
        </div>
        <div>
          <h1>Flash card của {getDisplayName(user)}</h1>
          <p>{sets.length} bộ thẻ</p>
        </div>
        <button type="button" className="flashcards-add-btn" onClick={onOpenDialog} aria-label="Thêm bộ thẻ">
          <PlusIcon />
        </button>
      </section>

      <section className="flashcards-toolbar">
        <button type="button" className="is-active">Tất cả</button>
        <button type="button" onClick={onOpenDialog}>
          <PlusIcon />
          Bộ thẻ
        </button>
      </section>

      {isLoading ? <p className="flashcards-status">Đang tải bộ thẻ...</p> : null}
      {!isLoading && errorMessage ? <p className="flashcards-status flashcards-status--error">{errorMessage}</p> : null}

      {!isLoading ? (
        <section className="flashcards-set-list" aria-label="Các bộ flash card">
          {sets.map((flashcardSet) => (
            <FlashcardSetCard
              key={flashcardSet.id}
              flashcardSet={flashcardSet}
              onDelete={onDeleteSet}
            />
          ))}
          {sets.length === 0 ? (
            <p className="flashcards-empty-state">Chưa có bộ thẻ nào.</p>
          ) : null}
        </section>
      ) : null}
    </main>
  )
}

function StudySummary({ knownCount, unknownCount, totalCards, onRestart }) {
  return (
    <section className="flashcards-summary">
      <h2>Kết quả ôn luyện</h2>
      <div className="flashcards-summary-grid">
        <article>
          <span>Đã thuộc</span>
          <strong>{knownCount}</strong>
        </article>
        <article>
          <span>Chưa thuộc</span>
          <strong>{unknownCount}</strong>
        </article>
        <article>
          <span>Tổng số</span>
          <strong>{totalCards}</strong>
        </article>
      </div>
      <button type="button" className="flashcards-primary-btn" onClick={onRestart}>
        Xem lại bộ thẻ
      </button>
    </section>
  )
}

function StudyCard({
  card,
  currentIndex,
  totalCards,
  isFlipped,
  knownCount,
  unknownCount,
  onFlip,
  onMarkKnown,
  onMarkUnknown,
}) {
  return (
    <section className="flashcards-study-panel">
      <div className="flashcards-study-progress" aria-label="Tiến độ ôn tập">
        <span>
          <small>Thẻ</small>
          <strong>{currentIndex + 1} / {totalCards}</strong>
        </span>
        <span>
          <small>Đã thuộc</small>
          <strong>{knownCount}</strong>
        </span>
        <span>
          <small>Chưa thuộc</small>
          <strong>{unknownCount}</strong>
        </span>
      </div>

      <div className="flashcards-study-stack">
        <button
          type="button"
          className={`flashcards-study-card${isFlipped ? ' is-flipped' : ''}`}
          onClick={onFlip}
          aria-label="Lật flash card"
        >
          <span className="flashcards-study-card-inner">
            <span className="flashcards-study-card-face flashcards-study-card-front">
              <small>Mặt trước</small>
              <strong>{card.frontText}</strong>
            </span>
            <span className="flashcards-study-card-face flashcards-study-card-back">
              <small>Mặt sau</small>
              <strong>{card.backText}</strong>
            </span>
          </span>
        </button>
      </div>

      <div className="flashcards-study-actions">
        <button type="button" className="flashcards-study-arrow flashcards-study-arrow--left" onClick={onMarkUnknown}>
          <span>←</span>
          Chưa thuộc
        </button>
        <button type="button" className="flashcards-study-arrow flashcards-study-arrow--right" onClick={onMarkKnown}>
          Đã thuộc
          <span>→</span>
        </button>
      </div>
    </section>
  )
}

function FlashcardSetDetailView({
  flashcardSet,
  isLoading,
  errorMessage,
  onRestart,
  studyState,
  setStudyState,
}) {
  const cards = flashcardSet?.cards || []
  const currentCard = cards[studyState.currentIndex]
  const knownCount = studyState.knownIds.length
  const unknownCount = studyState.unknownIds.length
  const isFinished = cards.length > 0 && studyState.currentIndex >= cards.length
  const cardCount = flashcardSet?.cardCount || cards.length

  const handleMark = (status) => {
    const cardId = currentCard?.id

    if (!cardId) {
      return
    }

    setStudyState((currentState) => {
      const nextKnownIds = currentState.knownIds.filter((id) => id !== cardId)
      const nextUnknownIds = currentState.unknownIds.filter((id) => id !== cardId)

      if (status === 'known') {
        nextKnownIds.push(cardId)
      } else {
        nextUnknownIds.push(cardId)
      }

      return {
        currentIndex: currentState.currentIndex + 1,
        isFlipped: false,
        knownIds: nextKnownIds,
        unknownIds: nextUnknownIds,
      }
    })
  }

  return (
    <main className="dashboard-main flashcards-main">
      <section className="flashcards-detail-head">
        <Link to="/flashcards" className="flashcards-back-link">← Các bộ thẻ</Link>
        {flashcardSet ? (
          <div className="flashcards-detail-head-content">
            <div className="flashcards-detail-title">
              <div className="flashcards-detail-icon">
                <FolderIcon />
              </div>
              <div>
                <h1>{flashcardSet.title}</h1>
                <div className="flashcards-detail-meta">
                  <span>{cardCount} thẻ</span>
                  {flashcardSet.description ? <span>{flashcardSet.description}</span> : null}
                </div>
              </div>
            </div>
            <div className="flashcards-detail-stats" aria-label="Thống kê bộ thẻ">
              <article>
                <span>Tổng thẻ</span>
                <strong>{cardCount}</strong>
              </article>
              <article>
                <span>Đã thuộc</span>
                <strong>{knownCount}</strong>
              </article>
              <article>
                <span>Chưa thuộc</span>
                <strong>{unknownCount}</strong>
              </article>
            </div>
          </div>
        ) : null}
      </section>

      {isLoading ? <p className="flashcards-status">Đang tải bộ thẻ...</p> : null}
      {!isLoading && errorMessage ? <p className="flashcards-status flashcards-status--error">{errorMessage}</p> : null}

      {!isLoading && flashcardSet && cards.length === 0 ? (
        <p className="flashcards-empty-state">Bộ này chưa có thẻ.</p>
      ) : null}

      {!isLoading && flashcardSet && currentCard && !isFinished ? (
        <StudyCard
          card={currentCard}
          currentIndex={studyState.currentIndex}
          totalCards={cards.length}
          isFlipped={studyState.isFlipped}
          knownCount={knownCount}
          unknownCount={unknownCount}
          onFlip={() => setStudyState((currentState) => ({
            ...currentState,
            isFlipped: !currentState.isFlipped,
          }))}
          onMarkKnown={() => handleMark('known')}
          onMarkUnknown={() => handleMark('unknown')}
        />
      ) : null}

      {!isLoading && flashcardSet && isFinished ? (
        <StudySummary
          knownCount={knownCount}
          unknownCount={unknownCount}
          totalCards={cards.length}
          onRestart={onRestart}
        />
      ) : null}

      {!isLoading && flashcardSet && cards.length > 0 ? (
        <section className="flashcards-detail-list">
          <div className="flashcards-detail-list-head">
            <h2>Thuật ngữ trong bộ này</h2>
            <span>{cards.length} mục</span>
          </div>
          {cards.map((card, index) => (
            <article key={card.id}>
              <span className="flashcards-detail-index">{index + 1}</span>
              <div>
                <small>Mặt trước</small>
                <strong>{card.frontText}</strong>
              </div>
              <div>
                <small>Mặt sau</small>
                <p>{card.backText}</p>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}

export function FlashcardsPage() {
  const navigate = useNavigate()
  const { setId } = useParams()
  const { isAuthenticated, user } = useAuthSession()
  const [sets, setSets] = useState([])
  const [activeSet, setActiveSet] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formErrorMessage, setFormErrorMessage] = useState('')
  const [studyState, setStudyState] = useState({
    currentIndex: 0,
    isFlipped: false,
    knownIds: [],
    unknownIds: [],
  })

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let isMounted = true
    const loadData = setId ? fetchMyFlashcardSet(setId) : fetchMyFlashcardSets()

    Promise.resolve().then(() => {
      if (!isMounted) {
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      if (setId) {
        setActiveSet(null)
      }
    })

    loadData
      .then((result) => {
        if (!isMounted) {
          return
        }

        setErrorMessage('')

        if (setId) {
          setActiveSet(result)
          setStudyState({
            currentIndex: 0,
            isFlipped: false,
            knownIds: [],
            unknownIds: [],
          })
        } else {
          setSets(result)
          setActiveSet(null)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error.message)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, setId])

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  const handleCreateSet = async (payload) => {
    if (!payload.title) {
      setFormErrorMessage('Hãy nhập tên bộ thẻ.')
      return
    }

    if (payload.cards.length === 0) {
      setFormErrorMessage('Hãy nhập ít nhất một thẻ có đủ thuật ngữ và định nghĩa.')
      return
    }

    setIsSaving(true)
    setFormErrorMessage('')

    try {
      const createdSet = await createMyFlashcardSet(payload)
      setSets((currentSets) => [createdSet, ...currentSets])
      setIsDialogOpen(false)
      navigate(`/flashcards/${createdSet.id}`)
    } catch (error) {
      setFormErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSet = async (flashcardSetId) => {
    setErrorMessage('')

    try {
      await deleteMyFlashcardSet(flashcardSetId)
      setSets((currentSets) => currentSets.filter((flashcardSet) => flashcardSet.id !== flashcardSetId))
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleRestartStudy = () => {
    setStudyState({
      currentIndex: 0,
      isFlipped: false,
      knownIds: [],
      unknownIds: [],
    })
  }

  const handleOpenDialog = () => {
    setFormErrorMessage('')
    setIsDialogOpen(true)
  }

  const isViewingLoadedSet = setId ? String(activeSet?.id) === String(setId) : true
  const isPageLoading = isLoading || (setId ? !isViewingLoadedSet : false)

  return (
    <div className="dashboard-page flashcards-page">
      <DashboardNav navItems={NAV_ITEMS} />

      {setId ? (
        <FlashcardSetDetailView
          flashcardSet={activeSet}
          isLoading={isPageLoading}
          errorMessage={errorMessage}
          onRestart={handleRestartStudy}
          studyState={studyState}
          setStudyState={setStudyState}
        />
      ) : (
        <FlashcardSetsView
          user={user}
          sets={sets}
          isLoading={isPageLoading}
          errorMessage={errorMessage}
          onOpenDialog={handleOpenDialog}
          onDeleteSet={handleDeleteSet}
        />
      )}

      {isDialogOpen ? (
        <CreateFlashcardSetDialog
          isSaving={isSaving}
          errorMessage={formErrorMessage}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleCreateSet}
        />
      ) : null}
    </div>
  )
}
