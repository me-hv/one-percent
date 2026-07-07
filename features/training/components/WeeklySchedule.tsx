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

  return (
    <div className="space-y-6">
      <p className="text-xs text-text-secondary">
        Drag and drop workout days onto the calendar to schedule your week.
      </p>

      {/* Weekly grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((label, dow) => {
          const scheduledDays = daysByDow[dow] ?? []
          const isOver = dragOverDow === dow

          return (
            <div
              key={dow}
              onDragOver={(e) => { e.preventDefault(); setDragOverDow(dow) }}
              onDragLeave={() => setDragOverDow(null)}
              onDrop={() => handleDropOnDow(dow)}
              className={cn(
                "rounded-xl border min-h-[120px] p-2 flex flex-col gap-1.5 transition-colors",
                isOver
                  ? "border-accent bg-accent/5"
                  : "border-border-subtle bg-bg-surface"
              )}
            >
              <span className="text-[9px] font-mono text-text-placeholder uppercase tracking-wider text-center block">
                {label}
              </span>

              {scheduledDays.map((day) => (
                <div
                  key={day.id}
                  draggable
                  onDragStart={() => handleDragStart(day.id)}
                  className={cn(
                    "rounded-lg border px-1.5 py-1 cursor-grab active:cursor-grabbing transition-colors text-center",
                    day.isRestDay
                      ? "border-border-subtle bg-bg-elevated text-text-placeholder"
                      : "border-accent/25 bg-accent/10 text-accent"
                  )}
                >
                  <div className="flex justify-center mb-0.5">
                    {day.isRestDay ? <Moon className="h-3 w-3" /> : <Dumbbell className="h-3 w-3" />}
                  </div>
                  <span className="text-[9px] font-medium line-clamp-2 leading-tight">{day.name}</span>
                </div>
              ))}

              {scheduledDays.length === 0 && (
                <div className={cn(
                  "flex-1 rounded-lg border-dashed border flex items-center justify-center text-[9px] text-text-placeholder transition-colors",
                  isOver ? "border-accent text-accent" : "border-border-subtle"
                )}>
                  {isOver ? "Drop here" : "—"}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Unscheduled days */}
      {unscheduled.length > 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOverDow(-1) }}
          onDragLeave={() => setDragOverDow(null)}
          onDrop={handleDropOnUnscheduled}
          className={cn(
            "rounded-xl border p-4 space-y-2 transition-colors",
            dragOverDow === -1 ? "border-accent bg-accent/5" : "border-border-subtle bg-bg-surface"
          )}
        >
          <span className="text-[10px] font-mono text-text-placeholder uppercase tracking-wider">
            Unscheduled Days
          </span>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((day) => (
              <div
                key={day.id}
                draggable
                onDragStart={() => handleDragStart(day.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing text-xs font-medium",
                  day.isRestDay
                    ? "border-border-subtle bg-bg-elevated text-text-secondary"
                    : "border-border-default bg-bg-elevated text-primary"
                )}
              >
                {day.isRestDay ? <Moon className="h-3 w-3" /> : <Dumbbell className="h-3 w-3" />}
                {day.name}
              </div>
            ))}
          </div>
          {dragOverDow === -1 && (
            <p className="text-[10px] text-accent font-mono">Drop here to unschedule</p>
          )}
        </div>
      )}
    </div>
  )
}
