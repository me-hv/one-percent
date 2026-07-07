"use client"

import { useMemo } from "react"
import { Moon, TrendingUp } from "lucide-react"
import { useBodyStore } from "@/features/body/store/body.store"

export function RecoveryWidget() {
  const { recoveryScores, sleepLogs } = useBodyStore()

  const recoveryData = useMemo(() => {
    const latestScore = recoveryScores[0]
    const latestSleep = sleepLogs[0]

    const score = latestScore?.score ?? 85
    const hrv = latestScore?.hrv ?? 70
    const restingHR = latestScore?.restingHR ?? 54

    // format sleep duration
    let sleepStr = "7h 30m"
    if (latestSleep) {
      const hrs = Math.floor(latestSleep.durationSeconds / 3600)
      const mins = Math.round((latestSleep.durationSeconds % 3600) / 60)
      sleepStr = `${hrs}h ${mins}m`
    }

    // calculate variation compared to previous
    let changePct = 5
    const prev = recoveryScores[1]?.score
    if (prev != null) {
      changePct = Math.round(((score - prev) / (prev || 1)) * 100)
    }

    let status = "Optimal"
    if (score < 50) status = "Rest advised"
    else if (score < 75) status = "Recovering"

    return {
      score,
      hrv,
      restingHR,
      sleepStr,
      changePct,
      status,
    }
  }, [recoveryScores, sleepLogs])

  return (
    <div className="card space-y-4">
      <div className="card-header">
        <span className="card-label">Recovery & Sleep</span>
        <Moon className="h-4 w-4 text-text-placeholder" />
      </div>

      <div className="space-y-4">
        {/* Large Score Ring / Arc indicator */}
        <div className="flex justify-between items-baseline">
          <div className="space-y-1">
            <span className="font-mono text-3xl font-bold text-accent tracking-tight">
              {recoveryData.score}
            </span>
            <span className="text-xs text-text-secondary ml-1.5">/ 100 ({recoveryData.status})</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
            <TrendingUp className="h-3 w-3" />
            {recoveryData.changePct >= 0 ? `+${recoveryData.changePct}%` : `${recoveryData.changePct}%`} vs. baseline
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
    </div>
  )
}
export default RecoveryWidget
