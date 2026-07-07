import { CoachBriefing } from "@/features/dashboard/components/CoachBriefing"
import { StreakWidget } from "@/features/dashboard/components/StreakWidget"
import { TrainingWidget } from "@/features/dashboard/components/TrainingWidget"
import { NutritionWidget } from "@/features/dashboard/components/NutritionWidget"
import { RecoveryWidget } from "@/features/dashboard/components/RecoveryWidget"
import { HabitsWidget } from "@/features/dashboard/components/HabitsWidget"
import { GoalsWidget } from "@/features/dashboard/components/GoalsWidget"

export const metadata = {
  title: "Dashboard",
  description: "One Percent Fitness Operating System Dashboard",
}

export default function DashboardPage() {
  return (
    <div className="page-container space-y-6">
      {/* ─── AI Coach Daily Briefing (Top Row) ───────────────────────── */}
      <CoachBriefing />

      {/* ─── Grid Dashboard Layout ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Weekly Training Widget */}
        <TrainingWidget />

        {/* Streak Consistency Widget */}
        <StreakWidget />

        {/* Active Target Goal Widget */}
        <GoalsWidget />

        {/* Daily Nutrition Widget */}
        <NutritionWidget />

        {/* Sleep & Recovery Widget */}
        <RecoveryWidget />

        {/* Daily Habits Checklists */}
        <HabitsWidget />
      </div>
    </div>
  )
}
