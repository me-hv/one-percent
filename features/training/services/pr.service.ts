/**
 * Personal Record (PR) Service for One Percent Progress Intelligence Engine.
 * Analyzes completed workout sessions to compute:
 * - Weight PR (heaviest weight lifted)
 * - Rep PR (max reps completed at a given weight)
 * - Volume PR (highest set volume weight * reps)
 * - Estimated 1RM PR (calculated via Epley/Brzycki formula)
 * - Recent PRs feed (timeline of achievements)
 * - Exercise Leaderboard (highest 1RMs and PRs across exercises)
 */

import type { WorkoutSession, PersonalRecord, PRType, Exercise } from "@/lib/types/training.types"
import { calculateE1RM } from "@/lib/utils/analytics.utils"
import { findExerciseById, EXERCISE_LIBRARY } from "../data/exercise-library.data"

export interface ExerciseBestRecords {
  exerciseId: string
  exerciseName: string
  category: string
  muscleGroup: string
  maxWeightKg: number
  maxReps: number
  maxSetVolumeKg: number
  estimated1RM: number
  lastPRDate?: string
}

export interface PRMilestone {
  id: string
  exerciseId: string
  exerciseName: string
  type: PRType
  value: number
  previousValue?: number
  unit: string
  date: string
  sessionName: string
}

/**
 * Scans all completed workout sessions and extracts every PR broken chronologically.
 */
export function extractAllPRs(sessions: WorkoutSession[]): PersonalRecord[] {
  const completed = [...sessions]
    .filter((s) => s.status === "completed" && s.exercises && s.exercises.length > 0)
    .sort((a, b) => {
      const dateA = a.completedAt?.toDate?.() ? a.completedAt.toDate().getTime() : 0
      const dateB = b.completedAt?.toDate?.() ? b.completedAt.toDate().getTime() : 0
      return dateA - dateB
    })

  const prs: PersonalRecord[] = []
  
  // Tracking all-time bests per exercise
  const bestWeight: Record<string, number> = {}
  const bestVolume: Record<string, number> = {}
  const bestE1RM: Record<string, number> = {}

  completed.forEach((session) => {
    const sessionDate = session.completedAt?.toDate?.() ? session.completedAt.toDate() : new Date()

    session.exercises.forEach((se) => {
      const exId = se.exerciseId
      const ex = se.exercise || findExerciseById(exId)

      se.sets.forEach((set) => {
        if (!set.completed || set.isWarmup) return
        const weight = set.weight || 0
        const reps = set.reps || 0
        if (weight <= 0 || reps <= 0) return

        const setVol = weight * reps
        const e1rm = calculateE1RM(weight, reps)

        // 1. Max Weight PR
        const currentBestW = bestWeight[exId] || 0
        if (weight > currentBestW) {
          prs.push({
            id: `pr-w-${session.id}-${exId}-${weight}`,
            userId: session.userId,
            exerciseId: exId,
            exercise: ex,
            type: "max_weight",
            value: weight,
            previousValue: currentBestW > 0 ? currentBestW : undefined,
            sessionId: session.id,
            achievedAt: session.completedAt || ({ toDate: () => sessionDate } as any),
            createdAt: session.createdAt || ({ toDate: () => sessionDate } as any),
          })
          bestWeight[exId] = weight
        }

        // 2. Estimated 1RM PR
        const currentBestE1RM = bestE1RM[exId] || 0
        if (e1rm > currentBestE1RM) {
          prs.push({
            id: `pr-e1rm-${session.id}-${exId}-${e1rm}`,
            userId: session.userId,
            exerciseId: exId,
            exercise: ex,
            type: "1rm",
            value: e1rm,
            previousValue: currentBestE1RM > 0 ? currentBestE1RM : undefined,
            sessionId: session.id,
            achievedAt: session.completedAt || ({ toDate: () => sessionDate } as any),
            createdAt: session.createdAt || ({ toDate: () => sessionDate } as any),
          })
          bestE1RM[exId] = e1rm
        }

        // 3. Set Volume PR
        const currentBestVol = bestVolume[exId] || 0
        if (setVol > currentBestVol) {
          prs.push({
            id: `pr-vol-${session.id}-${exId}-${setVol}`,
            userId: session.userId,
            exerciseId: exId,
            exercise: ex,
            type: "best_set",
            value: setVol,
            previousValue: currentBestVol > 0 ? currentBestVol : undefined,
            sessionId: session.id,
            achievedAt: session.completedAt || ({ toDate: () => sessionDate } as any),
            createdAt: session.createdAt || ({ toDate: () => sessionDate } as any),
          })
          bestVolume[exId] = setVol
        }
      })
    })
  })

  return prs.reverse() // Most recent first
}

/**
 * Returns recent PR milestone feed for dashboard & analytics widgets.
 */
export function getRecentPRs(sessions: WorkoutSession[], limit = 5): PRMilestone[] {
  const prs = extractAllPRs(sessions)
  return prs.slice(0, limit).map((pr) => {
    const ex = pr.exercise || findExerciseById(pr.exerciseId)
    const achievedDate = pr.achievedAt?.toDate?.() ? pr.achievedAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recently"

    let unit = "kg"
    if (pr.type === "max_reps") unit = "reps"

    return {
      id: pr.id,
      exerciseId: pr.exerciseId,
      exerciseName: ex?.name || "Exercise",
      type: pr.type,
      value: pr.value,
      previousValue: pr.previousValue,
      unit,
      date: achievedDate,
      sessionName: "Workout Session",
    }
  })
}

/**
 * Computes all-time best records for a single exercise across all user sessions.
 */
export function getExercisePRs(sessions: WorkoutSession[], exerciseId: string): ExerciseBestRecords | null {
  const ex = findExerciseById(exerciseId)
  let maxWeightKg = 0
  let maxReps = 0
  let maxSetVolumeKg = 0
  let estimated1RM = 0
  let lastPRDate: string | undefined = undefined

  sessions
    .filter((s) => s.status === "completed")
    .forEach((s) => {
      s.exercises?.forEach((se) => {
        if (se.exerciseId === exerciseId) {
          se.sets.forEach((set) => {
            if (!set.completed || set.isWarmup) return
            const w = set.weight || 0
            const r = set.reps || 0
            if (w > maxWeightKg) maxWeightKg = w
            if (r > maxReps) maxReps = r
            if (w * r > maxSetVolumeKg) maxSetVolumeKg = w * r
            const e1rm = calculateE1RM(w, r)
            if (e1rm > estimated1RM) estimated1RM = e1rm
            
            const dateStr = s.completedAt?.toDate?.() ? s.completedAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" }) : undefined
            if (dateStr) lastPRDate = dateStr
          })
        }
      })
    })

  if (maxWeightKg === 0 && estimated1RM === 0) return null

  return {
    exerciseId,
    exerciseName: ex?.name || "Exercise",
    category: ex?.category || "general",
    muscleGroup: ex?.muscleGroups[0] || "full_body",
    maxWeightKg,
    maxReps,
    maxSetVolumeKg,
    estimated1RM,
    lastPRDate,
  }
}

/**
 * Builds full PR Leaderboard ranking exercises by highest 1RM and weight.
 */
export function getPRLeaderboard(sessions: WorkoutSession[]): ExerciseBestRecords[] {
  const exerciseIds = new Set<string>()
  sessions.forEach((s) => {
    s.exercises?.forEach((se) => exerciseIds.add(se.exerciseId))
  })

  const leaderboard: ExerciseBestRecords[] = []
  exerciseIds.forEach((id) => {
    const b = getExercisePRs(sessions, id)
    if (b) leaderboard.push(b)
  })

  return leaderboard.sort((a, b) => b.estimated1RM - a.estimated1RM)
}
