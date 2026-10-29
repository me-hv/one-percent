/**
 * Weekly Coaching Review Service
 *
 * Synthesizes completed workouts, volume trajectory, recovery trends,
 * and nutrition consistency into an objective, data-grounded weekly audit.
 */

import type { WeeklyCoachingReview } from "../types/coach.types"
import type { WorkoutSession, TrainingProgram } from "@/lib/types/training.types"
import type { DailyRecoveryEntry } from "@/lib/types/recovery.types"
import type { DailyNutritionLog, NutritionTargets } from "@/lib/types/nutrition.types"
import { formatDateKey, subDays } from "@/lib/utils/date"
import { calculateReadinessScore } from "@/features/recovery/services/readiness.service"
import { DEFAULT_RECOVERY_CONFIG } from "@/features/recovery/repository/recovery.repository"

export interface GenerateWeeklyReviewParams {
  userId: string
  sessions: WorkoutSession[]
  activeProgram?: TrainingProgram | null
  recoveryEntries: DailyRecoveryEntry[]
  nutritionLogs: DailyNutritionLog[]
  nutritionTargets?: NutritionTargets | null
  startDate?: Date
  endDate?: Date
}

export function generateWeeklyReview(params: GenerateWeeklyReviewParams): WeeklyCoachingReview {
  const end = params.endDate || new Date()
  const start = params.startDate || subDays(end, 6)
  const startTs = start.getTime()
  const endTs = end.getTime()

  const startStr = formatDateKey(start)
  const endStr = formatDateKey(end)

  // 1. Workouts in window
  const weekSessions = params.sessions.filter((s) => {
    if (s.status !== "completed") return false
    const t = s.completedAt?.toDate?.() ? s.completedAt.toDate().getTime() : 0
    return t >= startTs && t <= endTs
  })

  // Prior week sessions for volume comparison
  const priorStartTs = subDays(start, 7).getTime()
  const priorWeekSessions = params.sessions.filter((s) => {
    if (s.status !== "completed") return false
    const t = s.completedAt?.toDate?.() ? s.completedAt.toDate().getTime() : 0
    return t >= priorStartTs && t < startTs
  })

  const completedSessions = weekSessions.length
  const plannedSessions = params.activeProgram?.daysPerWeek || 4
  const adherenceRatePct = Math.min(100, Math.round((completedSessions / plannedSessions) * 100))

  const getSessionVolume = (s: WorkoutSession) => {
    if (s.totalVolume && s.totalVolume > 0) return s.totalVolume
    return (s.exercises || []).reduce((acc, ex) => {
      return (
        acc +
        (ex.sets || []).reduce((stAcc, st) => {
          if (!st.completed) return stAcc
          return stAcc + (st.weight || 0) * (st.reps || 0)
        }, 0)
      )
    }, 0)
  }

  const totalVolumeKg = Math.round(weekSessions.reduce((acc, s) => acc + getSessionVolume(s), 0))
  const priorVolumeKg = Math.round(priorWeekSessions.reduce((acc, s) => acc + getSessionVolume(s), 0))
  const volumeChangePct =
    priorVolumeKg > 0 ? Math.round(((totalVolumeKg - priorVolumeKg) / priorVolumeKg) * 100) : 0

  // 2. Achievements
  const topAchievements: string[] = []
  const prCount = weekSessions.reduce((acc, s) => acc + (s.prsAchieved?.length || 0), 0)
  if (prCount > 0) {
    topAchievements.push(`Set ${prCount} new Personal Record${prCount > 1 ? "s" : ""}`)
  }
  if (completedSessions >= plannedSessions) {
    topAchievements.push(`100% Training adherence (${completedSessions}/${plannedSessions} planned sessions)`)
  }
  if (totalVolumeKg > 15000) {
    topAchievements.push(`High training volume: ${(totalVolumeKg / 1000).toFixed(1)} metric tons moved`)
  }
  if (topAchievements.length === 0) {
    topAchievements.push(`Consistent effort: ${completedSessions} quality sessions logged`)
  }

  // 3. Recovery metrics
  const weekRecovery = params.recoveryEntries.filter((r) => {
    const d = new Date(r.date).getTime()
    return d >= startTs && d <= endTs
  })

  const averageReadiness =
    weekRecovery.length > 0
      ? Math.round(
          weekRecovery.reduce((acc, r) => {
            const res = calculateReadinessScore(r, DEFAULT_RECOVERY_CONFIG)
            return acc + (res.score ?? 80)
          }, 0) / weekRecovery.length
        )
      : 80

  const averageSleepHours =
    weekRecovery.length > 0
      ? Math.round(
          (weekRecovery.reduce(
            (acc, r) => acc + (r.sleepDurationMinutes ? r.sleepDurationMinutes / 60 : 0),
            0
          ) /
            weekRecovery.length) *
            10
        ) / 10
      : 7.5

  const sorenessCounts: Record<string, number> = {}
  weekRecovery.forEach((r) => {
    Object.entries(r.muscleSoreness || {}).forEach(([muscle, val]) => {
      if (typeof val === "number" && val >= 3) {
        sorenessCounts[muscle] = (sorenessCounts[muscle] || 0) + 1
      }
    })
  })
  const sorenessHotspots = Object.keys(sorenessCounts).slice(0, 3)

  // 4. Nutrition metrics
  const weekNutrition = params.nutritionLogs.filter((n) => {
    const d = new Date(n.date).getTime()
    return d >= startTs && d <= endTs
  })

  const targetCal = params.nutritionTargets?.calories || 2500
  const targetProt = params.nutritionTargets?.protein || 180

  let calorieAdherencePct = 85
  let proteinAdherencePct = 85
  let averageWaterLiters = 3.0

  if (weekNutrition.length > 0) {
    const onTargetCalDays = weekNutrition.filter(
      (n) => Math.abs((n.totalCalories || 0) - targetCal) <= targetCal * 0.15
    ).length
    calorieAdherencePct = Math.round((onTargetCalDays / weekNutrition.length) * 100)

    const avgProt =
      weekNutrition.reduce((acc, n) => acc + (n.totalProtein || 0), 0) / weekNutrition.length
    proteinAdherencePct = Math.min(100, Math.round((avgProt / targetProt) * 100))

    const avgWater =
      weekNutrition.reduce((acc, n) => acc + (n.waterMl || 0), 0) / weekNutrition.length
    averageWaterLiters = Math.round((avgWater / 1000) * 10) / 10
  }

  // 5. Key Insights & Next Week Focus
  const keyInsights: string[] = []
  if (volumeChangePct > 15) {
    keyInsights.push(`Workload expanded by +${volumeChangePct}% over previous week. Monitor joint fatigue.`)
  } else if (volumeChangePct < -15) {
    keyInsights.push(`Total volume decreased by ${Math.abs(volumeChangePct)}% — effectively acted as a recovery/deload week.`)
  } else {
    keyInsights.push(`Training workload stayed steady within optimal progressive overload limits (${volumeChangePct >= 0 ? "+" : ""}${volumeChangePct}%).`)
  }

  if (averageReadiness >= 75) {
    keyInsights.push(`Readiness averaged ${averageReadiness}% (Green Zone). Neural recovery remained high.`)
  } else {
    keyInsights.push(`Readiness averaged ${averageReadiness}%. Prioritize earlier sleep timing to accelerate recovery.`)
  }

  const focusAreasNextWeek: string[] = [
    `Maintain scheduled training cadence (${plannedSessions} sessions).`,
    averageSleepHours < 7.0
      ? "Target 7.5+ hours of sleep on heavy training nights."
      : "Execute double progression on main compound movements.",
    proteinAdherencePct < 85
      ? `Elevate daily protein consistency closer to ${targetProt}g target.`
      : "Maintain current nutritional pacing to support training adaptation.",
  ]

  return {
    id: `rev-${startStr}-${endStr}`,
    userId: params.userId,
    weekStartDate: startStr,
    weekEndDate: endStr,
    completedSessions,
    plannedSessions,
    adherenceRatePct,
    totalVolumeKg,
    volumeChangePct,
    topAchievements,
    recoverySummary: {
      averageReadiness,
      averageSleepHours,
      sorenessHotspots,
    },
    nutritionSummary: {
      calorieAdherencePct,
      proteinAdherencePct,
      averageWaterLiters,
    },
    keyInsights,
    focusAreasNextWeek,
    status: "draft",
    createdAt: new Date().toISOString(),
  }
}
