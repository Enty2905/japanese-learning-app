const ABOUT_ITEMS = [
  {
    title: 'Từ ngoại lai',
    description:
      'Katakana chủ yếu dùng để viết các từ mượn từ ngôn ngữ khác, đặc biệt là tiếng Anh.',
  },
  {
    title: 'Từ tượng thanh',
    description:
      'Từ mô phỏng âm thanh trong tiếng Nhật thường được viết bằng katakana.',
  },
  {
    title: 'Tên khoa học',
    description:
      'Tên thực vật, động vật và các thuật ngữ kỹ thuật thường được viết bằng katakana.',
  },
  {
    title: 'Nhấn mạnh',
    description:
      'Katakana có thể dùng để nhấn mạnh, tương tự chữ nghiêng hoặc chữ đậm trong tiếng Anh.',
  },
]

export function KatakanaAboutCard() {
  return (
    <section className="katakana-card katakana-about-card">
      <h2 className="katakana-card-title">Về Katakana</h2>
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
