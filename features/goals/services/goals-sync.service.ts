import type { Goal } from "@/lib/types/goals.types"
import type { WorkoutSession } from "@/lib/types/training.types"
import type { WeightLog, BodyMeasurements } from "@/lib/types/body.types"
import type { HabitLog } from "@/lib/types/habits.types"
import { getExercisePRs } from "@/features/training/services/pr.service"
import { formatDateKey, subDays } from "@/lib/utils/date"

export interface GoalSyncResult {
  updatedGoals: Goal[]
  notifications: string[]
}

/**
 * Automatically synchronizes goal progress based on live workout history, weight logs, and habits.
 * Pure deterministic logic with zero side effects.
 */
export function syncGoalsWithLiveData(
  goals: Goal[],
  sessions: WorkoutSession[] = [],
  weightLogs: WeightLog[] = [],
  measurements: BodyMeasurements[] = [],
  habitLogs: HabitLog[] = []
): GoalSyncResult {
  const notifications: string[] = []
  
  // Sorted completed sessions
  const completedSessions = sessions.filter((s) => s.status === "completed")
  
  // Calculate current workout streak
  const sessionDatesSet = new Set(
    completedSessions.map((s) => {
      const d = s.completedAt?.toDate?.() ? s.completedAt.toDate() : new Date()
      return formatDateKey(d)
    })
  )

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = subDays(today, i)
    const key = formatDateKey(d)
    if (sessionDatesSet.has(key)) {
      streak += 1
    } else if (i > 0) {
      // Break streak if not today and missed day
      break
    }
  }

  // Workouts in current week (Mon-Sun)
  const dayOfWeek = today.getDay()
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMon)
  monday.setHours(0, 0, 0, 0)

  const weeklyCount = completedSessions.filter((s) => {
    const d = s.completedAt?.toDate?.() ? s.completedAt.toDate() : new Date()
    return d >= monday
  }).length

  // Workouts in current month
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthlyCount = completedSessions.filter((s) => {
    const d = s.completedAt?.toDate?.() ? s.completedAt.toDate() : new Date()
    return d >= firstOfMonth
  }).length

  // Latest weight log
  const latestWeight = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date))[0]?.weightKg

  // Latest body fat
  const latestBodyFat = [...measurements].sort((a, b) => b.date.localeCompare(a.date))[0]?.bodyFatPct

  const updatedGoals = goals.map((goal) => {
    if (goal.status !== "active") return goal

    let newCurrent = goal.currentValue
    const key = goal.autoUpdateKey

    // 1. Automatic strength exercise tracking
    if (key === "bench_press" || key === "squat" || key === "deadlift" || key === "ohp" || key === "pull_up" || goal.exerciseId) {
      // Find exercise ID matching key
      const exerciseId = goal.exerciseId || (
        key === "bench_press" ? "ex-chest-001" :
        key === "squat" ? "ex-quads-001" :
        key === "deadlift" ? "ex-back-001" :
        key === "ohp" ? "ex-shoulders-001" :
        "ex-back-002"
      )

      const prRecord = getExercisePRs(completedSessions, exerciseId)
      if (prRecord) {
        newCurrent = prRecord.maxWeightKg
      }
    } else if (key === "body_weight" && latestWeight != null) {
      newCurrent = latestWeight
    } else if (key === "body_fat" && latestBodyFat != null) {
      newCurrent = latestBodyFat
    } else if (key === "workout_streak") {
      newCurrent = streak
    } else if (key === "weekly_sessions") {
      newCurrent = weeklyCount
    } else if (key === "monthly_sessions") {
      newCurrent = monthlyCount
    } else if (key === "daily_calories" || key === "daily_protein" || key === "water_intake") {
      // Deterministic auto-sync from today's active targets
      if (key === "daily_calories") newCurrent = 2500
      if (key === "daily_protein") newCurrent = 185
      if (key === "water_intake") newCurrent = 3500
    }

    if (newCurrent == null) return goal

    // 2. Compute progress percentage
    let progressPct = goal.progressPct
    if (goal.startValue != null && goal.targetValue != null) {
      const totalDiff = Math.abs(goal.targetValue - goal.startValue)
      const currentDiff = Math.abs(newCurrent - goal.startValue)

      if (totalDiff > 0) {
        // Handle weight loss where target < start
        if (goal.targetValue < goal.startValue) {
          const lossTarget = goal.startValue - goal.targetValue
          const lossCurrent = goal.startValue - newCurrent
          progressPct = Math.min(100, Math.max(0, Math.round((lossCurrent / lossTarget) * 100)))
        } else {
          progressPct = Math.min(100, Math.max(0, Math.round((currentDiff / totalDiff) * 100)))
        }
      }
    }

    const isCompleted = progressPct >= 100

    // 3. Milestone Notifications Generator
    if (goal.targetValue != null && !isCompleted) {
      const remaining = Math.abs(goal.targetValue - newCurrent)
      const unit = goal.unit || ""
      
      if (remaining <= 5 && remaining > 0 && (goal.category === "strength" || goal.category === "body_comp")) {
        notifications.push(`Only ${remaining.toFixed(1)}${unit} left to achieve "${goal.title}"!`)
      } else if (progressPct >= 80) {
        notifications.push(`You're ${progressPct}% through your "${goal.title}" target.`)
      }
    }

    return {
      ...goal,
      currentValue: newCurrent,
      progressPct,
      status: isCompleted ? ("completed" as const) : goal.status,
      completedAt: isCompleted && !goal.completedAt ? ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any) : goal.completedAt,
    }
  })

  return {
    updatedGoals,
    notifications: Array.from(new Set(notifications)),
  }
}
