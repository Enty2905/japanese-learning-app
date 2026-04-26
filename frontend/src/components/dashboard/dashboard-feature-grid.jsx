import { Link } from 'react-router-dom'

export function DashboardFeatureGrid({ features }) {
  return (
    <section className="feature-section">
      <h2>Explore Learning Paths</h2>
      <div className="feature-grid">
        {features.map((feature) => (
          <Link key={feature.title} to={feature.path} className="feature-card">
            <div className={`feature-icon ${feature.tone}`}>{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
