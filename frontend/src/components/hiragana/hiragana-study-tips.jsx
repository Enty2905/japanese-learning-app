const STUDY_TIPS = [
  {
    title: 'Practice Writing',
    description:
      'Write each character multiple times to memorize the proper stroke order and shape.',
  },
  {
    title: 'Create Flashcards',
    description:
      'Make physical or digital flashcards to test your recall of characters and their readings.',
  },
  {
    title: 'Read Simple Words',
    description:
      'Once you learn a few characters, start reading simple Japanese words to reinforce your knowledge.',
  },
  {
    title: 'Daily Practice',
    description:
      'Consistent daily practice, even for just 10-15 minutes, is more effective than long, infrequent sessions.',
  },
]

export function HiraganaStudyTips() {
  return (
    <section className="hiragana-card hiragana-study-tips">
      <h2 className="hiragana-card-title">Study Tips</h2>
      <div className="hiragana-study-tips-grid">
        {STUDY_TIPS.map((tip) => (
          <article key={tip.title} className="hiragana-tip-item">
            <h3>{tip.title}</h3>
            <p>{tip.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
