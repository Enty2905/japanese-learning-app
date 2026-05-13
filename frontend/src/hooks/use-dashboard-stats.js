import { useEffect, useState } from 'react'
import {
  fetchLearningActivity,
  fetchProgressOverview,
} from '../services/progress.service'
import { useAuthSession } from './use-auth-session'

const DEFAULT_ACTIVITY = Object.freeze({
  completedThisWeek: 0,
  activeDays: 0,
  recentActivities: [],
  levelProgress: [],
})

const DEFAULT_STATS = Object.freeze({
  lessonsCompleted: 0,
  wordsUnlocked: 0,
  flashcardsCreated: 0,
  studyStreak: 0,
  learningActivity: DEFAULT_ACTIVITY,
})

function createDefaultStats() {
  return {
    lessonsCompleted: DEFAULT_STATS.lessonsCompleted,
    wordsUnlocked: DEFAULT_STATS.wordsUnlocked,
    flashcardsCreated: DEFAULT_STATS.flashcardsCreated,
    studyStreak: DEFAULT_STATS.studyStreak,
    learningActivity: {
      completedThisWeek: DEFAULT_ACTIVITY.completedThisWeek,
      activeDays: DEFAULT_ACTIVITY.activeDays,
      recentActivities: [],
      levelProgress: [],
    },
  }
}

function normalizeLearningActivity(activity, overview) {
  return {
    completedThisWeek:
      activity?.completedThisWeek ?? overview?.lessons?.completedThisWeek ?? 0,
    activeDays: activity?.activeDays ?? overview?.activity?.activeDays ?? 0,
    recentActivities: Array.isArray(activity?.recentActivities)
      ? activity.recentActivities
      : [],
    levelProgress: Array.isArray(activity?.levelProgress)
      ? activity.levelProgress
      : Array.isArray(overview?.levelProgress)
        ? overview.levelProgress
        : [],
  }
}

function mapProgressOverviewToStats(overview, activity) {
  const learningActivity = normalizeLearningActivity(activity, overview)

  return {
    lessonsCompleted: overview?.lessons?.completed || 0,
    wordsUnlocked: overview?.vocabulary?.tracked || 0,
    flashcardsCreated: 0,
    studyStreak: activity?.studyStreak ?? overview?.activity?.studyStreak ?? 0,
    learningActivity,
  }
}

export function useDashboardStats() {
  const { isAuthenticated } = useAuthSession()
  const [stats, setStats] = useState(createDefaultStats)

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    let isMounted = true

    async function loadProgressStats() {
      try {
        const [overview, activity] = await Promise.all([
          fetchProgressOverview(),
          fetchLearningActivity(),
        ])

        if (!isMounted) {
          return
        }

        setStats(mapProgressOverviewToStats(overview, activity))
      } catch {
        if (isMounted) {
          setStats(createDefaultStats())
        }
      }
    }

    loadProgressStats()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  return isAuthenticated ? stats : DEFAULT_STATS
}
