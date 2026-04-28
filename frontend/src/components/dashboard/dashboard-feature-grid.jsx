import { ProtectedLink } from '../auth/protected-link'

export function DashboardFeatureGrid({ features, groups }) {
  return (
    <section className="feature-section" aria-labelledby="feature-section-title">
      <div className="feature-section-head">
        <span>Khám phá ứng dụng</span>
        <h2 id="feature-section-title">Chọn đúng công cụ cho buổi học của bạn</h2>
      </div>

      <div className="feature-groups">
        {groups.map((group) => (
          <article key={group.key} className="feature-group">
            <div className="feature-group-head">
              <h3>{group.title}</h3>
              <p>{group.description}</p>
            </div>

            <div className="feature-grid">
              {features
                .filter((feature) => feature.category === group.key)
                .map((feature) => (
                  <ProtectedLink key={feature.title} to={feature.path} className="feature-card">
                    <div className={`feature-icon ${feature.tone}`}>{feature.icon}</div>
                    <div>
                      <h4>{feature.title}</h4>
                      <p>{feature.description}</p>
                    </div>
                  </ProtectedLink>
                ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
