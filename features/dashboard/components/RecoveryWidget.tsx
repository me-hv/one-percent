"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Moon, TrendingUp, ChevronRight } from "lucide-react"
import { useRecoveryStore } from "@/features/recovery/store/recovery.store"
import { calculateReadinessScore } from "@/features/recovery/services/readiness.service"
import { ROUTES } from "@/lib/constants/ROUTES"

export function RecoveryWidget() {
  const { entries, config } = useRecoveryStore()

  const recoveryData = useMemo(() => {
    const latestEntry = entries[0]
    const prevEntry = entries[1]

    const latestResult = calculateReadinessScore(latestEntry, config)
    const prevResult = calculateReadinessScore(prevEntry, config)

    const score = latestResult.score ?? 85
    const prevScore = prevResult.score ?? 80

    const hrv = latestEntry?.hrv ?? 70
    const restingHR = latestEntry?.restingHR ?? 54

    // Format sleep duration
    let sleepStr = "7h 30m"
    if (latestEntry?.sleepDurationMinutes) {
      const hrs = Math.floor(latestEntry.sleepDurationMinutes / 60)
      const mins = latestEntry.sleepDurationMinutes % 60
      sleepStr = `${hrs}h ${mins}m`
    }

    // Calculate variation compared to previous check-in
    let changePct = 0
    if (prevScore > 0) {
      changePct = Math.round(((score - prevScore) / prevScore) * 100)
    }

    const status = latestResult.category.replace(" Readiness", "")

    return {
      score,
      hrv,
      restingHR,
      sleepStr,
      changePct,
      status,
    }
  }, [entries, config])

  return (
    <Link
      href={ROUTES.recovery.root}
      className="card space-y-4 hover:border-border-default transition-all block group"
    >
      <div className="card-header">
        <span className="card-label">Recovery & Sleep</span>
        <div className="flex items-center gap-1 text-text-placeholder group-hover:text-accent transition-colors">
          <Moon className="h-4 w-4" />
          <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Large Score indicator */}
        <div className="flex justify-between items-baseline">
          <div className="space-y-1">
            <span className="font-mono text-3xl font-bold text-accent tracking-tight">
              {recoveryData.score}
            </span>
            <span className="text-xs text-text-secondary ml-1.5">
              / 100 ({recoveryData.status})
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
            <TrendingUp className="h-3 w-3" />
            {recoveryData.changePct >= 0
              ? `+${recoveryData.changePct}%`
              : `${recoveryData.changePct}%`}{" "}
            vs. previous
          </div>
        </div>

        {/* Small stats rows */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle">
          <div className="text-left">
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              HRV
            </span>
            <span className="font-mono text-sm font-semibold text-primary block mt-0.5">
              {recoveryData.hrv}ms
            </span>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              Resting HR
            </span>
            <span className="font-mono text-sm font-semibold text-primary block mt-0.5">
              {recoveryData.restingHR}bpm
            </span>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              Asleep
            </span>
            <span className="font-mono text-sm font-semibold text-primary block mt-0.5">
              {recoveryData.sleepStr}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default RecoveryWidget
