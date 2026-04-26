export function DashboardGuide({ steps }) {
  return (
    <section className="guide-card">
      <h2>Getting Started</h2>

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
    </section>
  )
}
