import { DashboardFeatureGrid } from '../../components/dashboard/dashboard-feature-grid'
import { DashboardGuide } from '../../components/dashboard/dashboard-guide'
import { DashboardHero } from '../../components/dashboard/dashboard-hero'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { DashboardStatsGrid } from '../../components/dashboard/dashboard-stats-grid'
import { useDashboardStats } from '../../hooks/use-dashboard-stats'
import { FEATURES, GUIDE_STEPS, NAV_ITEMS, STAT_META } from './dashboard-content'
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
        <DashboardHero />
        <DashboardStatsGrid statCards={statCards} />
        <DashboardFeatureGrid features={FEATURES} />
        <DashboardGuide steps={GUIDE_STEPS} />
      </main>
    </div>
  )
}
