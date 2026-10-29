import type {
  RecoveryInsight,
  DailyRecoveryEntry,
  RecoveryConfig,
  TrainingLoadSummary,
} from "@/lib/types/recovery.types"
import { calculateReadinessScore } from "./readiness.service"

/**
 * Pure, deterministic recovery insight generator.
 * Grounds every insight strictly in recorded user history with observation periods and metric values.
 * Contains no AI, no speculative medical claims, and no prescriptive mandates.
 */
export function generateRecoveryInsights(
  entries: DailyRecoveryEntry[] = [],
  trainingLoad?: TrainingLoadSummary,
  config: RecoveryConfig = { targetSleepMinutes: 480, minCompletenessPct: 40 }
): RecoveryInsight[] {
  const insights: RecoveryInsight[] = []

  // Require minimum 2 check-ins for trend insights
  if (entries.length < 2) {
    insights.push({
      id: "ins-intro",
      type: "wellness",
      level: "neutral",
      title: "Building Recovery Baseline",
      message:
        "Complete regular daily check-ins to establish baseline sleep duration, wellness trends, and readiness insights.",
      observationPeriod: "Initial setup",
      metricValues: { recordedEntries: entries.length },
    })
    return insights
  }

  // Sort descending by date
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const recent7 = sortedEntries.slice(0, 7)

  // 1. Sleep Duration vs Target Insight
  const sleepEntries7d = recent7.filter((e) => e.sleepDurationMinutes != null)
  if (sleepEntries7d.length >= 3) {
    const totalMins = sleepEntries7d.reduce((sum, e) => sum + (e.sleepDurationMinutes || 0), 0)
    const avgSleepMins = Math.round(totalMins / sleepEntries7d.length)
    const avgSleepHrs = (avgSleepMins / 60).toFixed(1)
    const targetHrs = (config.targetSleepMinutes / 60).toFixed(1)

    if (avgSleepMins < config.targetSleepMinutes - 30) {
      insights.push({
        id: "ins-sleep-deficit",
        type: "sleep",
        level: "caution",
        title: "Sleep Duration Deficit",
        message: `Sleep duration averaged ${avgSleepHrs}h over ${sleepEntries7d.length} recorded nights, below your configured target of ${targetHrs}h.`,
        observationPeriod: `Last ${sleepEntries7d.length} recorded check-ins`,
        metricValues: {
          averageSleepMinutes: avgSleepMins,
          targetSleepMinutes: config.targetSleepMinutes,
        },
      })
    } else if (avgSleepMins >= config.targetSleepMinutes) {
      insights.push({
        id: "ins-sleep-optimal",
        type: "sleep",
        level: "positive",
        title: "Target Sleep Consistency",
        message: `Sleep duration averaged ${avgSleepHrs}h over ${sleepEntries7d.length} recorded nights, meeting or exceeding your target (${targetHrs}h).`,
        observationPeriod: `Last ${sleepEntries7d.length} recorded check-ins`,
        metricValues: {
          averageSleepMinutes: avgSleepMins,
          targetSleepMinutes: config.targetSleepMinutes,
        },
      })
    }
  }

  // 2. Subjective Fatigue & Stress Trends
  if (sortedEntries.length >= 6) {
    const last3 = sortedEntries.slice(0, 3)
    const prev3 = sortedEntries.slice(3, 6)

    const avgRecentFatigue =
      last3.reduce((sum, e) => sum + (e.fatigue || 3), 0) / last3.length
    const avgPrevFatigue =
      prev3.reduce((sum, e) => sum + (e.fatigue || 3), 0) / prev3.length

    if (avgRecentFatigue - avgPrevFatigue >= 1.0 && avgRecentFatigue >= 3.5) {
      insights.push({
        id: "ins-fatigue-rise",
        type: "wellness",
        level: "caution",
        title: "Reported Fatigue Escalation",
        message: `Self-reported fatigue has risen from an average of ${avgPrevFatigue.toFixed(1)}/5 to ${avgRecentFatigue.toFixed(1)}/5 over recent check-ins.`,
        observationPeriod: "Last 6 check-ins (3-day split)",
        metricValues: {
          recentAverageFatigue: Math.round(avgRecentFatigue * 10) / 10,
          previousAverageFatigue: Math.round(avgPrevFatigue * 10) / 10,
        },
      })
    }
  }

  // 3. Strained Muscles with Recent Training Load
  if (trainingLoad?.muscleStatuses) {
    const strained = trainingLoad.muscleStatuses.filter(
      (m) => m.recoveryEstimate === "strained"
    )
    if (strained.length > 0) {
      const names = strained.map((s) => s.muscle).join(", ")
      insights.push({
        id: "ins-muscle-strain",
        type: "muscle",
        level: "caution",
        title: `Residual Soreness: ${names}`,
        message: `Elevated soreness reported in ${names} following recent training exposure. Consider warming up thoroughly before loading these muscle groups.`,
        observationPeriod: "Current recovery check-in",
        metricValues: {
          strainedMusclesCount: strained.length,
        },
      })
    }
  }

  // 4. Training Workload & ACWR Progression
  if (trainingLoad) {
    if (trainingLoad.acwr != null) {
      if (trainingLoad.acwrStatus === "caution" || trainingLoad.acwrStatus === "overreaching") {
        insights.push({
          id: "ins-acwr-spike",
          type: "training_load",
          level: "caution",
          title: "Acute Training Volume Spike",
          message: `Acute 7-day training volume (${trainingLoad.totalVolume7d.toLocaleString()}kg) is ${Math.round(trainingLoad.acwr * 100)}% of your 4-week chronic average. Note: ACWR is descriptive and not a direct injury predictor.`,
          observationPeriod: "Past 7 days vs. 28-day chronic baseline",
          metricValues: {
            acwr: trainingLoad.acwr,
            volume7d: trainingLoad.totalVolume7d,
            avgVolume4w: trainingLoad.avgWeeklyVolume4w,
          },
        })
      } else if (trainingLoad.acwrStatus === "optimal") {
        insights.push({
          id: "ins-acwr-optimal",
          type: "training_load",
          level: "positive",
          title: "Sustainable Training Progression",
          message: `Acute weekly volume is progressing within the sustainable optimal ratio (${Math.round(trainingLoad.acwr * 100)}% of chronic average).`,
          observationPeriod: "Past 7 days vs. 28-day chronic baseline",
          metricValues: {
            acwr: trainingLoad.acwr,
            volume7d: trainingLoad.totalVolume7d,
          },
        })
      }
    }
  }

  // 5. Readiness Score Consistency
  const scores7d = recent7
    .map((e) => calculateReadinessScore(e, config).score)
    .filter((s): s is number => s !== null)

  if (scores7d.length >= 3) {
    const avgReadiness = Math.round(
      scores7d.reduce((sum, s) => sum + s, 0) / scores7d.length
    )
    if (avgReadiness >= 82) {
      insights.push({
        id: "ins-readiness-high",
        type: "readiness",
        level: "positive",
        title: "High Readiness Stability",
        message: `Readiness scores have averaged ${avgReadiness}/100 across recent check-ins, indicating consistently well-managed recovery.`,
        observationPeriod: `Last ${scores7d.length} completed check-ins`,
        metricValues: { averageReadiness: avgReadiness },
      })
    }
  }

  return insights
}
