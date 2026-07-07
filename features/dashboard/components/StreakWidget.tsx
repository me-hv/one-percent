"use client"

import { Flame, Calendar } from "lucide-react"

export function StreakWidget() {
  return (
    <div className="card flex flex-col justify-between">
      <div className="card-header">
        <span className="card-label">Consistency</span>
        <Flame className="h-4 w-4 text-accent" />
      </div>

      <div className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold text-primary tracking-tight">
            14
          </span>
          <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">
            days active
          </span>
        </div>

        {/* Small weekly log indicators */}
        <div className="grid grid-cols-7 gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
            const completed = idx < 6 // Completed Mon-Sat, Sunday not yet
            const isToday = idx === 6 // Today is Sunday

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div
                  className={`h-7 w-full rounded flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-150 ${
                    completed
                      ? "bg-accent/10 border border-accent/30 text-accent"
                      : isToday
                        ? "bg-bg-elevated border border-border-strong text-primary animate-pulse"
                        : "bg-bg-base border border-border-subtle text-text-disabled"
                  }`}
                >
                  {day}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
export default StreakWidget
