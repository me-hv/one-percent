"use client"

import { useState, useMemo } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Dumbbell, Clock, Flame } from "lucide-react"
import { formatDateKey, formatDateCompact, startOfWeek, endOfWeek, subDays } from "@/lib/utils/date"
import type { WorkoutSession } from "@/lib/types/training.types"
import { cn } from "@/lib/utils/cn"

interface TrainingCalendarProps {
  sessions: WorkoutSession[]
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function TrainingCalendar({ sessions }: TrainingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDaySessions, setSelectedDaySessions] = useState<WorkoutSession[] | null>(null)

  // Map completed sessions by date string (YYYY-MM-DD)
  const sessionsByDate = useMemo(() => {
    const map: Record<string, WorkoutSession[]> = {}
    sessions
      .filter((s) => s.status === "completed")
      .forEach((s) => {
        const d = s.completedAt?.toDate?.() ? s.completedAt.toDate() : new Date()
        const key = formatDateKey(d)
        if (!map[key]) map[key] = []
        map[key].push(s)
      })
    return map
  }, [sessions])

  // Generate 35 calendar cells (5 weeks) around currentDate
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // First day of current month
    const firstOfMonth = new Date(year, month, 1)
    // Find Monday on or before firstOfMonth
    const dayOfWeek = firstOfMonth.getDay()
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const startCalendar = new Date(firstOfMonth)
    startCalendar.setDate(firstOfMonth.getDate() + diffToMon)

    const grid = []
    const temp = new Date(startCalendar)

    for (let i = 0; i < 35; i++) {
      const dateStr = formatDateKey(temp)
      const isCurrentMonth = temp.getMonth() === month
      const isToday = dateStr === formatDateKey(new Date())
      const daySessions = sessionsByDate[dateStr] || []
      const totalVol = daySessions.reduce((acc, s) => acc + s.totalVolume, 0)

      grid.push({
        date: new Date(temp),
        dateStr,
        dayNum: temp.getDate(),
        isCurrentMonth,
        isToday,
        sessions: daySessions,
        totalVolume: totalVol,
      })
      temp.setDate(temp.getDate() + 1)
    }

    return grid
  }, [currentDate, sessionsByDate])

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <div className="card p-5 space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">
            {monthLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 py-0.5 rounded text-[10px] font-mono border border-border-subtle text-text-muted hover:text-primary transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekdays row */}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-text-placeholder uppercase">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarGrid.map((cell) => {
          const hasWorkout = cell.sessions.length > 0
          return (
            <button
              key={cell.dateStr}
              onClick={() => hasWorkout && setSelectedDaySessions(cell.sessions)}
              disabled={!hasWorkout}
              className={cn(
                "h-14 p-1 rounded-lg border flex flex-col justify-between items-start transition-all relative text-left",
                cell.isToday && "ring-1 ring-accent",
                !cell.isCurrentMonth && "opacity-40",
                hasWorkout
                  ? "border-accent/40 bg-accent/10 hover:bg-accent/20 cursor-pointer"
                  : "border-border-subtle/50 bg-bg-base/20"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-mono font-semibold",
                  cell.isToday ? "text-accent" : cell.isCurrentMonth ? "text-text-primary" : "text-text-muted"
                )}
              >
                {cell.dayNum}
              </span>

              {hasWorkout && (
                <div className="w-full space-y-0.5 overflow-hidden">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-[9px] font-mono font-bold text-accent truncate">
                      {cell.sessions[0]?.name || "Workout"}
                    </span>
                  </div>
                  {cell.totalVolume > 0 && (
                    <span className="text-[8px] font-mono text-text-muted block">
                      {(cell.totalVolume / 1000).toFixed(1)}k kg
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Day Session Detail Modal */}
      {selectedDaySessions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md card p-5 space-y-4 border border-accent/30 bg-bg-surface shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-border-subtle pb-2">
              <span className="text-xs font-semibold text-accent uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4" /> Completed Sessions
              </span>
              <button
                onClick={() => setSelectedDaySessions(null)}
                className="text-xs text-text-placeholder hover:text-primary font-mono"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDaySessions.map((s) => (
                <div key={s.id} className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-primary">{s.name}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">
                      {s.totalVolume.toLocaleString()} kg
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-text-placeholder" />
                      {Math.round((s.durationSeconds || 0) / 60)} mins
                    </span>
                    <span>{s.exercises?.length || 0} exercises</span>
                    <span>{s.totalSets} sets</span>
                  </div>

                  {s.exercises && s.exercises.length > 0 && (
                    <div className="pt-2 border-t border-border-subtle/50 space-y-1">
                      <span className="text-[9px] font-mono text-text-placeholder uppercase tracking-wider block">Exercises Logged</span>
                      <div className="flex flex-wrap gap-1">
                        {s.exercises.map((se) => (
                          <span key={se.id} className="text-[10px] rounded bg-bg-elevated/40 px-2 py-0.5 text-text-secondary">
                            {se.exercise?.name || "Exercise"} ({se.sets?.length || 0} sets)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
