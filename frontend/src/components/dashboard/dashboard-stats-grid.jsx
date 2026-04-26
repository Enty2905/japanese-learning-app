export function DashboardStatsGrid({ statCards }) {
  return (
    <section className="stats-grid" aria-label="Study statistics">
      {statCards.map((item) => (
        <article key={item.key} className="stat-card">
          <div className="stat-card-top">
            <span className={`stat-icon ${item.tone}`}>{item.icon}</span>
            <span className="stat-value">{item.value}</span>
          </div>
          <p>{item.label}</p>
        </article>
      ))}
    </section>
  )
}
