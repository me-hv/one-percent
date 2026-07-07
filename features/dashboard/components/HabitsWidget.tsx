"use client"

import { useState } from "react"
import { CheckSquare, Check } from "lucide-react"

export function HabitsWidget() {
  const [habits, setHabits] = useState([
    { id: "h1", name: "10 min mobility flow", completed: true },
    { id: "h2", name: "Drink 4L Water", completed: false, count: 3, target: 8, unit: "cups" },
    { id: "h3", name: "Log all food intake", completed: true },
    { id: "h4", name: "8h Sleep time", completed: false },
  ])

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h
        if (h.count !== undefined && h.target !== undefined) {
          const nextCount = h.count >= h.target ? 0 : h.count + 1
          return {
            ...h,
            count: nextCount,
            completed: nextCount >= h.target,
          }
        }
        return { ...h, completed: !h.completed }
      }),
    )
  }

  const completedCount = habits.filter((h) => h.completed).length

  return (
    <div className="card space-y-4">
      <div className="card-header">
        <span className="card-label">Daily habits</span>
        <span className="font-mono text-xs text-text-secondary">
          {completedCount}/{habits.length} done
        </span>
      </div>

      <div className="space-y-2">
        {habits.map((h) => (
          <div
            key={h.id}
            onClick={() => toggleHabit(h.id)}
            className="flex items-center justify-between p-2.5 rounded border border-border-subtle bg-bg-base/30 hover:bg-bg-elevated/50 transition-colors duration-150 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              {/* Custom checkbox */}
              <div
                className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all duration-150 ${
                  h.completed
                    ? "bg-accent/15 border-accent text-accent"
                    : "border-border-default bg-transparent group-hover:border-border-strong"
                }`}
              >
                {h.completed && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-150 ${
                  h.completed ? "text-text-placeholder line-through" : "text-primary"
                }`}
              >
                {h.name}
              </span>
            </div>

            {h.count !== undefined && (
              <span className="font-mono text-[10px] text-text-placeholder border border-border-subtle px-1.5 py-0.5 rounded bg-bg-base">
                {h.count}/{h.target} {h.unit}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
export default HabitsWidget
