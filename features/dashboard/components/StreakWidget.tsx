"use client"

import { useMemo } from "react"
import { Flame } from "lucide-react"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { useBodyStore } from "@/features/body/store/body.store"
import { useAuthStore } from "@/lib/store/auth.store"
import { startOfWeek, subDays, formatDateKey, isSameDay } from "@/lib/utils/date"

export function StreakWidget() {
  const { user } = useAuthStore()
  const { data: history } = useWorkoutHistory(user?.uid ?? "")
  const { habitLogs } = useBodyStore()

  // Calculate consistency activity streak
  const streakInfo = useMemo(() => {
    const workouts = history || []
    
    // Set of active dates
    const activeDates = new Set<string>()
    
    workouts.forEach((w) => {
      const d = w.completedAt?.toDate?.() ? w.completedAt.toDate() : new Date()
      activeDates.add(formatDateKey(d))
    })

    habitLogs.forEach((l) => {
      if (l.completed) {
        activeDates.add(l.date)
      }
    })

    let streak = 0
    let tempDate = new Date()
    let broken = false

    // Check last 60 days
    for (let i = 0; i < 60; i++) {
      const dateStr = formatDateKey(tempDate)
      if (activeDates.has(dateStr)) {
        streak++
      } else {
        // If today is empty, we don't break the streak immediately;
        // but if yesterday is also empty, we stop.
        if (i === 0) {
          // Check yesterday
          const yesterdayStr = formatDateKey(subDays(new Date(), 1))
          if (!activeDates.has(yesterdayStr)) {
            broken = true
            break
          }
        } else {
          broken = true
          break
        }
      }
      tempDate = subDays(tempDate, 1)
    }

    return {
      streak,
      activeDates,
    }
  }, [history, habitLogs])

  // Week indicators Mon-Sun
  const weeklyIndicators = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
    const days = ["M", "T", "W", "T", "F", "S", "S"]
    const todayStr = formatDateKey(new Date())

    return days.map((day, idx) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + idx)
      const dateStr = formatDateKey(date)

      const completed = streakInfo.activeDates.has(dateStr)
      const isToday = dateStr === todayStr

      return {
        day,
        completed,
        isToday,
      }
    })
  }, [streakInfo])

  return (
    <div className="card flex flex-col justify-between">
      <div className="card-header">
        <span className="card-label">Consistency</span>
        <Flame className="h-4 w-4 text-accent" />
      </div>

      <div className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold text-primary tracking-tight">
            {streakInfo.streak}
          </span>
          <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">
            days active
          </span>
        </div>

        {/* Small weekly log indicators */}
        <div className="grid grid-cols-7 gap-1">
          {weeklyIndicators.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <div
                className={`h-7 w-full rounded flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-150 ${
                  item.completed
                    ? "bg-accent/15 border border-accent/35 text-accent"
                    : item.isToday
                      ? "bg-bg-elevated border border-border-strong text-primary animate-pulse"
                      : "bg-bg-base border border-border-subtle text-text-disabled"
                }`}
                title={item.completed ? "Active day" : item.isToday ? "Today" : "Inactive"}
              >
                {item.day}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default StreakWidget
