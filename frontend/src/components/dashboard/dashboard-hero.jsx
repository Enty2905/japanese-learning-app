import { ProtectedLink } from '../auth/protected-link'

export function DashboardHero({ highlights = [] }) {
  return (
    <section className="hero-card">
      <div className="hero-copy">
        <span className="hero-eyebrow">Trang học WEB tiếng Nhật</span>
        <h1>Chào mừng đến với Japanese Learning </h1>
        <p>
          Xây lộ trình vững từ kana, từ vựng và ngữ pháp đến ôn tập hằng ngày
          bằng các công cụ dành cho tự học tập trung.
        </p>

        <div className="hero-actions">
          <ProtectedLink to="/lessons/n5" className="hero-btn hero-btn-primary">
            Bắt đầu học
          </ProtectedLink>
          <ProtectedLink to="/flashcards" className="hero-btn hero-btn-secondary">
            Ôn flashcard
          </ProtectedLink>
        </div>
      </div>

      <div className="hero-visual" aria-label="Điểm nổi bật của trang chủ">
        <div className="hero-kana-stack" aria-hidden="true">
          <span>Kanji</span>
          <span>Từ vựng</span>
          <span>Đọc hiểu</span>
          <span>Nghe</span>
        </div>

        <div className="hero-visual-card">
          <span>Trọng tâm hôm nay</span>
          <strong>15 phút kana + 1 bài học</strong>
          <div className="hero-progress-track">
            <div className="hero-progress-fill" />
          </div>
        </div>

        <div className="hero-highlight-list">
          {highlights.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
