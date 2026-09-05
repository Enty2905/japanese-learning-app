import { useEffect, useMemo, useRef, useState } from 'react'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import {
  fetchAssistantSessionMessages,
  fetchAssistantSessions,
  sendAssistantMessage,
} from '../../services/assistant.service'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './assistant-page.css'

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1']

function SendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21 3 10.8 13.2M21 3l-6.5 18-3.7-7.8L3 9.5 21 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SparkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3 9.7 9.7 3 12l6.7 2.3L12 21l2.3-6.7L21 12l-6.7-2.3L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function sanitizeMessageContent(content) {
  return String(content || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*---+\s*$/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderMessageContent(content) {
  return sanitizeMessageContent(content)
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => (
      <p key={paragraph}>
        {paragraph.split('\n').map((line, index) => (
          <span key={`${line}-${index}`}>
            {line}
            {index < paragraph.split('\n').length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    ))
}

function AssistantMessage({ message }) {
  const isUser = message.sender === 'user'

  return (
    <article className={`assistant-message${isUser ? ' assistant-message--user' : ''}`}>
      <div className="assistant-message__avatar">{isUser ? 'ME' : 'AI'}</div>
      <div className="assistant-message__body">
        {renderMessageContent(message.content)}
      </div>
    </article>
  )
}

function AssistantSources({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return (
      <aside className="assistant-sources">
        <h2>Tài liệu tham khảo</h2>
        <p>Chưa có dữ liệu nội bộ khớp rõ với câu hỏi hiện tại.</p>
      </aside>
    )
  }

  return (
    <aside className="assistant-sources">
      <h2>Tài liệu tham khảo</h2>
      <div className="assistant-source-list">
        {sources.map((source) => (
          <article key={`${source.type}-${source.label}`} className="assistant-source-item">
            <span>{source.type}</span>
            <strong>{source.label}</strong>
            {source.detail ? <p>{source.detail}</p> : null}
          </article>
        ))}
      </div>
    </aside>
  )
}

export function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      content: 'Bạn muốn ôn từ vựng, ngữ pháp hay hỏi về một bài học cụ thể?',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('N5')
  const [sessionId, setSessionId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [sources, setSources] = useState([])
  const [modelName, setModelName] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const messagesEndRef = useRef(null)

  const canSubmit = useMemo(() => inputValue.trim().length > 0 && !isSending, [
    inputValue,
    isSending,
  ])
  const currentSessionTitle = useMemo(() => {
    return sessions.find((session) => session.id === sessionId)?.title || 'Cuộc trò chuyện mới'
  }, [sessionId, sessions])

  useEffect(() => {
    let isMounted = true

    async function loadSessions() {
      setIsLoadingSessions(true)

      try {
        const nextSessions = await fetchAssistantSessions()

        if (isMounted) {
          setSessions(nextSessions)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message)
        }
      } finally {
        if (isMounted) {
          setIsLoadingSessions(false)
        }
      }
    }

    loadSessions()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      block: 'end',
    })
  }, [messages, isSending])

  const refreshSessions = async () => {
    const nextSessions = await fetchAssistantSessions()
    setSessions(nextSessions)
  }

  const handleNewChat = () => {
    setSessionId(null)
    setSources([])
    setModelName('')
    setErrorMessage('')
    setMessages([
      {
        id: 'welcome-new',
        sender: 'assistant',
        content: 'Bạn muốn ôn từ vựng, ngữ pháp hay hỏi về một bài học cụ thể?',
      },
    ])
  }

  const handleLoadSession = async (nextSessionId) => {
    setErrorMessage('')

    try {
      const result = await fetchAssistantSessionMessages(nextSessionId)
      setSessionId(result.session.id)
      setMessages(result.messages)
      const lastAssistantMessage = [...result.messages]
        .reverse()
        .find((message) => message.sender === 'assistant')

      setSources(lastAssistantMessage?.metadata?.sources || [])
      setModelName(lastAssistantMessage?.metadata?.model || '')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    const userContent = inputValue.trim()
    const userMessage = {
      id: `local-${Date.now()}`,
      sender: 'user',
      content: userContent,
    }

    setMessages((currentMessages) => [...currentMessages, userMessage])
    setInputValue('')
    setErrorMessage('')
    setIsSending(true)

    try {
      const result = await sendAssistantMessage({
        message: userContent,
        sessionId,
        level: selectedLevel,
      })

      setSessionId(result.session.id)
      setSessions((currentSessions) => {
        const hasSession = currentSessions.some((session) => session.id === result.session.id)

        if (hasSession) {
          return currentSessions.map((session) => (
            session.id === result.session.id ? result.session : session
          ))
        }

        return [result.session, ...currentSessions]
      })
      setMessages((currentMessages) => [...currentMessages, result.message])
      setSources(result.sources || [])
      setModelName(result.model || '')
      await refreshSessions()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="assistant-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="assistant-main" id="main-content" tabIndex={-1}>
        <section className="assistant-shell" aria-label="AI Assistant">
          <aside className="assistant-sidebar">
            <div className="assistant-sidebar__head">
              <div className="assistant-brand">
                <div>
                  <span>HỎI & HIỂU</span>
                  <h1>Trợ lý học tập</h1>
                </div>
              </div>
              <button type="button" onClick={handleNewChat} disabled={isSending}>＋ Chat mới</button>
            </div>

            <div className="assistant-levels" aria-label="Chọn trình độ">
              {JLPT_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  title={`Giải thích theo trình độ ${level}`}
                  aria-pressed={selectedLevel === level}
                  className={selectedLevel === level ? 'is-active' : ''}
                  onClick={() => setSelectedLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>

            <details className="assistant-session-list">
              <summary>Lịch sử trò chuyện ({sessions.length})</summary>
              {isLoadingSessions ? <p>Đang tải...</p> : null}
              {!isLoadingSessions && sessions.length === 0 ? <p>Chưa có phiên chat.</p> : null}
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className={sessionId === session.id ? 'is-active' : ''}
                  disabled={isSending}
                  aria-pressed={sessionId === session.id}
                  onClick={() => handleLoadSession(session.id)}
                >
                  {session.title || 'Phiên chat'}
                </button>
              ))}
            </details>
          </aside>

          <section className="assistant-chat" data-level={selectedLevel}>
            <div className="assistant-chat__head">
              <div>
                <SparkIcon className="assistant-chat__icon" />
                <div>
                  <h2>{currentSessionTitle}</h2>
                  <p title={modelName || undefined}>Giải thích theo trình độ {selectedLevel} · AI có thể nhầm, hãy đối chiếu bài học.</p>
                </div>
              </div>
            </div>

            <div className="assistant-messages" aria-live="polite">
              {messages.map((message) => (
                <AssistantMessage key={message.id} message={message} />
              ))}
              {isSending ? (
                <article className="assistant-message">
                  <div className="assistant-message__avatar">AI</div>
                  <div className="assistant-message__body">
                    <p>Đang phân tích dữ liệu bài học...</p>
                  </div>
                </article>
              ) : null}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            {errorMessage ? (
              <p role="alert" className="assistant-error">{errorMessage}</p>
            ) : null}

            <form className="assistant-compose" onSubmit={handleSubmit}>
              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Hỏi về từ vựng, ngữ pháp hoặc bài học..."
                rows="3"
                aria-label="Câu hỏi cho AI Assistant"
              />
              <button type="submit" disabled={!canSubmit} aria-label="Gửi câu hỏi">
                <SendIcon className="assistant-send-icon" />
              </button>
            </form>
          </section>

          <AssistantSources sources={sources} />
        </section>
      </main>
    </div>
  )
}
