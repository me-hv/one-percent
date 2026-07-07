"use client"

import { useMemo } from "react"
import { Check } from "lucide-react"
import { useBodyStore } from "@/features/body/store/body.store"
import { todayKey } from "@/lib/utils/date"
import { toast } from "sonner"

export function HabitsWidget() {
  const { habits, habitLogs, toggleHabitLog } = useBodyStore()
  const todayStr = todayKey()

  // Map habits with their current today completion status
  const currentHabits = useMemo(() => {
    return habits.filter(h => !h.archived).map((h) => {
      const log = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr)
      return {
        id: h.id,
        name: h.name,
        completed: log ? log.completed : false,
        count: log ? log.count : 0,
        target: h.targetCount,
        unit: h.unit,
      }
    })
  }, [habits, habitLogs, todayStr])

  const completedCount = currentHabits.filter((h) => h.completed).length

  const handleToggle = (habitId: string, name: string, currentlyCompleted: boolean) => {
    toggleHabitLog(habitId, todayStr)
    toast.success(currentlyCompleted ? `Unchecked "${name}"` : `Completed "${name}"!`)
  }

  return (
    <div className="card space-y-4">
      <div className="card-header">
        <span className="card-label">Daily habits</span>
        <span className="font-mono text-xs text-text-secondary">
          {completedCount}/{currentHabits.length} done
        </span>
      </div>

      <div className="space-y-2">
        {currentHabits.map((h) => (
          <div
            key={h.id}
            onClick={() => handleToggle(h.id, h.name, h.completed)}
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

            {h.target > 1 && (
              <span className="font-mono text-[10px] text-text-placeholder border border-border-subtle px-1.5 py-0.5 rounded bg-bg-base">
                {h.completed ? h.target : h.count}/{h.target} {h.unit}
              </span>
            )}
          </div>
        ))}

        {currentHabits.length === 0 && (
          <div className="text-center py-6 text-xs text-text-placeholder">
            No active habits. Create habits in settings to start tracking.
          </div>
        )}
      </div>
    </div>
  )
}
export default HabitsWidget
