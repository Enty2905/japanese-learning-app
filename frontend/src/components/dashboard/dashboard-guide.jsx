export function DashboardGuide({ steps }) {
  return (
    <section className="guide-card">
      <div className="guide-intro">
        <span>Lộ trình gợi ý</span>
        <h2>Bắt đầu học</h2>
        <p>
          Một lộ trình đơn giản cho người mới: học bảng chữ, học bài theo cấp độ,
          lưu từ mới rồi kết nối ngôn ngữ với bối cảnh văn hóa thực tế.
        </p>
      </div>

      <div className="guide-layout">
        <div className="guide-list">
          {steps.map((step) => (
            <article key={step.id} className="guide-item">
              <div className={`guide-index ${step.tone}`}>{step.id}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>

        <aside className="guide-note" aria-label="Nhắc nhở học tập">
          <span>Nhịp học</span>
          <strong>Học ngắn mỗi ngày hiệu quả hơn học dài nhưng thất thường.</strong>
          <p>
            Dùng bài học để có cấu trúc, flashcard để ghi nhớ và từ điển để ôn lại
            mỗi khi một từ xuất hiện nhiều lần.
          </p>
        </aside>
      </div>
    </section>
  )
}
