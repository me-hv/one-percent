"use client"

import { useMemo } from "react"
import { Target, TrendingUp, Plus } from "lucide-react"
import { useBodyStore } from "@/features/body/store/body.store"
import Link from "next/link"
import { ROUTES } from "@/lib/constants/ROUTES"

export function GoalsWidget() {
  const { goals } = useBodyStore()

  // Get first active goal
  const activeGoal = useMemo(() => {
    return goals.find((g) => g.status === "active")
  }, [goals])

  if (!activeGoal) {
    return (
      <div className="card flex flex-col justify-between p-5 min-h-[170px]">
        <div className="card-header">
          <span className="card-label">Active target goal</span>
          <Target className="h-4 w-4 text-text-placeholder" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-2">
          <span className="text-xs text-text-placeholder">No active goals set.</span>
          <Link
            href={ROUTES.body.root}
            className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Set a new progress goal
          </Link>
        </div>
      </div>
    )
  }

  const startValue = activeGoal.startValue ?? 0
  const targetValue = activeGoal.targetValue ?? 100
  const currentValue = activeGoal.currentValue ?? startValue
  const progressPct = activeGoal.progressPct

  const change = Math.round(Math.abs(currentValue - startValue) * 10) / 10
  const gainLossText =
    currentValue >= startValue
      ? `+${change}${activeGoal.unit || ""} since start`
      : `-${change}${activeGoal.unit || ""} since start`

  return (
    <div className="card space-y-4">
      <div className="card-header">
        <span className="card-label">Active target goal</span>
        <Target className="h-4 w-4 text-text-placeholder" />
      </div>

      <div className="space-y-4">
        {/* Goal Title */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-primary">{activeGoal.title}</h4>
          <div className="flex items-center gap-1 text-[10px] text-accent">
            <TrendingUp className="h-3 w-3" />
            {gainLossText}
          </div>
        </div>

        {/* Progress statistics */}
        <div className="flex justify-between items-baseline pt-1">
          <div className="space-y-0.5">
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              Current
            </span>
            <span className="font-mono text-lg font-bold text-primary">
              {currentValue} {activeGoal.unit}
            </span>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              Target
            </span>
            <span className="font-mono text-lg font-bold text-accent">
              {targetValue} {activeGoal.unit}
            </span>
          </div>
        </div>

        {/* Custom Progress Bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden relative">
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-text-placeholder">
            <span>Start: {startValue} {activeGoal.unit}</span>
            <span>{Math.round(progressPct)}% complete</span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default GoalsWidget
