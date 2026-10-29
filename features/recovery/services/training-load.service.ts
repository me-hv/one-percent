import type {
  TrainingLoadSummary,
  MuscleRecoveryStatus,
  DailyRecoveryEntry,
  SorenessRating,
} from "@/lib/types/recovery.types"
import type { MuscleGroup } from "@/lib/types/common.types"
import type { WorkoutSession } from "@/lib/types/training.types"
import { EXERCISE_LIBRARY } from "@/features/training/data/exercise-library.data"
import { subDays, formatDateKey } from "@/lib/utils/date"

const ALL_PRIMARY_MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "glutes",
  "biceps",
  "triceps",
  "calves",
  "core",
]

// Build fast lookup for exercise muscle mappings
const EXERCISE_MUSCLE_MAP = new Map<string, { primary: MuscleGroup[]; secondary: MuscleGroup[] }>()
EXERCISE_LIBRARY.forEach((ex) => {
  EXERCISE_MUSCLE_MAP.set(ex.id, {
    primary: ex.muscleGroups || [],
    secondary: ex.secondaryMuscles || [],
  })
})

function getSessionDate(session: WorkoutSession): Date {
  if (session.completedAt && typeof (session.completedAt as any).toDate === "function") {
    return (session.completedAt as any).toDate()
  }
  if (session.completedAt instanceof Date) {
    return session.completedAt
  }
  if (session.startedAt && typeof (session.startedAt as any).toDate === "function") {
    return (session.startedAt as any).toDate()
  }
  return new Date()
}

/**
 * Pure, deterministic calculation of training load, ACWR, and muscle recovery estimates.
 *
 * Caveat & Transparency Note:
 * Acute-to-Chronic Workload Ratio (ACWR) and muscle recovery statuses are descriptive
 * planning heuristics comparing acute 7-day load against 28-day chronic volume baseline.
 * They are NOT medical diagnoses and do NOT guarantee injury prevention.
 */
export function calculateTrainingLoadSummary(
  sessions: WorkoutSession[] = [],
  recoveryEntries: DailyRecoveryEntry[] = [],
  referenceDate: Date = new Date()
): TrainingLoadSummary {
  const completedSessions = sessions.filter((s) => s.status === "completed")

  // Date boundaries
  const d7 = subDays(referenceDate, 7)
  const d14 = subDays(referenceDate, 14)
  const d28 = subDays(referenceDate, 28)

  // 1. Workouts in acute (7d), previous (7-14d), and chronic (28d) windows
  const sessions7d = completedSessions.filter((s) => getSessionDate(s) >= d7)
  const sessionsPrev7d = completedSessions.filter((s) => {
    const d = getSessionDate(s)
    return d >= d14 && d < d7
  })
  const sessions28d = completedSessions.filter((s) => getSessionDate(s) >= d28)

  const workoutsCount7d = sessions7d.length
  const workoutsCount28d = sessions28d.length

  const totalVolume7d = sessions7d.reduce((sum, s) => sum + (s.totalVolume || 0), 0)
  const totalVolumePrev7d = sessionsPrev7d.reduce((sum, s) => sum + (s.totalVolume || 0), 0)
  const totalVolume28d = sessions28d.reduce((sum, s) => sum + (s.totalVolume || 0), 0)

  // Volume change %
  const volumeChangePct =
    totalVolumePrev7d > 0
      ? Math.round(((totalVolume7d - totalVolumePrev7d) / totalVolumePrev7d) * 100)
      : null

  // Average weekly volume across 4 weeks (Chronic load)
  const avgWeeklyVolume4w = Math.round(totalVolume28d / 4)

  // 2. Acute-to-Chronic Workload Ratio (ACWR)
  let acwr: number | null = null
  let acwrStatus: TrainingLoadSummary["acwrStatus"] = undefined

  if (avgWeeklyVolume4w > 0) {
    acwr = Math.round((totalVolume7d / avgWeeklyVolume4w) * 100) / 100
    if (acwr >= 0.8 && acwr <= 1.3) {
      acwrStatus = "optimal"
    } else if (acwr < 0.8) {
      acwrStatus = "undertraining"
    } else if (acwr <= 1.5) {
      acwrStatus = "overreaching"
    } else {
      acwrStatus = "caution"
    }
  }

  // 3. Muscle Group Training Frequency & Volume Breakdown
  const muscleGroupFrequency7d: Partial<Record<MuscleGroup, number>> = {}
  const muscleSets7d: Partial<Record<MuscleGroup, number>> = {}
  const muscleVolume7d: Partial<Record<MuscleGroup, number>> = {}
  const muscleLastTrained: Partial<Record<MuscleGroup, Date>> = {}

  // Sort sessions descending by date to find most recent exposure
  const sortedSessions = [...completedSessions].sort(
    (a, b) => getSessionDate(b).getTime() - getSessionDate(a).getTime()
  )

  for (const session of sortedSessions) {
    const sessionDate = getSessionDate(session)
    const isWithin7d = sessionDate >= d7

    for (const ex of session.exercises || []) {
      const mapping = EXERCISE_MUSCLE_MAP.get(ex.exerciseId)
      const primaryMuscles = mapping?.primary || []
      const completedSets = (ex.sets || []).filter((set) => set.completed)
      const setsCount = completedSets.length
      const exerciseVol = completedSets.reduce(
        (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
        0
      )

      for (const muscle of primaryMuscles) {
        // Track last trained
        if (!muscleLastTrained[muscle]) {
          muscleLastTrained[muscle] = sessionDate
        }

        // Track 7d volume & frequency
        if (isWithin7d) {
          muscleGroupFrequency7d[muscle] = (muscleGroupFrequency7d[muscle] || 0) + 1
          muscleSets7d[muscle] = (muscleSets7d[muscle] || 0) + setsCount
          muscleVolume7d[muscle] = (muscleVolume7d[muscle] || 0) + exerciseVol
        }
      }
    }
  }

  // 4. Latest reported soreness from recent check-ins
  const latestCheckIn = [...recoveryEntries].sort((a, b) =>
    b.date.localeCompare(a.date)
  )[0]
  const currentSorenessMap = latestCheckIn?.muscleSoreness || {}

  // 5. Generate descriptive MuscleRecoveryStatus for all major muscles
  const muscleStatuses: MuscleRecoveryStatus[] = ALL_PRIMARY_MUSCLES.map((muscle) => {
    const lastDate = muscleLastTrained[muscle]
    const daysSinceTrained = lastDate
      ? Math.max(
          0,
          Math.floor((referenceDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        )
      : null

    const currentSoreness = ((currentSorenessMap as Partial<Record<MuscleGroup, SorenessRating>>)[muscle] as SorenessRating) || 0
    const sets7d = muscleSets7d[muscle] || 0
    const vol7d = muscleVolume7d[muscle] || 0

    let recoveryEstimate: MuscleRecoveryStatus["recoveryEstimate"]
    let notes: string

    if (daysSinceTrained == null || daysSinceTrained > 14) {
      recoveryEstimate = "untrained"
      notes = "No recorded training session in the past 14 days."
    } else if (daysSinceTrained <= 2 && currentSoreness >= 3) {
      recoveryEstimate = "strained"
      notes = `Trained ${daysSinceTrained === 0 ? "today" : `${daysSinceTrained}d ago`} with elevated reported soreness (${currentSoreness}/5). Rest recommended.`
    } else if (daysSinceTrained <= 2) {
      recoveryEstimate = "recovering"
      notes = `Trained ${daysSinceTrained === 0 ? "today" : `${daysSinceTrained}d ago`}. Normal recovery underway.`
    } else if (daysSinceTrained >= 3 && currentSoreness <= 1) {
      recoveryEstimate = "fresh"
      notes = `Trained ${daysSinceTrained}d ago with low soreness. Ready for progressive loading.`
    } else {
      recoveryEstimate = "recovering"
      notes = `Trained ${daysSinceTrained}d ago. Light residual tension.`
    }

    return {
      muscle,
      lastTrainedDate: lastDate ? formatDateKey(lastDate) : null,
      daysSinceTrained,
      totalSets7d: sets7d,
      totalVolume7d: vol7d,
      currentSoreness,
      recoveryEstimate,
      notes,
    }
  })

  // 6. Accumulated Training Fatigue Indicator
  let accumulatedFatigueIndicator: TrainingLoadSummary["accumulatedFatigueIndicator"] = "low"
  let accumulatedFatigueReason = "Training frequency and volume are within sustainable parameters."

  const avgRecentFatigue =
    recoveryEntries.slice(0, 3).reduce((sum, e) => sum + (e.fatigue || 2), 0) /
    Math.max(1, Math.min(3, recoveryEntries.length))

  if (acwr != null && acwr > 1.45 && workoutsCount7d >= 5) {
    accumulatedFatigueIndicator = "high"
    accumulatedFatigueReason =
      "Acute volume spike (>1.45x baseline) combined with high session density (5+ sessions in 7 days)."
  } else if ((acwr != null && acwr > 1.3) || workoutsCount7d >= 5 || avgRecentFatigue >= 4) {
    accumulatedFatigueIndicator = "elevated"
    accumulatedFatigueReason =
      "Elevated acute training load or high reported subjective fatigue over recent check-ins."
  } else if (workoutsCount7d >= 4 || avgRecentFatigue >= 3) {
    accumulatedFatigueIndicator = "moderate"
    accumulatedFatigueReason = "Moderate training stimulus with active recovery response."
  }

  return {
    workoutsCount7d,
    workoutsCount28d,
    totalVolume7d,
    totalVolumePrev7d,
    volumeChangePct,
    avgWeeklyVolume4w,
    acwr,
    acwrStatus,
    muscleGroupFrequency7d,
    muscleStatuses,
    accumulatedFatigueIndicator,
    accumulatedFatigueReason,
  }
}
