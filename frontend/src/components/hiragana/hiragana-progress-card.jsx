export function HiraganaProgressCard({ masteredCount, totalCount, progressPercent }) {
  return (
    <section className="hiragana-progress-card">
      <h1>Học Hiragana (ひらがな)</h1>
      <p>Nắm chắc 46 chữ cái trong bảng âm tiết cơ bản của tiếng Nhật</p>
      <div className="hiragana-progress-meta">
        Tiến độ: {masteredCount} / {totalCount} đã thuộc
      </div>
      <div className="hiragana-progress-track" aria-hidden="true">
        <div className="hiragana-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
    </section>
  )
}
