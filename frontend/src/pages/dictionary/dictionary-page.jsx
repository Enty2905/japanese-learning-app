import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { useDictionarySearch } from '../../hooks/use-dictionary-search'
import {
  fetchDictionaryHistory,
  fetchKanjiMemoryHints,
} from '../../services/dictionary.service'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './dictionary-page.css'

const SEARCH_TABS = [
  { id: 'vocabulary', label: 'Từ vựng' },
  { id: 'kanji', label: 'Hán tự' },
]

const HOT_KEYWORDS = ['以上', '役割', '値段', '間', '検討', '活躍', '技術', '影響', '頭', '人', 'さ']
const JLPT_LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5']
const GUEST_HISTORY_KEY = 'dictionary-search-history'

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function VolumeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 9v6h4l5 4V5L8 9H4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 4h11a2 2 0 0 1 2 2v14H8a3 3 0 0 0-3 3V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M8 18h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function SparkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3 9.7 9.7 3 12l6.7 2.3L12 21l2.3-6.7L21 12l-6.7-2.3L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function playText(text) {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }

  const utterance = new window.SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.9
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

function splitReading(reading) {
  if (!reading) {
    return []
  }

  return reading
    .split(/[,\s;、]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getDisplayMeaning(item) {
  return item?.meaningVi || item?.meaningEn || 'Chưa có nghĩa.'
}

function readGuestHistory() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const parsedHistory = JSON.parse(window.localStorage.getItem(GUEST_HISTORY_KEY) || '[]')

    if (!Array.isArray(parsedHistory)) {
      return []
    }

    return parsedHistory.filter((item) => typeof item?.query === 'string' && item.query.trim())
  } catch {
    return []
  }
}

function writeGuestHistory(query, type) {
  if (typeof window === 'undefined' || !query) {
    return []
  }

  const nextEntry = {
    query,
    type,
  }
  const nextHistory = [
    nextEntry,
    ...readGuestHistory().filter((item) => item.query !== query || item.type !== type),
  ].slice(0, 12)

  window.localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(nextHistory))
  return nextHistory
}

function normalizeHistoryEntries(historyEntries, fallbackType) {
  return historyEntries
    .map((item) => {
      if (typeof item === 'string') {
        return {
          query: item,
          type: fallbackType,
        }
      }

      return {
        query: item?.query || item?.queryText || '',
        type: item?.type || item?.searchType || fallbackType,
      }
    })
    .filter((item) => item.query)
}

function DictionarySearchBox({
  activeType,
  inputValue,
  onInputChange,
  onSubmit,
  onTabChange,
}) {
  return (
    <section className="dictionary-search-panel">
      <form className="dictionary-search-row" onSubmit={onSubmit}>
        <SearchIcon className="dictionary-search-icon" />
        <input
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          className="dictionary-search-input"
          placeholder="日本, nihon, Nhật Bản"
          aria-label="Nhập từ khóa tra cứu"
        />

        <select className="dictionary-language-select" aria-label="Chọn ngôn ngữ">
          <option>Nhật - Việt</option>
          <option>Việt - Nhật</option>
        </select>
      </form>

      <div className="dictionary-tabs" role="tablist" aria-label="Loại tra cứu">
        {SEARCH_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`dictionary-tab${activeType === tab.id ? ' is-active' : ''}`}
            disabled={tab.disabled}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function EmptyDictionaryState({
  historyEntries,
  memoryHints,
  onKeywordSelect,
}) {
  return (
    <div className="dictionary-content-grid">
      <section className="dictionary-panel dictionary-tips-panel">
        <div className="dictionary-panel-head">
          <SparkIcon className="dictionary-section-icon" />
          <h2>Tips</h2>
        </div>

        <ul className="dictionary-tip-list">
          <li>Đăng nhập tài khoản để đồng bộ dữ liệu và sử dụng trên nhiều thiết bị.</li>
          <li>Có thể chuyển thành te, ta, bị động... ở dạng nguyên thể, thử 食べた.</li>
          <li>Tra cứu katakana: viết hoa chữ đó, ví dụ: BETONAMU.</li>
        </ul>

        <KeywordSection
          title="Lịch sử"
          keywords={historyEntries}
          emptyText="Chưa có lịch sử tra cứu."
          onKeywordSelect={onKeywordSelect}
        />
        <KeywordSection title="Từ khoá hot" keywords={HOT_KEYWORDS} onKeywordSelect={onKeywordSelect} />

        <section className="dictionary-keyword-section">
          <h3>JLPT</h3>
          <div className="dictionary-jlpt-row">
            {JLPT_LEVELS.map((level) => (
              <span key={level} className={`dictionary-jlpt-chip dictionary-jlpt-chip--${level.toLowerCase()}`}>
                {level}
              </span>
            ))}
          </div>
        </section>
      </section>

      <aside className="dictionary-side-column">
        <section className="dictionary-panel dictionary-memory-panel">
          <h2>Gợi ý cách nhớ Kanji</h2>
          {memoryHints.length > 0 ? (
            memoryHints.map((item) => (
              <article key={item.id || item.kanji} className="dictionary-memory-item">
                <div>
                  <span>{item.kanji}</span>
                  <strong>{item.hanViet || item.onyomi || item.kunyomi}</strong>
                </div>
                <p>{getDisplayMeaning(item)}</p>
                <small>{item.mnemonic}</small>
              </article>
            ))
          ) : (
            <p className="dictionary-empty-note">Chưa có gợi ý cách nhớ từ cơ sở dữ liệu.</p>
          )}
        </section>
      </aside>
    </div>
  )
}

function KeywordSection({
  title,
  keywords,
  emptyText = '',
  onKeywordSelect,
}) {
  const normalizedKeywords = normalizeHistoryEntries(keywords, 'vocabulary')

  return (
    <section className="dictionary-keyword-section">
      <div className="dictionary-keyword-head">
        <h3>{title}</h3>
        <button type="button">Xem thêm</button>
      </div>

      <div className="dictionary-chip-list">
        {normalizedKeywords.map((keyword) => (
          <button
            key={`${title}-${keyword.type}-${keyword.query}`}
            type="button"
            className="dictionary-chip"
            onClick={() => onKeywordSelect(keyword)}
          >
            {keyword.query}
          </button>
        ))}
        {normalizedKeywords.length === 0 && emptyText ? (
          <p className="dictionary-empty-note">{emptyText}</p>
        ) : null}
      </div>
    </section>
  )
}

function VocabularyResult({ vocabulary, relatedKanji, query }) {
  const primaryWord = vocabulary[0]
  const wordExamples = primaryWord?.examples || []

  if (!primaryWord) {
    return <NoResult query={query} label="từ vựng" />
  }

  return (
    <div className="dictionary-result-grid">
      <section className="dictionary-panel dictionary-entry-panel">
        <div className="dictionary-entry-toolbar">
          <button type="button" className="dictionary-segment-btn" aria-label="Thêm vào sổ tay">
            <PlusIcon />
          </button>
          <button type="button" className="dictionary-segment-btn" aria-label="Mở sổ tay">
            <BookIcon />
          </button>
          <button
            type="button"
            className="dictionary-segment-btn"
            onClick={() => playText(primaryWord.word)}
            aria-label="Phát âm"
          >
            <VolumeIcon />
          </button>
        </div>

        <header className="dictionary-entry-header">
          <h1>{primaryWord.word}</h1>
          <p>
            {primaryWord.kana ? `「${primaryWord.kana}」` : null}
            {primaryWord.hanViet ? ` 「${primaryWord.hanViet}」` : null}
          </p>
          <button
            type="button"
            className="dictionary-audio-link"
            onClick={() => playText(primaryWord.word)}
          >
            <VolumeIcon />
            <span>{primaryWord.kana || primaryWord.romaji || primaryWord.word}</span>
          </button>
        </header>

        <div className="dictionary-action-row">
          <button type="button">Kết hợp từ</button>
          <button type="button">Ảnh minh họa</button>
          <button type="button">Luyện phát âm</button>
        </div>

        <section className="dictionary-meaning-section">
          <div className="dictionary-meaning-head">
            <h2>{primaryWord.wordType || 'Từ vựng'}</h2>
            <span>{primaryWord.jlptLevel || 'JLPT'}</span>
          </div>

          <MeaningItem title={getDisplayMeaning(primaryWord)}>
            {wordExamples[0] ? (
              <>
                <p className="dictionary-japanese-line">{wordExamples[0].exampleJp}</p>
                <p>{wordExamples[0].exampleVi}</p>
              </>
            ) : primaryWord.notes ? (
              <p>{primaryWord.notes}</p>
            ) : null}
          </MeaningItem>

          {wordExamples.slice(1, 3).map((example) => (
            <MeaningItem key={example.id} title={example.exampleVi}>
              <p className="dictionary-japanese-line">{example.exampleJp}</p>
              {example.exampleKana ? <p>{example.exampleKana}</p> : null}
            </MeaningItem>
          ))}
        </section>

        {primaryWord.imageUrl ? (
          <section className="dictionary-image-section">
            <h2>Ảnh minh họa</h2>
            <img src={primaryWord.imageUrl} alt={`Minh họa cho ${primaryWord.word}`} />
          </section>
        ) : null}
      </section>

      <aside className="dictionary-side-column">
        <section className="dictionary-panel dictionary-lookup-panel">
          <h2>Các từ vựng liên quan tới {query}</h2>
          {vocabulary.slice(0, 6).map((item) => (
            <article key={item.id} className="dictionary-lookup-item">
              <span>{item.word}</span>
              <p>{getDisplayMeaning(item)}</p>
              <small>{item.kana || item.romaji}</small>
            </article>
          ))}
        </section>

        {relatedKanji.length > 0 ? (
          <section className="dictionary-panel dictionary-kanji-side-panel">
            <h2>Các chữ kanji của {primaryWord.word}</h2>
            {relatedKanji.map((kanji) => (
              <KanjiMiniCard key={kanji.id} kanji={kanji} />
            ))}
          </section>
        ) : null}
      </aside>
    </div>
  )
}

function MeaningItem({ title, children }) {
  return (
    <article className="dictionary-meaning-item">
      <h3>{title}</h3>
      <div>{children}</div>
    </article>
  )
}

function KanjiResult({ kanji, query }) {
  const primaryKanji = kanji[0]

  if (!primaryKanji) {
    return <NoResult query={query} label="kanji" />
  }

  return (
    <div className="dictionary-result-grid">
      <section className="dictionary-panel dictionary-entry-panel">
        <div className="dictionary-entry-toolbar">
          <button type="button" className="dictionary-segment-btn" aria-label="Luyện viết">あ</button>
          <button type="button" className="dictionary-segment-btn" aria-label="Sổ tay">
            <BookIcon />
          </button>
          <button type="button" className="dictionary-segment-btn" aria-label="Thêm">
            <PlusIcon />
          </button>
        </div>

        <header className="dictionary-kanji-header">
          <div>
            <h1>{primaryKanji.kanji}</h1>
            <p>「{primaryKanji.hanViet || primaryKanji.meaningVi}」</p>
          </div>
          <KanjiStrokeBox kanji={primaryKanji} />
        </header>

        <section className="dictionary-kanji-info">
          <h2>Phát âm</h2>
          <ReadingGroup label="Onyomi" readings={splitReading(primaryKanji.onyomi)} />
          <ReadingGroup label="Kunyomi" readings={splitReading(primaryKanji.kunyomi)} />

          <div className="dictionary-stat-row">
            <StatBlock label="Số nét" value={primaryKanji.strokeCount || '-'} />
            <StatBlock label="JLPT" value={primaryKanji.jlptLevel || '-'} />
            <StatBlock label="Bộ" value={primaryKanji.radical || '-'} />
          </div>
        </section>

        <section className="dictionary-kanji-breakdown">
          <h2>Bộ</h2>
          <p>{primaryKanji.radical || 'Chưa có dữ liệu bộ thủ.'}</p>
        </section>

        <section className="dictionary-kanji-meaning">
          <h2>Nghĩa</h2>
          <p>{getDisplayMeaning(primaryKanji)}</p>
        </section>

        {primaryKanji.examples.length > 0 ? (
          <section className="dictionary-kanji-examples">
            <h2>Ví dụ</h2>
            {primaryKanji.examples.slice(0, 4).map((example) => (
              <article key={example.id}>
                <strong>{example.exampleJp}</strong>
                {example.exampleKana ? <span>{example.exampleKana}</span> : null}
                <p>{example.exampleVi}</p>
              </article>
            ))}
          </section>
        ) : null}

        <section className="dictionary-kanji-mnemonic">
          <h2>Cách nhớ</h2>
          <p>{primaryKanji.mnemonic || 'Chưa có mẹo ghi nhớ cho kanji này.'}</p>
        </section>
      </section>

      <aside className="dictionary-side-column">
        <section className="dictionary-panel dictionary-lookup-panel">
          <h2>Kết quả tra cứu kanji</h2>
          {kanji.slice(0, 8).map((item) => (
            <article
              key={item.id}
              className={`dictionary-kanji-result-item${item.id === primaryKanji.id ? ' is-active' : ''}`}
            >
              <span>{item.kanji}</span>
              <div>
                <strong>{item.hanViet || item.meaningVi}</strong>
                <p>{getDisplayMeaning(item)}</p>
              </div>
            </article>
          ))}
        </section>
      </aside>
    </div>
  )
}

function ReadingGroup({ label, readings }) {
  if (readings.length === 0) {
    return null
  }

  return (
    <div className="dictionary-reading-group">
      <span>{label}</span>
      <div>
        {readings.map((reading) => (
          <strong key={`${label}-${reading}`}>{reading}</strong>
        ))}
      </div>
    </div>
  )
}

function StatBlock({ label, value }) {
  return (
    <div className="dictionary-stat-block">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function KanjiMiniCard({ kanji }) {
  return (
    <article className="dictionary-kanji-mini-card">
      <div className="dictionary-kanji-mini-head">
        <span>{kanji.kanji}</span>
        <strong>「{kanji.onyomi || kanji.kunyomi || kanji.hanViet}」</strong>
      </div>
      <p>{kanji.hanViet || getDisplayMeaning(kanji)}</p>
      <KanjiStrokeBox kanji={kanji} compact />
      <small>Hán tự: {kanji.kanji} - {kanji.hanViet || getDisplayMeaning(kanji)}</small>
    </article>
  )
}

function KanjiStrokeBox({ kanji, compact = false }) {
  return (
    <div className={`dictionary-stroke-box${compact ? ' dictionary-stroke-box--compact' : ''}`}>
      {kanji.writingSvgUrl ? (
        <img src={kanji.writingSvgUrl} alt={`Thứ tự nét của ${kanji.kanji}`} />
      ) : (
        <span>{kanji.kanji}</span>
      )}
    </div>
  )
}

function NoResult({ query, label }) {
  return (
    <section className="dictionary-panel dictionary-no-result">
      <h2>Không tìm thấy {label}</h2>
      <p>Không có kết quả phù hợp với “{query}”. Hãy thử cách đọc kana, romaji hoặc nghĩa tiếng Việt.</p>
    </section>
  )
}

export function DictionaryPage({ redirectToDictionary = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParam = searchParams.get('q') || ''
  const typeParam = searchParams.get('type') || 'vocabulary'
  const activeType = typeParam === 'kanji' ? 'kanji' : 'vocabulary'
  const [inputValue, setInputValue] = useState(queryParam)
  const [guestHistory, setGuestHistory] = useState(readGuestHistory)
  const [accountHistory, setAccountHistory] = useState([])
  const [memoryHints, setMemoryHints] = useState([])
  const { result, isLoading, errorMessage } = useDictionarySearch(queryParam, activeType)

  useEffect(() => {
    let isMounted = true

    async function loadMemoryHints() {
      try {
        const hints = await fetchKanjiMemoryHints()

        if (isMounted) {
          setMemoryHints(hints)
        }
      } catch {
        if (isMounted) {
          setMemoryHints([])
        }
      }
    }

    loadMemoryHints()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadSearchHistory() {
      try {
        const history = await fetchDictionaryHistory()

        if (isMounted) {
          setAccountHistory(history)
        }
      } catch {
        if (isMounted) {
          setAccountHistory([])
        }
      }
    }

    loadSearchHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const hasQuery = queryParam.trim().length > 0
  const historyEntries = accountHistory.length > 0 ? accountHistory : guestHistory
  const totalResults = useMemo(
    () => result.vocabulary.length + result.kanji.length,
    [result.vocabulary.length, result.kanji.length],
  )

  if (redirectToDictionary) {
    return <Navigate to="/dictionary" replace />
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const normalizedInput = inputValue.trim()

    if (normalizedInput) {
      setGuestHistory(writeGuestHistory(normalizedInput, activeType))
    }

    setSearchParams(normalizedInput ? { q: normalizedInput, type: activeType } : { type: activeType })
  }

  const handleTabChange = (nextType) => {
    setSearchParams(queryParam ? { q: queryParam, type: nextType } : { type: nextType })
  }

  const handleKeywordSelect = (keyword) => {
    const nextQuery = typeof keyword === 'string' ? keyword : keyword.query
    const nextType = typeof keyword === 'string' ? activeType : keyword.type

    setInputValue(nextQuery)
    setGuestHistory(writeGuestHistory(nextQuery, nextType))
    setSearchParams({ q: nextQuery, type: nextType })
  }

  return (
    <div className="dictionary-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="dictionary-main">
        <DictionarySearchBox
          activeType={activeType}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          onTabChange={handleTabChange}
        />

        {!hasQuery ? (
          <EmptyDictionaryState
            historyEntries={historyEntries}
            memoryHints={memoryHints}
            onKeywordSelect={handleKeywordSelect}
          />
        ) : (
          <>
            {isLoading ? <p className="dictionary-status">Đang tra cứu dữ liệu...</p> : null}
            {errorMessage ? <p className="dictionary-status dictionary-status--error">{errorMessage}</p> : null}
            {!isLoading && !errorMessage && totalResults === 0 ? (
              <NoResult query={queryParam} label={activeType === 'kanji' ? 'kanji' : 'từ vựng'} />
            ) : null}
            {!isLoading && !errorMessage && activeType === 'vocabulary' && totalResults > 0 ? (
              <VocabularyResult
                vocabulary={result.vocabulary}
                relatedKanji={result.kanji}
                query={queryParam}
              />
            ) : null}
            {!isLoading && !errorMessage && activeType === 'kanji' && totalResults > 0 ? (
              <KanjiResult kanji={result.kanji} query={queryParam} />
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
