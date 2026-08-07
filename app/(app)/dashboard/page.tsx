"use client"

import { useEffect } from "react"
import { CoachBriefing } from "@/features/dashboard/components/CoachBriefing"
import { StreakWidget } from "@/features/dashboard/components/StreakWidget"
import { TrainingWidget } from "@/features/dashboard/components/TrainingWidget"
import { NutritionWidget } from "@/features/dashboard/components/NutritionWidget"
import { RecoveryWidget } from "@/features/dashboard/components/RecoveryWidget"
import { HabitsWidget } from "@/features/dashboard/components/HabitsWidget"
import { GoalsWidget } from "@/features/dashboard/components/GoalsWidget"
import { InsightsWidget } from "@/features/dashboard/components/InsightsWidget"
import { PerformanceScoreWidget } from "@/features/performance/components/PerformanceScoreWidget"
import { useGoalsStore } from "@/features/goals/store/goals.store"
import { useBodyStore } from "@/features/body/store/body.store"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { useAuthStore } from "@/lib/store/auth.store"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: history } = useWorkoutHistory(user?.uid ?? "")
  const { weightLogs, measurements, habitLogs, recoveryScores, readinessLogs, habits } = useBodyStore()
  const { goals, syncLiveData } = useGoalsStore()

  // Auto-sync goals with live workout and body data on mount
  useEffect(() => {
    syncLiveData(history, weightLogs, measurements, habitLogs)
  }, [history, weightLogs, measurements, habitLogs, syncLiveData])

  return (
    <div className="page-container space-y-6">
      {/* AI Coach Daily Briefing */}
      <CoachBriefing />

      {/* Top Grid: Performance Score & Progress Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <PerformanceScoreWidget
            sessions={history}
            goals={goals}
            recoveryScores={recoveryScores}
            readinessLogs={readinessLogs}
            habits={habits}
            habitLogs={habitLogs}
          />
        </div>
        <div className="lg:col-span-8">
          <InsightsWidget />
        </div>
      </div>

      {/* Grid Dashboard Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <TrainingWidget />
        <StreakWidget />
        <GoalsWidget />
        <NutritionWidget />
        <RecoveryWidget />
        <HabitsWidget />
      </div>
    </div>
  )
}
