"use client"

import { Moon, TrendingUp } from "lucide-react"

export function RecoveryWidget() {
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
              88
            </span>
            <span className="text-xs text-text-secondary ml-1.5">/ 100 (Optimal)</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
            <TrendingUp className="h-3 w-3" />
            +12% vs. baseline
          </div>
        </div>

        {/* Small stats rows */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle">
          <div className="text-left">
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              HRV
            </span>
            <span className="font-mono text-sm font-semibold text-primary block mt-0.5">
              74ms
            </span>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              Resting HR
            </span>
            <span className="font-mono text-sm font-semibold text-primary block mt-0.5">
              52bpm
            </span>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              Asleep
            </span>
            <span className="font-mono text-sm font-semibold text-primary block mt-0.5">
              7h 45m
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default RecoveryWidget
