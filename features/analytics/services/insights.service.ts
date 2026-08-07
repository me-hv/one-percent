/**
 * Deterministic Smart Insights Engine for One Percent Progress Intelligence.
 * Analyzes completed workouts, body logs, and consistency metrics using
 * pure mathematical rules (zero LLM / zero external AI calls).
 */

import type { WorkoutSession } from "@/lib/types/training.types"
import type { WeightLog, BodyMeasurements } from "@/lib/types/body.types"
import type { HabitLog } from "@/lib/types/habits.types"
import { extractAllPRs } from "@/features/training/services/pr.service"
import { findExerciseById } from "@/features/training/data/exercise-library.data"
import { formatDateKey, subDays } from "@/lib/utils/date"

export type InsightCategory =
  | "volume"
  | "frequency"
  | "pr"
  | "body"
  | "recovery"
  | "consistency"
  | "muscle_balance"

export type InsightImpact = "positive" | "neutral" | "warning" | "info"

export interface SmartInsight {
  id: string
  category: InsightCategory
  impact: InsightImpact
  title: string
  description: string
  metricValue?: string
  changePct?: number
  timestamp: string
}

/**
 * Generates deterministic smart insights from live user training & body data.
 */
export function generateSmartInsights(
  sessions: WorkoutSession[],
  weightLogs: WeightLog[] = [],
  measurements: BodyMeasurements[] = [],
  habitLogs: HabitLog[] = []
): SmartInsight[] {
  const insights: SmartInsight[] = []
  const now = new Date()
  const todayStr = formatDateKey(now)

  const completedSessions = sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => {
      const dateA = a.completedAt?.toDate?.() ? a.completedAt.toDate().getTime() : 0
      const dateB = b.completedAt?.toDate?.() ? b.completedAt.toDate().getTime() : 0
      return dateB - dateA
    })

  // ─── 1. Volume Progression Insight ────────────────────────────────
  if (completedSessions.length >= 4) {
    const latestTwoVol = completedSessions.slice(0, 2).reduce((acc, s) => acc + s.totalVolume, 0)
    const prevTwoVol = completedSessions.slice(2, 4).reduce((acc, s) => acc + s.totalVolume, 0)

    if (prevTwoVol > 0) {
      const pct = Math.round(((latestTwoVol - prevTwoVol) / prevTwoVol) * 100)
      if (pct > 0) {
        insights.push({
          id: "insight-vol-up",
          category: "volume",
          impact: "positive",
          title: "Volume Progression",
          description: `Weekly training volume increased by ${pct}% over your recent sessions.`,
          metricValue: `+${pct}%`,
          changePct: pct,
          timestamp: todayStr,
        })
      } else if (pct < -15) {
        insights.push({
          id: "insight-vol-down",
          category: "volume",
          impact: "warning",
          title: "Deload Detected",
          description: `Training volume dropped by ${Math.abs(pct)}%. If this wasn't a deload week, check your rest and fueling.`,
          metricValue: `${pct}%`,
          changePct: pct,
          timestamp: todayStr,
        })
      }
    }
  }

  // ─── 2. Recent Personal Records Insight ─────────────────────────────
  const recentPRs = extractAllPRs(sessions)
  if (recentPRs.length > 0 && recentPRs[0]) {
    const latestPR = recentPRs[0]
    const ex = latestPR.exercise || findExerciseById(latestPR.exerciseId)
    const exName = ex?.name || "Exercise"

    if (latestPR.type === "1rm") {
      insights.push({
        id: "insight-pr-1rm",
        category: "pr",
        impact: "positive",
        title: "All-Time PR Broken!",
        description: `${exName} estimated 1RM increased to ${latestPR.value} kg.`,
        metricValue: `${latestPR.value} kg`,
        timestamp: todayStr,
      })
    } else if (latestPR.type === "max_weight") {
      insights.push({
        id: "insight-pr-weight",
        category: "pr",
        impact: "positive",
        title: "New Weight Milestone",
        description: `Lifted a personal record of ${latestPR.value} kg on ${exName}.`,
        metricValue: `${latestPR.value} kg`,
        timestamp: todayStr,
      })
    }
  }

  // ─── 3. Muscle Group Frequency & Attention Alerts ───────────────────
  const last14DaysSessions = completedSessions.filter((s) => {
    const d = s.completedAt?.toDate?.() ? s.completedAt.toDate() : new Date()
    return d >= subDays(now, 14)
  })

  const muscleLastTrained: Record<string, Date> = {}
  last14DaysSessions.forEach((s) => {
    const d = s.completedAt?.toDate?.() ? s.completedAt.toDate() : new Date()
    s.musclesWorked?.forEach((m) => {
      if (!muscleLastTrained[m] || d > muscleLastTrained[m]) {
        muscleLastTrained[m] = d
      }
    })
  })

  // Check hamstrings, back, shoulders, legs
  const checkMuscles = ["hamstrings", "quads", "back", "chest", "shoulders"]
  checkMuscles.forEach((m) => {
    const lastDate = muscleLastTrained[m]
    if (lastDate) {
      const daysAgo = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysAgo >= 8) {
        insights.push({
          id: `insight-muscle-neglect-${m}`,
          category: "muscle_balance",
          impact: "warning",
          title: "Muscle Focus Needed",
          description: `${m.charAt(0).toUpperCase() + m.slice(1)} haven't been trained in ${daysAgo} days. Consider including them in your next workout.`,
          metricValue: `${daysAgo}d ago`,
          timestamp: todayStr,
        })
      }
    }
  })

  // ─── 4. Body Weight Trend Insight ──────────────────────────────────
  if (weightLogs.length >= 7) {
    const sortedW = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date))
    const latestW = sortedW[0]?.weightKg
    const oldW = sortedW[6]?.weightKg
    if (latestW != null && oldW != null && oldW > 0) {
      const diff = Math.round((latestW - oldW) * 10) / 10

      if (diff <= -0.5) {
        insights.push({
          id: "insight-bodyweight-loss",
          category: "body",
          impact: "positive",
          title: "Weight Trend Progress",
          description: `Body weight has dropped ${Math.abs(diff)} kg over the past week (7-day trend).`,
          metricValue: `${diff} kg`,
          changePct: Math.round((diff / oldW) * 100),
          timestamp: todayStr,
        })
      } else if (diff >= 0.5) {
        insights.push({
          id: "insight-bodyweight-gain",
          category: "body",
          impact: "info",
          title: "Weight Trend Shift",
          description: `Body weight increased by ${diff} kg over the past week.`,
          metricValue: `+${diff} kg`,
          changePct: Math.round((diff / oldW) * 100),
          timestamp: todayStr,
        })
      }
    }
  }

  // ─── 5. Consistency & Streak Insight ──────────────────────────────
  const activeDates = new Set<string>()
  completedSessions.forEach((s) => {
    const d = s.completedAt?.toDate?.() ? s.completedAt.toDate() : new Date()
    activeDates.add(formatDateKey(d))
  })
  habitLogs.forEach((h) => {
    if (h.completed) activeDates.add(h.date)
  })

  let streak = 0
  let checkD = new Date()
  for (let i = 0; i < 30; i++) {
    const dStr = formatDateKey(checkD)
    if (activeDates.has(dStr)) {
      streak++
    } else if (i > 0) {
      break
    }
    checkD = subDays(checkD, 1)
  }

  if (streak >= 3) {
    insights.push({
      id: "insight-streak",
      category: "consistency",
      impact: "positive",
      title: "Consistency Streak",
      description: `You've maintained a ${streak}-day active training and habit streak!`,
      metricValue: `${streak} Days`,
      timestamp: todayStr,
    })
  }

  // Default baseline insight if few workouts exist
  if (insights.length === 0) {
    insights.push({
      id: "insight-baseline",
      category: "consistency",
      impact: "info",
      title: "Consistency Tracker",
      description: "Log more workouts and body measurements to unlock tailored progress intelligence.",
      timestamp: todayStr,
    })
  }

  return insights
}
