"use client"

import { cn } from "@/lib/utils/cn"
import { Moon, Dumbbell, MoreHorizontal } from "lucide-react"
import type { TrainingProgram, ProgramDay } from "@/lib/types/training.types"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { useState } from "react"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface Props {
  program: TrainingProgram
}

export function WeeklySchedule({ program }: Props) {
  const { updateDay } = useProgramsStore()

  // For drag-over target indication
  const [dragOverDow, setDragOverDow] = useState<number | null>(null)
  const [draggingDayId, setDraggingDayId] = useState<string | null>(null)

  const daysByDow: Record<number, ProgramDay[]> = {}
  for (let i = 0; i < 7; i++) daysByDow[i] = []
  program.days.forEach((d) => {
    if (d.dayOfWeek != null) {
      daysByDow[d.dayOfWeek]?.push(d)
    }
  })

  // Unscheduled days (no dayOfWeek assigned)
  const unscheduled = program.days.filter((d) => d.dayOfWeek == null)

  const handleDragStart = (dayId: string) => {
    setDraggingDayId(dayId)
  }

  const handleDropOnDow = (dow: number) => {
    if (!draggingDayId) return
    updateDay(program.id, draggingDayId, { dayOfWeek: dow })
    setDragOverDow(null)
    setDraggingDayId(null)
  }

  const handleDropOnUnscheduled = () => {
    if (!draggingDayId) return
    updateDay(program.id, draggingDayId, { dayOfWeek: undefined })
    setDragOverDow(null)
    setDraggingDayId(null)
  }

  const { copyWeek, clearWeek, duplicateDay, removeDay } = useProgramsStore()

  return (
    <div className="space-y-6">
      {/* Schedule Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg-base/30 p-3.5 rounded-xl border border-border-subtle/60">
        <div>
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            Weekly Schedule Planner
          </h4>
          <p className="text-[11px] text-text-muted">
            Drag and drop workout days onto weekdays, or use quick controls to plan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyWeek(program.id)}
            className="rounded-lg border border-border-subtle/80 bg-bg-surface px-2.5 py-1 text-xs font-semibold text-text-muted hover:text-text-primary hover:border-border-subtle transition-colors"
          >
            Duplicate Week
          </button>
          <button
            onClick={() => clearWeek(program.id)}
            className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            Clear Week
          </button>
        </div>
      </div>

      {/* Weekly grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {DAY_LABELS.map((label, dow) => {
          const scheduledDays = daysByDow[dow] ?? []
          const isOver = dragOverDow === dow

          return (
            <div
              key={dow}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverDow(dow)
              }}
              onDragLeave={() => setDragOverDow(null)}
              onDrop={() => handleDropOnDow(dow)}
              className={cn(
                "rounded-xl border min-h-[140px] p-2.5 flex flex-col gap-2 transition-all",
                isOver
                  ? "border-accent-cyan bg-accent-cyan/10"
                  : "border-border-subtle/80 bg-bg-surface/50 hover:bg-bg-surface"
              )}
            >
              <div className="flex items-center justify-between border-b border-border-subtle/40 pb-1">
                <span className="text-[10px] font-mono text-text-muted font-bold uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-[10px] font-mono text-text-placeholder">
                  Day {dow + 1}
                </span>
              </div>

              {scheduledDays.map((day) => (
                <div
                  key={day.id}
                  draggable
                  onDragStart={() => handleDragStart(day.id)}
                  className={cn(
                    "group relative rounded-lg border p-2 cursor-grab active:cursor-grabbing transition-all space-y-1",
                    day.isRestDay
                      ? "border-border-subtle/50 bg-bg-base/40 text-text-muted"
                      : "border-accent-gold/30 bg-accent-gold/10 text-text-primary"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {day.isRestDay ? (
                        <Moon className="h-3.5 w-3.5 text-text-placeholder shrink-0" />
                      ) : (
                        <Dumbbell className="h-3.5 w-3.5 text-accent-gold shrink-0" />
                      )}
                      <span className="text-xs font-semibold truncate">{day.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => duplicateDay(program.id, day.id)}
                        className="text-text-placeholder hover:text-text-primary"
                        title="Duplicate Day"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {!day.isRestDay && (
                    <div className="text-[10px] text-text-muted">
                      {day.exercises?.length || 0} exercises
                    </div>
                  )}
                </div>
              ))}

              {scheduledDays.length === 0 && (
                <div
                  className={cn(
                    "flex-1 rounded-lg border-dashed border flex items-center justify-center text-[10px] font-mono transition-colors",
                    isOver ? "border-accent-cyan text-accent-cyan" : "border-border-subtle/40 text-text-placeholder"
                  )}
                >
                  {isOver ? "Drop here" : "Rest Day"}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Unscheduled days */}
      {unscheduled.length > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOverDow(-1)
          }}
          onDragLeave={() => setDragOverDow(null)}
          onDrop={handleDropOnUnscheduled}
          className={cn(
            "rounded-xl border p-4 space-y-3 transition-colors",
            dragOverDow === -1 ? "border-accent-cyan bg-accent-cyan/10" : "border-border-subtle/60 bg-bg-surface/30"
          )}
        >
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold">
            Unscheduled Workout Days ({unscheduled.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((day) => (
              <div
                key={day.id}
                draggable
                onDragStart={() => handleDragStart(day.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing text-xs font-semibold transition-all",
                  day.isRestDay
                    ? "border-border-subtle bg-bg-base/40 text-text-muted"
                    : "border-accent-gold/40 bg-accent-gold/10 text-text-primary hover:border-accent-gold"
                )}
              >
                {day.isRestDay ? (
                  <Moon className="h-3.5 w-3.5 text-text-placeholder" />
                ) : (
                  <Dumbbell className="h-3.5 w-3.5 text-accent-gold" />
                )}
                {day.name}
              </div>
            ))}
          </div>
          {dragOverDow === -1 && (
            <p className="text-[10px] text-accent-cyan font-mono">Drop here to unschedule</p>
          )}
        </div>
      )}
    </div>
  )
}
