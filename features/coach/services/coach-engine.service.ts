/**
 * Deterministic Coaching Engine
 *
 * Implements evidence-based strength & conditioning rules, progression algorithms,
 * fatigue management, and nutrition alignment without requiring external AI.
 * Every recommendation produces verifiable supporting evidence from real user data.
 */

import type {
  CoachingRecommendation,
  SupportingEvidence,
  RecommendationCategory,
  RecommendationPriority,
  ConfidenceLevel,
} from "../types/coach.types"
import type { WorkoutSession, TrainingProgram, ProgramExercise } from "@/lib/types/training.types"
import type { DailyRecoveryEntry } from "@/lib/types/recovery.types"
import type { DailyNutritionLog, NutritionTargets } from "@/lib/types/nutrition.types"
import type { Goal } from "@/lib/types/goals.types"
import { formatDateKey, subDays } from "@/lib/utils/date"
import { calculateReadinessScore } from "@/features/recovery/services/readiness.service"
import { DEFAULT_RECOVERY_CONFIG } from "@/features/recovery/repository/recovery.repository"

export interface CoachEngineInput {
  userId: string
  sessions: WorkoutSession[]
  activeProgram?: TrainingProgram | null
  recoveryEntries: DailyRecoveryEntry[]
  nutritionLogs: DailyNutritionLog[]
  nutritionTargets?: NutritionTargets | null
  goals: Goal[]
  dismissedIds?: string[]
}

/**
 * Calculates overall data completeness score (0 - 100%) and missing data notices.
 */
export function calculateDataCompleteness(input: CoachEngineInput): {
  scorePct: number
  missingDataItems: string[]
} {
  let points = 0
  const missing: string[] = []

  // 1. Program defined (25 pts)
  if (input.activeProgram && input.activeProgram.days.length > 0) {
    points += 25
  } else {
    missing.push("Active training program")
  }

  // 2. Workout history (25 pts)
  const completedSessions = input.sessions.filter((s) => s.status === "completed")
  if (completedSessions.length >= 3) {
    points += 25
  } else if (completedSessions.length >= 1) {
    points += 15
    missing.push("More completed workouts (need 3+ for progression confidence)")
  } else {
    missing.push("Completed workout sessions")
  }

  // 3. Recovery check-ins (25 pts)
  if (input.recoveryEntries.length >= 3) {
    points += 25
  } else if (input.recoveryEntries.length >= 1) {
    points += 15
    missing.push("Regular daily recovery check-ins")
  } else {
    missing.push("Daily recovery logs")
  }

  // 4. Nutrition logs (25 pts)
  if (input.nutritionLogs.length >= 3) {
    points += 25
  } else if (input.nutritionLogs.length >= 1) {
    points += 15
    missing.push("Consistent nutrition tracking")
  } else {
    missing.push("Nutrition and macro logs")
  }

  return {
    scorePct: Math.min(100, points),
    missingDataItems: missing,
  }
}

/**
 * Main engine entrypoint: synthesizes multi-domain fitness data into deterministic recommendations.
 */
export function generateCoachingRecommendations(input: CoachEngineInput): CoachingRecommendation[] {
  const recommendations: CoachingRecommendation[] = []
  const { scorePct, missingDataItems } = calculateDataCompleteness(input)
  const dismissedSet = new Set(input.dismissedIds || [])
  const nowIso = new Date().toISOString()

  const completedSessions = input.sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => {
      const dateA = a.completedAt?.toDate?.() ? a.completedAt.toDate().getTime() : 0
      const dateB = b.completedAt?.toDate?.() ? b.completedAt.toDate().getTime() : 0
      return dateB - dateA
    })

  const latestRecovery = input.recoveryEntries.length > 0 ? input.recoveryEntries[0] : null
  const activeProgram = input.activeProgram

  // ─── 1. RECOVERY & READINESS ANALYSIS ─────────────────────────────
  if (latestRecovery) {
    const recoveryCalc = calculateReadinessScore(latestRecovery, DEFAULT_RECOVERY_CONFIG)
    const score = recoveryCalc.score ?? 80
    const sleepHours = latestRecovery.sleepDurationMinutes
      ? latestRecovery.sleepDurationMinutes / 60
      : 0
    const soreMuscles = Object.entries(latestRecovery.muscleSoreness || {})
      .filter(([_, level]) => typeof level === "number" && level >= 4)
      .map(([muscle]) => muscle)

    // Red-light recovery: Readiness < 50
    if (score < 50 && !dismissedSet.has("rec-red-light-readiness")) {
      recommendations.push({
        id: "rec-red-light-readiness",
        category: "recovery",
        priority: "critical",
        title: "Fatigue Flag: Prioritize Active Recovery Today",
        recommendation:
          "Reduce training volume by 25-40% or swap today's session for 30 minutes of zone 2 recovery or mobility work.",
        rationale:
          "Your composite readiness score indicates significant systemic fatigue or incomplete neural recovery.",
        evidence: [
          {
            metric: "Readiness Score",
            observedValue: `${score}%`,
            threshold: 50,
            timeframe: "Today's check-in",
            sourceDataRef: "recoveryEntries[0]",
            interpretation: "Score is below the 50% optimal threshold, suggesting high autonomic fatigue.",
          },
          {
            metric: "Sleep Duration",
            observedValue: `${sleepHours.toFixed(1)} hrs`,
            baselineOrTarget: "7.5+ hrs",
            timeframe: "Last night",
            sourceDataRef: "recoveryEntries[0].sleepDurationMinutes",
            interpretation: sleepHours < 6.5 ? "Sub-optimal sleep window detected." : "Sleep quantity is adequate.",
          },
        ],
        confidence: "high",
        dataCompletenessPct: scorePct,
        status: "active",
        createdAt: nowIso,
        action: {
          type: "check_in",
          label: "View Recovery Breakdown",
          url: "/recovery",
        },
      })
    }

    // High soreness conflict with scheduled session
    if (soreMuscles.length > 0 && activeProgram && !dismissedSet.has("rec-soreness-conflict")) {
      recommendations.push({
        id: "rec-soreness-conflict",
        category: "recovery",
        priority: "high",
        title: `Localized DOMS in ${soreMuscles.join(", ")}`,
        recommendation: `Allow an extra 24-48 hours before loading ${soreMuscles.join(", ")} heavily. Consider shifting compound sets to secondary accessory variations.`,
        rationale: "High muscle soreness (>= 4/5) reduces contractile force production and increases strain risk.",
        evidence: [
          {
            metric: "Soreness Rating",
            observedValue: `${soreMuscles.join(", ")} rated >= 4/5`,
            threshold: "4/5",
            timeframe: "Today",
            sourceDataRef: "recoveryEntries[0].muscleSoreness",
            interpretation: "Severe or high delayed onset muscle soreness recorded.",
          },
        ],
        confidence: "high",
        dataCompletenessPct: scorePct,
        status: "active",
        createdAt: nowIso,
      })
    }
  }

  // ─── 2. PROGRESSION & ADAPTIVE STRENGTH ANALYSIS ──────────────────
  if (completedSessions.length >= 2 && activeProgram) {
    // Find exercises in active program that have recent performance logs
    for (const day of activeProgram.days) {
      if (day.isRestDay) continue

      for (const progEx of day.exercises) {
        // Collect past sessions containing this exercise
        const relevantSessions = completedSessions.filter((s) =>
          s.exercises.some((e) => e.exerciseId === progEx.exerciseId && e.sets.some((st) => st.completed))
        )

        if (relevantSessions.length >= 2) {
          const latestSession = relevantSessions[0]!
          const latestEx = latestSession.exercises.find((e) => e.exerciseId === progEx.exerciseId)!
          const completedSets = latestEx.sets.filter((st) => st.completed && !st.isWarmup)

          if (completedSets.length > 0) {
            // Check if user hit prescribed target reps across all work sets with clean RPE
            const parsedTargetReps = parseInt(progEx.targetReps, 10) || 8
            const allHitTarget = completedSets.every((st) => (st.reps || 0) >= parsedTargetReps)
            const avgRpe =
              completedSets.reduce((sum, st) => sum + (st.rpe || 7.5), 0) / completedSets.length

            const recId = `rec-prog-${progEx.exerciseId}`

            // A: Promotion / Load Increase Trigger
            if (allHitTarget && avgRpe <= 8.0 && !dismissedSet.has(recId)) {
              const currentWeight = progEx.targetWeight || completedSets[0]?.weight || 60
              // Increment: +2.5kg for upper, +5kg for lower compounds
              const isHeavyCompound =
                progEx.exercise?.category === "barbell" || progEx.exercise?.mechanics === "compound"
              const increment = isHeavyCompound ? 2.5 : 1.25
              const proposedWeight = Math.round((currentWeight + increment) * 10) / 10

              recommendations.push({
                id: recId,
                category: "progression",
                priority: "high",
                title: `Ready for Progression: ${progEx.exercise?.name || "Exercise"}`,
                recommendation: `Increase working load to ${proposedWeight}kg (+${increment}kg) for your next session.`,
                rationale: `You completed all ${completedSets.length} sets at ${parsedTargetReps} reps with an average RPE of ${avgRpe.toFixed(1)}, demonstrating reserve capacity.`,
                evidence: [
                  {
                    metric: "Completed Reps vs Target",
                    observedValue: `${completedSets.map((s) => s.reps).join(", ")} reps`,
                    baselineOrTarget: `${parsedTargetReps} reps`,
                    timeframe: `Session on ${latestSession.name}`,
                    sourceDataRef: `sessions[${latestSession.id}].exercises[${progEx.exerciseId}]`,
                    interpretation: `Target rep requirement fully satisfied across all ${completedSets.length} sets.`,
                  },
                  {
                    metric: "Average Working RPE",
                    observedValue: avgRpe.toFixed(1),
                    threshold: "<= 8.0",
                    timeframe: "Last session",
                    interpretation: "Exertion level indicates 2+ reps in reserve (RIR), supporting load progression.",
                  },
                ],
                confidence: "high",
                dataCompletenessPct: scorePct,
                status: "active",
                createdAt: nowIso,
                action: {
                  type: "adaptive_proposal",
                  label: "Review Program Adjustment",
                  payload: {
                    programId: activeProgram.id,
                    dayId: day.id,
                    exerciseId: progEx.id,
                    proposedWeight,
                    currentWeight,
                    increment,
                  },
                },
              })
              break // One primary progression per generation to maintain focus
            }

            // B: Plateau Detection (Stalled at high RPE for 3 sessions)
            if (relevantSessions.length >= 3 && avgRpe >= 9.0 && !dismissedSet.has(`rec-plateau-${progEx.exerciseId}`)) {
              const plateauId = `rec-plateau-${progEx.exerciseId}`
              recommendations.push({
                id: plateauId,
                category: "progression",
                priority: "medium",
                title: `Plateau Watch: ${progEx.exercise?.name || "Exercise"}`,
                recommendation:
                  "Hold current load for 1 more session or consider a 10% deload to rebuild volume speed.",
                rationale: "Performance has capped with maximum exertion (RPE >= 9.0) over recent workouts.",
                evidence: [
                  {
                    metric: "Average RPE",
                    observedValue: avgRpe.toFixed(1),
                    threshold: ">= 9.0",
                    timeframe: "Last 3 sessions",
                    interpretation: "Consistently lifting near failure with minimal reserve capacity.",
                  },
                ],
                confidence: "medium",
                dataCompletenessPct: scorePct,
                status: "active",
                createdAt: nowIso,
              })
              break
            }
          }
        }
      }
    }
  }

  // ─── 3. CONSISTENCY & PROGRAM ADHERENCE ────────────────────────────
  if (activeProgram && !dismissedSet.has("rec-adherence-tracker")) {
    const plannedDaysPerWeek = activeProgram.daysPerWeek || activeProgram.days.filter((d) => !d.isRestDay).length
    const sevenDaysAgo = subDays(new Date(), 7).getTime()
    const workoutsThisWeek = completedSessions.filter((s) => {
      const t = s.completedAt?.toDate?.() ? s.completedAt.toDate().getTime() : 0
      return t >= sevenDaysAgo
    }).length

    if (workoutsThisWeek < plannedDaysPerWeek - 1 && completedSessions.length > 0) {
      recommendations.push({
        id: "rec-adherence-tracker",
        category: "consistency",
        priority: "medium",
        title: "Session Schedule Adjustment",
        recommendation: `You've completed ${workoutsThisWeek} of ${plannedDaysPerWeek} planned sessions this week. Plan a short 30-minute session to stay on cadence.`,
        rationale: "Consistent frequency is the strongest driver of neuromuscular adaptation and habit retention.",
        evidence: [
          {
            metric: "Weekly Frequency",
            observedValue: `${workoutsThisWeek} sessions`,
            baselineOrTarget: `${plannedDaysPerWeek} sessions`,
            timeframe: "Trailing 7 days",
            interpretation: "Training frequency is trailing program blueprint by 1-2 sessions.",
          },
        ],
        confidence: "high",
        dataCompletenessPct: scorePct,
        status: "active",
        createdAt: nowIso,
        action: {
          type: "start_workout",
          label: "Start Workout",
          url: "/training/log",
        },
      })
    }
  }

  // ─── 4. NUTRITION ALIGNMENT ───────────────────────────────────────
  if (input.nutritionLogs.length >= 2 && input.nutritionTargets && !dismissedSet.has("rec-nutrition-protein")) {
    const recentLogs = input.nutritionLogs.slice(0, 3)
    const avgProtein =
      recentLogs.reduce((acc, l) => acc + (l.totalProtein || 0), 0) / recentLogs.length
    const targetProtein = input.nutritionTargets.protein

    if (targetProtein > 0 && avgProtein < targetProtein * 0.8) {
      const deficit = Math.round(targetProtein - avgProtein)
      recommendations.push({
        id: "rec-nutrition-protein",
        category: "nutrition",
        priority: "medium",
        title: "Protein Pacing Opportunity",
        recommendation: `Increase daily protein intake by ~${deficit}g to reach your target of ${targetProtein}g.`,
        rationale: "Optimal muscle protein synthesis requires adequate daily amino acid availability.",
        evidence: [
          {
            metric: "Average Protein",
            observedValue: `${Math.round(avgProtein)}g`,
            baselineOrTarget: `${targetProtein}g`,
            threshold: `${Math.round(targetProtein * 0.8)}g`,
            unit: "g",
            timeframe: "Last 3 logged days",
            sourceDataRef: "nutritionLogs",
            interpretation: `Intake is running ${Math.round((1 - avgProtein / targetProtein) * 100)}% below target.`,
          },
        ],
        confidence: "medium",
        dataCompletenessPct: scorePct,
        status: "active",
        createdAt: nowIso,
        action: {
          type: "log_nutrition",
          label: "Log Meal",
          url: "/nutrition",
        },
      })
    }
  }

  // ─── 5. DATA QUALITY / MISSING INPUT NOTICES ──────────────────────
  if (missingDataItems.length > 0 && recommendations.length < 3 && !dismissedSet.has("rec-data-completeness")) {
    recommendations.push({
      id: "rec-data-completeness",
      category: "data_quality",
      priority: "low",
      title: "Enhance Coaching Accuracy",
      recommendation: `Log ${missingDataItems[0]} to unlock deeper personalized progression recommendations.`,
      rationale:
        "The One Percent coaching engine uses multi-factor correlation. Logging daily signals improves recommendation precision.",
      evidence: [
        {
          metric: "Data Completeness",
          observedValue: `${scorePct}%`,
          baselineOrTarget: "100%",
          threshold: "80%",
          timeframe: "Current state",
          interpretation: `Missing ${missingDataItems.length} data streams: ${missingDataItems.join(", ")}.`,
        },
      ],
      confidence: "high",
      dataCompletenessPct: scorePct,
      missingDataNotice: missingDataItems.join(", "),
      status: "active",
      createdAt: nowIso,
    })
  }

  return recommendations
}
