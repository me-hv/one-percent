"use client"

import { Target, TrendingUp } from "lucide-react"

export function GoalsWidget() {
  const goalTitle = "Deadlift 200kg 1RM"
  const startValue = 160
  const targetValue = 200
  const currentValue = 190
  const progressPct = ((currentValue - startValue) / (targetValue - startValue)) * 100

  return (
    <div className="card space-y-4">
      <div className="card-header">
        <span className="card-label">Active target goal</span>
        <Target className="h-4 w-4 text-text-placeholder" />
      </div>

      <div className="space-y-4">
        {/* Goal Title */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-primary">{goalTitle}</h4>
          <div className="flex items-center gap-1 text-[10px] text-accent">
            <TrendingUp className="h-3 w-3" />
            +30kg gained since start
          </div>
        </div>

        {/* Progress statistics */}
        <div className="flex justify-between items-baseline pt-1">
          <div className="space-y-0.5">
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              Current
            </span>
            <span className="font-mono text-lg font-bold text-primary">190kg</span>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              Target
            </span>
            <span className="font-mono text-lg font-bold text-accent">200kg</span>
          </div>
        </div>

        {/* Custom Progress Bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden relative">
            {/* Start indicator line */}
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-text-placeholder">
            <span>Start: {startValue}kg</span>
            <span>{Math.round(progressPct)}% complete</span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default GoalsWidget
