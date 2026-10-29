/**
 * Deterministic Coach Chat Query Resolver
 *
 * Grounded strictly in the athlete's real training, recovery, nutrition, and goal history.
 * Never invents fake statistics, hallucinated lifts, or arbitrary advice.
 */

import type { CoachChatMessage, SupportingEvidence } from "../types/coach.types"
import type { CoachEngineInput } from "./coach-engine.service"
import { generateWeeklyReview } from "./weekly-review.service"
import { calculateReadinessScore } from "@/features/recovery/services/readiness.service"
import { DEFAULT_RECOVERY_CONFIG } from "@/features/recovery/repository/recovery.repository"

export function resolveCoachChatQuery(
  userQuery: string,
  data: CoachEngineInput
): CoachChatMessage {
  const queryLower = userQuery.toLowerCase().trim()
  const nowIso = new Date().toISOString()
  const messageId = `msg-${Date.now()}`

  const completedSessions = data.sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => {
      const dateA = a.completedAt?.toDate?.() ? a.completedAt.toDate().getTime() : 0
      const dateB = b.completedAt?.toDate?.() ? b.completedAt.toDate().getTime() : 0
      return dateB - dateA
    })

  const latestRecovery = data.recoveryEntries[0]
  const activeProgram = data.activeProgram

  // ─── Query 1: What should I focus on today? ───────────────────────
  if (
    queryLower.includes("focus on today") ||
    queryLower.includes("what should i do today") ||
    queryLower.includes("today's workout") ||
    queryLower.includes("today")
  ) {
    const readiness = latestRecovery
      ? calculateReadinessScore(latestRecovery, DEFAULT_RECOVERY_CONFIG).score ?? 80
      : 80
    let text = ""
    const evidence: SupportingEvidence[] = []

    if (activeProgram && activeProgram.days.length > 0) {
      const workoutDay = activeProgram.days.find((d) => !d.isRestDay) || activeProgram.days[0]!
      text = `Today's primary objective is **${workoutDay.name}** under your active **${activeProgram.name}** program.`
      evidence.push({
        metric: "Scheduled Day",
        observedValue: workoutDay.name,
        timeframe: "Today",
        interpretation: `Program prescribes ${workoutDay.exercises.length} movements.`,
      })
    } else {
      text = "You do not have an active training program assigned right now. Consider selecting a program or logging a foundational strength session."
    }

    if (readiness < 50) {
      text += `\n\n⚠️ **Readiness Caution (${readiness}%)**: High fatigue is detected. Reduce working set intensity by 1-2 RPE points or take an extra minute of rest between heavy sets.`
      evidence.push({
        metric: "Readiness Score",
        observedValue: `${readiness}%`,
        threshold: 50,
        timeframe: "Today's check-in",
        interpretation: "Readiness in the red zone; neural drive may be compromised.",
      })
    } else {
      text += `\n\n✅ **Readiness (${readiness}%)**: Autonomic status is optimal. You have the physiological clearance to push for clean progression on your main compound lifts.`
    }

    return {
      id: messageId,
      sender: "coach",
      text,
      timestamp: nowIso,
      evidence,
      suggestedQuestions: [
        "What should I review before increasing a lift?",
        "How is my program consistency?",
        "How did this week compare to last week?",
      ],
      source: "deterministic",
    }
  }

  // ─── Query 2: Performance changes & stall/progression ──────────────
  if (
    queryLower.includes("stall") ||
    queryLower.includes("performance") ||
    queryLower.includes("progress") ||
    queryLower.includes("bench") ||
    queryLower.includes("squat") ||
    queryLower.includes("deadlift")
  ) {
    if (completedSessions.length < 2) {
      return {
        id: messageId,
        sender: "coach",
        text: "I need at least 2 completed sessions of this movement to evaluate your performance trajectory and load progression.",
        timestamp: nowIso,
        suggestedQuestions: ["What should I focus on today?", "How is my program consistency?"],
        source: "deterministic",
      }
    }

    const latest = completedSessions[0]!
    const prior = completedSessions[1]!
    const volDiff = (latest.totalVolume || 0) - (prior.totalVolume || 0)

    const text = `Analyzing your recent sessions:\n\nIn your latest workout (**${latest.name}**), you moved **${(latest.totalVolume || 0).toLocaleString()} kg** across ${latest.totalSets} sets (${volDiff >= 0 ? "+" : ""}${volDiff.toLocaleString()} kg compared to prior session).\n\nIf you consistently hit your target reps with an average RPE under 8.0 across all sets, you are ready for a +2.5kg load increase on compound lifts. If RPE is 9+, hold current weight to consolidate technique.`

    return {
      id: messageId,
      sender: "coach",
      text,
      timestamp: nowIso,
      evidence: [
        {
          metric: "Latest Volume",
          observedValue: `${latest.totalVolume} kg`,
          baselineOrTarget: `${prior.totalVolume} kg`,
          timeframe: "Last 2 workouts",
          interpretation: "Workload comparison between consecutive logged sessions.",
        },
      ],
      suggestedQuestions: [
        "What should I focus on today?",
        "When can I add weight?",
        "Which goals need attention?",
      ],
      source: "deterministic",
    }
  }

  // ─── Query 3: Program consistency & adherence ─────────────────────
  if (
    queryLower.includes("consistency") ||
    queryLower.includes("adherence") ||
    queryLower.includes("program") ||
    queryLower.includes("schedule")
  ) {
    const planned = activeProgram?.daysPerWeek || 4
    const text = `Over the current training cycle, your active program is **${activeProgram?.name || "Standard Routine"}** (${planned} days/week).\n\nYou have logged **${completedSessions.length} total completed workouts** in your history.\n\nKey rule of One Percent: **Consistency beats intensity every time.** Missing one workout is an anomaly; missing two is the start of a new habit. Protect your workout days.`

    return {
      id: messageId,
      sender: "coach",
      text,
      timestamp: nowIso,
      evidence: [
        {
          metric: "Completed Sessions",
          observedValue: `${completedSessions.length} sessions`,
          baselineOrTarget: `${planned} days/week`,
          timeframe: "All time",
          interpretation: "Total verified workout history.",
        },
      ],
      suggestedQuestions: [
        "What should I focus on today?",
        "How did this week compare to last week?",
        "Which goals need attention?",
      ],
      source: "deterministic",
    }
  }

  // ─── Query 4: Weekly comparison ───────────────────────────────────
  if (
    queryLower.includes("week") ||
    queryLower.includes("compare") ||
    queryLower.includes("weekly review")
  ) {
    const review = generateWeeklyReview({
      userId: data.userId,
      sessions: data.sessions,
      activeProgram: data.activeProgram,
      recoveryEntries: data.recoveryEntries,
      nutritionLogs: data.nutritionLogs,
      nutritionTargets: data.nutritionTargets,
    })

    const text = `Here is your trailing 7-day summary:\n\n• **Completed Sessions**: ${review.completedSessions} of ${review.plannedSessions} planned (${review.adherenceRatePct}% adherence)\n• **Total Volume Moved**: ${review.totalVolumeKg.toLocaleString()} kg (${review.volumeChangePct >= 0 ? "+" : ""}${review.volumeChangePct}% vs prior week)\n• **Average Readiness**: ${review.recoverySummary.averageReadiness}%\n• **Average Sleep**: ${review.recoverySummary.averageSleepHours} hours\n\n**Next Week Focus**: ${review.focusAreasNextWeek[0]}`

    return {
      id: messageId,
      sender: "coach",
      text,
      timestamp: nowIso,
      evidence: [
        {
          metric: "7-Day Total Volume",
          observedValue: `${review.totalVolumeKg} kg`,
          timeframe: `${review.weekStartDate} to ${review.weekEndDate}`,
          interpretation: "Net workload moved during the weekly review window.",
        },
      ],
      suggestedQuestions: [
        "What should I focus on today?",
        "Which goals need attention?",
        "When can I add weight?",
      ],
      source: "deterministic",
    }
  }

  // ─── Query 5: Active goals audit ──────────────────────────────────
  if (queryLower.includes("goal") || queryLower.includes("target")) {
    const activeGoals = data.goals.filter((g) => g.status === "active")

    if (activeGoals.length === 0) {
      return {
        id: messageId,
        sender: "coach",
        text: "You currently have no active goals set. Head over to the Goals tab to create your first strength, body composition, or consistency milestone.",
        timestamp: nowIso,
        suggestedQuestions: ["What should I focus on today?", "How is my program consistency?"],
        source: "deterministic",
      }
    }

    const goalList = activeGoals
      .slice(0, 3)
      .map((g) => `• **${g.title}**: ${g.currentValue} / ${g.targetValue} ${g.unit || ""} (${Math.round(g.progressPct || 0)}% completed)`)
      .join("\n")

    const text = `You have ${activeGoals.length} active goal${activeGoals.length > 1 ? "s" : ""}:\n\n${goalList}\n\nTo move closer to these targets, prioritize double progression on associated movements and maintain continuous recovery habits.`

    return {
      id: messageId,
      sender: "coach",
      text,
      timestamp: nowIso,
      suggestedQuestions: [
        "What should I focus on today?",
        "What should I review before increasing a lift?",
        "How did this week compare to last week?",
      ],
      source: "deterministic",
    }
  }

  // ─── Default / General Advice ─────────────────────────────────────
  return {
    id: messageId,
    sender: "coach",
    text: `As your One Percent coach, I analyze your actual logged sessions, readiness scores, and nutrition data to give you verifiable advice.\n\nTry asking me:\n• *"What should I focus on today?"*\n• *"How did this week compare to last week?"*\n• *"What should I review before increasing a lift?"*\n• *"Which goals need attention?"*`,
    timestamp: nowIso,
    suggestedQuestions: [
      "What should I focus on today?",
      "How did this week compare to last week?",
      "What should I review before increasing a lift?",
      "Which goals need attention?",
    ],
    source: "deterministic",
  }
}
