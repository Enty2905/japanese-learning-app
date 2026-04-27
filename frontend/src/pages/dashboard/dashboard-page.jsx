import { DashboardFeatureGrid } from '../../components/dashboard/dashboard-feature-grid'
import { DashboardGuide } from '../../components/dashboard/dashboard-guide'
import { DashboardHero } from '../../components/dashboard/dashboard-hero'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { DashboardStatsGrid } from '../../components/dashboard/dashboard-stats-grid'
import { useDashboardStats } from '../../hooks/use-dashboard-stats'
import {
  FEATURE_GROUPS,
  FEATURES,
  GUIDE_STEPS,
  HERO_HIGHLIGHTS,
  NAV_ITEMS,
  OVERVIEW_CARDS,
  STAT_META,
} from './dashboard-content'
import './dashboard-page.css'

export function DashboardPage() {
  const stats = useDashboardStats()

  const statCards = STAT_META.map((item) => ({
    ...item,
    value: stats[item.key] || 0,
  }))

  return (
    <div className="dashboard-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="dashboard-main">
        <DashboardHero highlights={HERO_HIGHLIGHTS} />
        <DashboardStatsGrid statCards={statCards} />
        <section className="dashboard-overview" aria-labelledby="dashboard-overview-title">
          <div className="dashboard-section-heading">
            <span>Website này giúp bạn học gì</span>
            <h2 id="dashboard-overview-title">Một không gian học tiếng Nhật đầy đủ</h2>
            <p>
              Trang chủ gom luyện viết, bài học, công cụ từ vựng, flashcard và
              gợi ý học tập vào cùng một nơi để bạn luôn biết nên học gì tiếp theo.
            </p>
          </div>

          <div className="overview-grid">
            {OVERVIEW_CARDS.map((card) => (
              <article key={card.title} className={`overview-card ${card.accent}`}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <DashboardFeatureGrid features={FEATURES} groups={FEATURE_GROUPS} />
        <DashboardGuide steps={GUIDE_STEPS} />
      </main>
    </div>
  )
}
