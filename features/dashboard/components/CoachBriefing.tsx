"use client"

import { useMemo } from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ROUTES } from "@/lib/constants/ROUTES"
import { useAuthStore } from "@/lib/store/auth.store"
import { useBodyStore } from "@/features/body/store/body.store"
import { useProgramsStore } from "@/features/training/store/programs.store"

export function CoachBriefing() {
  const { profile } = useAuthStore()
  const { recoveryScores, sleepLogs } = useBodyStore()
  const { programs } = useProgramsStore()
  const firstName = profile?.displayName?.split(" ")[0] || "Athlete"

  const insights = useMemo(() => {
    // 1. Get latest recovery metrics
    const latestRecovery = recoveryScores[0]
    const latestSleep = sleepLogs[0]

    const score = latestRecovery?.score ?? 85
    const hrv = latestRecovery?.hrv ?? 72
    const sleepHrs = latestSleep
      ? Math.round((latestSleep.durationSeconds / 3600) * 10) / 10
      : 7.5

    // 2. Get active training program recommendation
    const activeProg = programs.find((p) => p.isActive && !p.isArchived)
    let sessionRecommendation = "a custom session"
    if (activeProg && activeProg.days.length > 0) {
      // Find a day that is not a rest day, default to day 1
      const workoutDay = activeProg.days.find((d) => !d.isRestDay) || activeProg.days[0]
      sessionRecommendation = `your scheduled ${workoutDay?.name || "session"}`
    }

    // 3. Status wording
    let status = "Optimal"
    if (score < 50) status = "Low (Rest advised)"
    else if (score < 75) status = "Moderate"

    const instruction =
      score < 50
        ? "Today is a red light. Prioritize active recovery, mobility flow, and hydration."
        : `Today is a green light for ${sessionRecommendation}. Keep training intensity high.`

    return {
      score,
      hrv,
      sleepHrs,
      status,
      instruction,
    }
  }, [recoveryScores, sleepLogs, programs])

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-bg-surface p-5 md:p-6 shadow-sm">
      {/* Decorative background flare */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/5 blur-2xl" />

      <div className="flex items-start gap-4">
        {/* Sparkle icon indicator */}
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent">
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="space-y-3 flex-1">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
              AI Coach // Daily Briefing
            </span>
            <h3 className="text-base font-semibold text-primary">
              Good morning, {firstName}.
            </h3>
          </div>

          <p className="text-text-secondary text-sm leading-relaxed">
            Your readiness score is <strong className="text-primary font-semibold">{insights.score}% ({insights.status})</strong> today. Heart Rate Variability is at <code className="font-mono text-xs text-primary">{insights.hrv}ms</code>, and sleep duration was <strong className="text-primary font-semibold">{insights.sleepHrs}h</strong>. {insights.instruction}
          </p>

          <div className="pt-2">
            <Link
              href={ROUTES.coach.root}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              Consult Coach <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
export default CoachBriefing
