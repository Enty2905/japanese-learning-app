import { Link } from 'react-router-dom'

export function DashboardHero() {
  return (
    <section className="hero-card">
      <h1>Welcome to Learn Japanese</h1>
      <p>Master Japanese language and culture at your own pace</p>

      <div className="hero-actions">
        <Link to="/lessons/n5" className="hero-btn hero-btn-primary">
          Start Learning
        </Link>
        <Link to="/assistant" className="hero-btn hero-btn-secondary">
          Chat with AI Assistant
        </Link>
      </div>
    </section>
  )
}
