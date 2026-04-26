const ABOUT_ITEMS = [
  {
    title: 'Foreign Words',
    description:
      'Katakana is primarily used to write words borrowed from other languages, especially English.',
  },
  {
    title: 'Onomatopoeia',
    description:
      'Japanese sound effects and animal sounds are often written in katakana.',
  },
  {
    title: 'Scientific Names',
    description:
      'Plant and animal names, as well as technical terms, are frequently written in katakana.',
  },
  {
    title: 'Emphasis',
    description:
      'Katakana can be used for emphasis, similar to how italics or bold text is used in English.',
  },
]

export function KatakanaAboutCard() {
  return (
    <section className="katakana-card katakana-about-card">
      <h2 className="katakana-card-title">About Katakana</h2>
      <div className="katakana-about-grid">
        {ABOUT_ITEMS.map((item) => (
          <article key={item.title} className="katakana-about-item">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
