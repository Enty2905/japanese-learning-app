const STUDY_TIPS = [
  {
    title: 'Luyện viết',
    description:
      'Viết mỗi chữ nhiều lần để ghi nhớ đúng thứ tự nét và hình dáng chữ.',
  },
  {
    title: 'Tạo flashcard',
    description:
      'Tạo flashcard giấy hoặc số để tự kiểm tra khả năng nhớ mặt chữ và cách đọc.',
  },
  {
    title: 'Đọc từ đơn giản',
    description:
      'Khi đã học được vài chữ, hãy bắt đầu đọc các từ tiếng Nhật đơn giản để củng cố kiến thức.',
  },
  {
    title: 'Luyện mỗi ngày',
    description:
      'Luyện đều mỗi ngày, chỉ 10-15 phút, hiệu quả hơn các buổi học dài nhưng thưa.',
  },
]

export function HiraganaStudyTips() {
  return (
    <section className="hiragana-card hiragana-study-tips">
      <h2 className="hiragana-card-title">Mẹo học</h2>
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
