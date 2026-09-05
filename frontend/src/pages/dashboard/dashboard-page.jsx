import { Link } from 'react-router-dom'
import { DashboardHero } from '../../components/dashboard/dashboard-hero'
import { DashboardLearningActivity } from '../../components/dashboard/dashboard-learning-activity'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { DashboardStatsGrid } from '../../components/dashboard/dashboard-stats-grid'
import { ProtectedLink } from '../../components/auth/protected-link'
import { useDashboardStats } from '../../hooks/use-dashboard-stats'
import { useAuthSession } from '../../hooks/use-auth-session'
import { NAV_ITEMS, STAT_META } from './dashboard-content'
import './dashboard-page.css'

const STUDY_STEPS = [
  { number: '01', glyph: 'あ', title: 'Hiragana', description: '46 âm tiết. Điểm khởi đầu của bạn.', path: '/hiragana', note: 'BẮT ĐẦU TỪ ĐÂY' },
  { number: '02', glyph: 'ア', title: 'Katakana', description: 'Đọc tên riêng và những từ mượn.', path: '/katakana', note: 'MỞ RỘNG NỀN TẢNG' },
  { number: '03', glyph: '学', title: 'Bài học JLPT', description: 'Từ vựng, ngữ pháp và bài kiểm tra.', path: '/lessons/n5', note: 'N5 → N1' },
]
const TOOLS = [
  { glyph: '字', title: 'Luyện viết', description: 'Viết một chữ, nhận phản hồi từ AI.', path: '/handwriting' },
  { glyph: '辞', title: 'Từ điển', description: 'Tra nghĩa, cách đọc và ví dụ.', path: '/dictionary' },
  { glyph: '覚', title: 'Flashcard', description: 'Giữ lại những từ bạn muốn nhớ.', path: '/flashcards' },
  { glyph: '話', title: 'Trợ lý học tập', description: 'Cùng tháo gỡ một câu hỏi khó.', path: '/assistant' },
]

export function DashboardPage() {
  const stats = useDashboardStats()
  const { isAuthenticated } = useAuthSession()
  const statCards = STAT_META.map((item) => ({ ...item, value: stats[item.key] || 0 }))
  return (
    <div className="dashboard-page">
      <DashboardNav navItems={NAV_ITEMS} />
      <main className="dashboard-main" id="main-content" tabIndex={-1}>
        <DashboardHero />
        <section className="study-path" aria-labelledby="study-path-title">
          <div className="section-title-row"><div><span className="ui-eyebrow">Lộ trình của bạn</span><h2 id="study-path-title">Từng bước, vững nền tảng.</h2></div><span className="section-aside">Từ nét chữ đầu tiên đến một cuộc hội thoại.</span></div>
          <div className="study-path-list">
            {STUDY_STEPS.map((step) => (
              <ProtectedLink key={step.path} to={step.path} className="study-path-item">
                <span className="study-path-number">{step.number}</span>
                <span className="study-path-glyph" lang="ja">{step.glyph}</span>
                <span className="study-path-copy"><small>{step.note}</small><strong>{step.title}</strong><span>{step.description}</span></span>
                <span className="study-path-arrow" aria-hidden="true">↗</span>
              </ProtectedLink>
            ))}
          </div>
        </section>
        <section className="study-tools" aria-labelledby="study-tools-title">
          <div className="section-title-row"><div><span className="ui-eyebrow">Góc thực hành</span><h2 id="study-tools-title">Một chút luyện tập mỗi ngày.</h2></div></div>
          <div className="study-tools-grid">{TOOLS.map(tool => (
            <ProtectedLink className="study-tool" key={tool.path} to={tool.path}>
              <span lang="ja" className="study-tool-glyph">{tool.glyph}</span>
              <span><strong>{tool.title}</strong><small>{tool.description}</small></span><span aria-hidden="true">→</span>
            </ProtectedLink>
          ))}</div>
        </section>
        {isAuthenticated ? (
          <><DashboardStatsGrid statCards={statCards} /><DashboardLearningActivity activity={stats.learningActivity} /></>
        ) : (
          <section className="learning-invitation"><div><h2>Lưu lại từng bước tiến.</h2><p>Tạo tài khoản để lưu bài học, bộ thẻ và nhịp học của riêng bạn.</p></div><Link className="ui-button ui-button--secondary" to="/auth/register">Tạo tài khoản</Link></section>
        )}
        <footer className="study-footer"><span><span lang="ja">日々学ぶ</span> · Học một điều mới mỗi ngày.</span><Link to="/culture">Đọc chuyện văn hóa Nhật Bản ↗</Link></footer>
      </main>
    </div>
  )
}
