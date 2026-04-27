export function KatakanaProgressCard({ masteredCount, totalCount, progressPercent }) {
  return (
    <section className="katakana-progress-card">
      <h1>Học Katakana (カタカナ)</h1>
      <p>Nắm chắc 46 chữ dùng cho từ ngoại lai và nhấn mạnh</p>
      <div className="katakana-progress-meta">
        Tiến độ: {masteredCount} / {totalCount} đã thuộc
      </div>
      <div className="katakana-progress-track" aria-hidden="true">
        <div className="katakana-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
    </section>
  )
}
