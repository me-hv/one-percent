"use client"

import { useMemo } from "react"
import { Dumbbell, Plus, Play } from "lucide-react"
import Link from "next/link"
import { ROUTES } from "@/lib/constants/ROUTES"
import { useWorkoutStore } from "@/lib/store/workout.store"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { useAuthStore } from "@/lib/store/auth.store"
import { useRouter } from "next/navigation"
import { startOfWeek, endOfWeek, isSameDay, getDay, today, todayKey } from "@/lib/utils/date"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function TrainingWidget() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { startWorkout, activeSession } = useWorkoutStore()
  const { programs } = useProgramsStore()
  const { data: history } = useWorkoutHistory(user?.uid ?? "")

  const activeProgram = useMemo(() => {
    return programs.find((p) => p.isActive && !p.isArchived)
  }, [programs])

  // Calculate target frequency (days/week)
  const targetSessions = activeProgram?.daysPerWeek ?? 3

  // Get completed sessions in the current week
  const currentWeekSessions = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday start
    const end = endOfWeek(new Date(), { weekStartsOn: 1 })
    const logs = history || []
    
    return logs.filter((s) => {
      const d = s.completedAt?.toDate?.() ? s.completedAt.toDate() : new Date()
      return d >= start && d <= end
    })
  }, [history])

  const completedCount = currentWeekSessions.length

  // Construct 7 days status indicator
  const weeklyDaysStatus = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
    const todayDate = today()
    const logs = history || []

    return DAY_LABELS.map((label, idx) => {
      // get the date for this index
      const date = new Date(monday)
      date.setDate(monday.getDate() + idx)
      const dateStr = date.toDateString()

      const completedSession = logs.find((s) => {
        const sd = s.completedAt?.toDate?.() ? s.completedAt.toDate() : null
        return sd && sd.toDateString() === dateStr
      })

      let status: "completed" | "active" | "rest" | "scheduled" = "rest"
      
      if (completedSession) {
        status = "completed"
      } else if (isSameDay(date, todayDate)) {
        status = activeSession ? "active" : "scheduled"
      }

      return {
        label,
        status,
        name: completedSession?.name || (status === "active" ? activeSession?.name : undefined),
      }
    })
  }, [history, activeSession])

  const handleStartWorkout = () => {
    if (activeSession) {
      router.push(ROUTES.training.log)
      return
    }

    // Default to active program day if available
    let name = "Custom Session"
    if (activeProgram && activeProgram.days.length > 0) {
      const nextDay = activeProgram.days.find((d) => !d.isRestDay)
      if (nextDay) name = nextDay.name
    }
    
    startWorkout(name, activeProgram?.id)
    router.push(ROUTES.training.log)
  }

  return (
    <div className="card space-y-4">
      <div className="card-header">
        <span className="card-label">Training weekly load</span>
        <Dumbbell className="h-4 w-4 text-text-placeholder" />
      </div>

      <div className="space-y-4">
        {/* Weekly frequency target display */}
        <div className="flex justify-between items-baseline">
          <div className="space-y-1">
            <span className="font-mono text-3xl font-bold text-primary tracking-tight">
              {completedCount}
            </span>
            <span className="text-xs text-text-secondary ml-1.5">/ {targetSessions} sessions done</span>
          </div>
          <span className="text-[10px] font-mono text-text-placeholder">
            {activeProgram ? activeProgram.name : "No active program"}
          </span>
        </div>

        {/* Small calendar-like bar indicators */}
        <div className="flex gap-2">
          {weeklyDaysStatus.map((day, idx) => {
            const completed = day.status === "completed"
            const active = day.status === "active"
            const scheduled = day.status === "scheduled"

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-2 w-full rounded-sm transition-all duration-150 ${
                    completed
                      ? "bg-accent"
                      : active
                        ? "bg-accent/40 animate-pulse"
                        : scheduled
                          ? "bg-blue-500/30 border border-blue-500/50"
                          : "bg-bg-elevated border border-border-subtle"
                  }`}
                  title={day.name || (active ? "Active Session" : "Rest day")}
                />
                <span className="text-[9px] font-mono text-text-placeholder">{day.label}</span>
              </div>
            )
          })}
        </div>

        {/* Fast CTA Button to start workout */}
        <button
          onClick={handleStartWorkout}
          className="w-full h-9 rounded-md bg-accent text-bg-base font-semibold hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-150 flex items-center justify-center gap-1.5 text-xs"
        >
          {activeSession ? (
            <>
              <Play className="h-3.5 w-3.5 fill-bg-base" /> Resume Active Workout
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" /> Start Workout Session
            </>
          )}
        </button>
      </div>
    </div>
  )
}
export default TrainingWidget
