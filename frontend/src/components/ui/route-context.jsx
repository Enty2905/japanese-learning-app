import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES = { hiragana: 'Hiragana', katakana: 'Katakana', lessons: 'Bài học', dictionary: 'Từ điển', directory: 'Từ điển', flashcards: 'Flashcard', handwriting: 'Luyện viết', culture: 'Văn hóa Nhật Bản', assistant: 'Trợ lý học tập', profile: 'Hồ sơ', admin: 'Quản trị', auth: 'Tài khoản' }

export function RouteContext() {
  const location = useLocation()
  const title = TITLES[location.pathname.split('/')[1]] || 'Sổ học tiếng Nhật'
  useEffect(() => { document.title = `${title} · Japanese Learning` }, [title])
  return <span className="sr-only" role="status" aria-live="polite">{title}</span>
}
