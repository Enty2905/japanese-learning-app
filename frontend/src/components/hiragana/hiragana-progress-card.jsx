export function HiraganaProgressCard({ masteredCount, totalCount, progressPercent }) {
  return (
    <section className="hiragana-progress-card">
      <h1>Hiragana Study (ひらがな)</h1>
      <p>Master the 46 characters of the basic Japanese syllabary</p>
      <div className="hiragana-progress-meta">
        Progress: {masteredCount} / {totalCount} mastered
      </div>
      <div className="hiragana-progress-track" aria-hidden="true">
        <div className="hiragana-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
    </section>
  )
}
