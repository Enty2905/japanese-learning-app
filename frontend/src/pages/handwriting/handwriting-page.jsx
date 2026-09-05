import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import {
  fetchHandwritingHealth,
  predictHandwriting,
} from '../../services/handwriting.service'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './handwriting-page.css'

const CANVAS_SIZE = 420

function BrushIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16.8 3.7 20.3 7.2 9.5 18H6v-3.5L16.8 3.7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M5 19c-1.2.5-2 .6-2 .6s.1-.8.6-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function UploadIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 16v2.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function percent(value) {
  const confidence = Number(value)

  if (!Number.isFinite(confidence)) {
    return '0%'
  }

  return `${Math.round(Math.max(0, Math.min(1, confidence)) * 100)}%`
}

function hasRecognizedText(result) {
  return typeof result?.text === 'string' && result.text.trim().length > 0
}

function TextResult({ result }) {
  if (!hasRecognizedText(result)) {
    return null
  }

  return (
    <div className="handwriting-text-result">
      <span>Văn bản</span>
      <p>{result.text}</p>
      <dl>
        <div>
          <dt>Số ký tự</dt>
          <dd>{result.character_count || 0}</dd>
        </div>
        <div>
          <dt>Tin cậy TB</dt>
          <dd>{percent(result.average_confidence)}</dd>
        </div>
      </dl>
    </div>
  )
}

function NoRecognitionResult() {
  return (
    <div className="handwriting-no-result">
      <BrushIcon />
      <strong>Chưa nhận diện được chữ viết.</strong>
      <p>Hãy viết rõ hơn, tăng khoảng cách giữa các ký tự hoặc tải ảnh có nền sáng hơn.</p>
    </div>
  )
}

export function HandwritingPage() {
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const isDrawingRef = useRef(false)
  const [health, setHealth] = useState(null)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPredicting, setIsPredicting] = useState(false)
  const [hasInk, setHasInk] = useState(false)

  const isAiReady = useMemo(() => {
    return Boolean(health?.connected && (health.model_loaded || health.modelLoaded))
  }, [health])

  const statusLabel = useMemo(() => {
    if (!health) {
      return 'Đang kiểm tra'
    }

    if (isAiReady) {
      return 'AI sẵn sàng'
    }

    return 'AI chưa bật'
  }, [health, isAiReady])

  const canvasPoint = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) {
      return
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 18
    context.strokeStyle = '#0f172a'
    setHasInk(false)
    setResult(null)
    setErrorMessage('')
  }, [])

  useEffect(() => {
    clearCanvas()
  }, [clearCanvas])

  useEffect(() => {
    let isMounted = true

    async function loadHealth() {
      try {
        const nextHealth = await fetchHandwritingHealth()

        if (isMounted) {
          setHealth(nextHealth)
        }
      } catch (error) {
        if (isMounted) {
          setHealth({
            connected: false,
            message: error.message,
          })
        }
      }
    }

    loadHealth()

    return () => {
      isMounted = false
    }
  }, [])

  const handlePointerDown = (event) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) {
      return
    }

    event.preventDefault()
    canvas.setPointerCapture(event.pointerId)
    isDrawingRef.current = true
    const point = canvasPoint(event)
    context.beginPath()
    context.moveTo(point.x, point.y)
  }

  const handlePointerMove = (event) => {
    if (!isDrawingRef.current) {
      return
    }

    const context = canvasRef.current?.getContext('2d')
    if (!context) {
      return
    }

    event.preventDefault()
    const point = canvasPoint(event)
    context.lineTo(point.x, point.y)
    context.stroke()
    setHasInk(true)
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
  }

  const handleUpload = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')

        if (!canvas || !context) {
          return
        }

        clearCanvas()
        const scale = Math.min(canvas.width / image.width, canvas.height / image.height)
        const width = image.width * scale
        const height = image.height * scale
        const x = (canvas.width - width) / 2
        const y = (canvas.height - height) / 2
        context.drawImage(image, x, y, width, height)
        setHasInk(true)
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handlePredict = async () => {
    if (!hasInk || isPredicting) {
      return
    }

    setIsPredicting(true)
    setErrorMessage('')
    setResult(null)

    try {
      const prediction = await predictHandwriting({
        imageDataUrl: canvasRef.current.toDataURL('image/png'),
      })
      setResult(prediction)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsPredicting(false)
    }
  }

  return (
    <div className="handwriting-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="handwriting-main" id="main-content" tabIndex={-1}>
        <section className="handwriting-shell" aria-label="Luyện viết AI">
          <div className="handwriting-workspace">
            <header className="handwriting-head">
              <div>
                <span>Japanese Handwriting AI</span>
                <h1>Luyện viết AI</h1>
              </div>
              <div className={`handwriting-status${isAiReady ? ' is-online' : ''}`}>
                <i />
                {statusLabel}
              </div>
            </header>

            <div className="handwriting-board">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                aria-label="Bảng viết tay"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onPointerLeave={stopDrawing}
              />
            </div>

            <div className="handwriting-toolbar" aria-label="Công cụ luyện viết">
              <button type="button" className="handwriting-tool-button" onClick={clearCanvas}>
                Xóa bảng
              </button>
              <button
                type="button"
                className="handwriting-tool-button"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon />
                Tải ảnh
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUpload}
                hidden
              />
              <button
                type="button"
                className="handwriting-primary-button"
                disabled={!hasInk || isPredicting}
                onClick={handlePredict}
              >
                <BrushIcon />
                {isPredicting ? 'Đang nhận diện' : 'Nhận diện'}
              </button>
            </div>
          </div>

          <aside className="handwriting-panel">
            <section className="handwriting-result" aria-live="polite" aria-atomic="true">
              <h2>Kết quả</h2>
              {errorMessage ? <p role="alert" className="handwriting-error">{errorMessage}</p> : null}
              {!errorMessage && !result ? (
                <div className="handwriting-empty">
                  <BrushIcon />
                  <p>Chưa có kết quả nhận diện.</p>
                </div>
              ) : null}
              {!errorMessage && result && !hasRecognizedText(result) ? (
                <NoRecognitionResult />
              ) : null}
              <TextResult result={result} />
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}
