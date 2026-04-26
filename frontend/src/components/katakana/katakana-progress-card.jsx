export function KatakanaProgressCard({ masteredCount, totalCount, progressPercent }) {
  return (
    <section className="katakana-progress-card">
      <h1>Katakana Study (カタカナ)</h1>
      <p>Master the 46 characters used for foreign words and emphasis</p>
      <div className="katakana-progress-meta">
        Progress: {masteredCount} / {totalCount} mastered
      </div>
      <div className="katakana-progress-track" aria-hidden="true">
        <div className="katakana-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
    </section>
  )
}
