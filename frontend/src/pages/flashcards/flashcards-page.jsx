import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { useAuthSession } from '../../hooks/use-auth-session'
import {
  createMyFlashcards,
  deleteMyFlashcard,
  fetchMyFlashcards,
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

function CardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="5" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m9 4 5 16M8 9h5M10 14h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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

  const separator = separatorId === 'custom'
    ? customSeparator
    : CARD_SEPARATOR_OPTIONS.find((option) => option.id === separatorId)?.value

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
  const termSeparator = termSeparatorId === 'custom'
    ? customTermSeparator
    : TERM_SEPARATOR_OPTIONS.find((option) => option.id === termSeparatorId)?.value

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

function FlashcardRow({ flashcard, onDelete }) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <article className="flashcards-row">
      <button
        type="button"
        className={`flashcards-card-preview${isFlipped ? ' is-flipped' : ''}`}
        onClick={() => setIsFlipped((current) => !current)}
      >
        <span>{isFlipped ? 'Mặt sau' : 'Mặt trước'}</span>
        <strong>{isFlipped ? flashcard.backText : flashcard.frontText}</strong>
      </button>

      <div className="flashcards-row-meta">
        <CardIcon />
        <div>
          <h2>{flashcard.frontText}</h2>
          <p>{flashcard.backText}</p>
        </div>
      </div>

      <button
        type="button"
        className="flashcards-icon-btn"
        onClick={() => onDelete(flashcard.id)}
        aria-label="Xóa flash card"
      >
        <TrashIcon />
      </button>
    </article>
  )
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
          placeholder={'Từ 1\tĐịnh nghĩa 1\nTừ 2\tĐịnh nghĩa 2\nTừ 3\tĐịnh nghĩa 3'}
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

function CreateFlashcardDialog({
  isSaving,
  errorMessage,
  onClose,
  onSubmit,
}) {
  const [mode, setMode] = useState('manual')
  const [frontText, setFrontText] = useState('')
  const [backText, setBackText] = useState('')
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
    ? [{ frontText: frontText.trim(), backText: backText.trim() }].filter((card) => card.frontText && card.backText)
    : previewCards

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(cardsToSubmit)
  }

  return (
    <div className="flashcards-modal-backdrop" role="presentation">
      <section className="flashcards-modal" role="dialog" aria-modal="true" aria-labelledby="flashcards-modal-title">
        <form onSubmit={handleSubmit}>
          <header className="flashcards-modal-head">
            <h2 id="flashcards-modal-title">Tạo flash card mới</h2>
            <button type="button" className="flashcards-close-btn" onClick={onClose} aria-label="Đóng">
              ×
            </button>
          </header>

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
            <div className="flashcards-manual-fields">
              <label className="flashcards-field">
                <span>Thuật ngữ</span>
                <input
                  value={frontText}
                  onChange={(event) => setFrontText(event.target.value)}
                  placeholder="日本語"
                />
              </label>
              <label className="flashcards-field">
                <span>Định nghĩa</span>
                <input
                  value={backText}
                  onChange={(event) => setBackText(event.target.value)}
                  placeholder="Tiếng Nhật"
                />
              </label>
            </div>
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
            <button type="submit" className="flashcards-primary-btn" disabled={isSaving || cardsToSubmit.length === 0}>
              {isSaving ? 'Đang tạo...' : mode === 'bulk' ? `Tạo ${cardsToSubmit.length} thẻ` : 'Tạo'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export function FlashcardsPage() {
  const { isAuthenticated, user } = useAuthSession()
  const [flashcards, setFlashcards] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formErrorMessage, setFormErrorMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let isMounted = true

    fetchMyFlashcards()
      .then((items) => {
        if (isMounted) {
          setFlashcards(items)
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
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  const handleCreateFlashcards = async (cards) => {
    if (cards.length === 0) {
      setFormErrorMessage('Hãy nhập đủ mặt trước và mặt sau.')
      return
    }

    setIsSaving(true)
    setFormErrorMessage('')

    try {
      const createdCards = await createMyFlashcards(cards)
      setFlashcards((currentCards) => [...createdCards, ...currentCards])
      setIsDialogOpen(false)
    } catch (error) {
      setFormErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteFlashcard = async (flashcardId) => {
    setErrorMessage('')

    try {
      await deleteMyFlashcard(flashcardId)
      setFlashcards((currentCards) => currentCards.filter((card) => card.id !== flashcardId))
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleOpenDialog = () => {
    setFormErrorMessage('')
    setIsDialogOpen(true)
  }

  return (
    <div className="dashboard-page flashcards-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="dashboard-main flashcards-main">
        <section className="flashcards-hero">
          <div className="flashcards-folder-icon">
            <CardIcon />
          </div>
          <div>
            <h1>Flash card của {getDisplayName(user)}</h1>
            <p>{flashcards.length} thẻ</p>
          </div>
          <button type="button" className="flashcards-add-btn" onClick={handleOpenDialog} aria-label="Thêm flash card">
            <PlusIcon />
          </button>
        </section>

        <section className="flashcards-toolbar">
          <button type="button" className="is-active">Tất cả</button>
          <button type="button" onClick={handleOpenDialog}>
            <PlusIcon />
            Thẻ
          </button>
        </section>

        {isLoading ? <p className="flashcards-status">Đang tải flash card...</p> : null}
        {!isLoading && errorMessage ? <p className="flashcards-status flashcards-status--error">{errorMessage}</p> : null}

        {!isLoading ? (
          <section className="flashcards-list" aria-label="Flash card của người dùng">
            {flashcards.map((flashcard) => (
              <FlashcardRow
                key={flashcard.id}
                flashcard={flashcard}
                onDelete={handleDeleteFlashcard}
              />
            ))}
          </section>
        ) : null}
      </main>

      {isDialogOpen ? (
        <CreateFlashcardDialog
          isSaving={isSaving}
          errorMessage={formErrorMessage}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleCreateFlashcards}
        />
      ) : null}
    </div>
  )
}
