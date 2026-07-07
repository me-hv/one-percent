"use client"

import { useState } from "react"
import {
  ChevronDown,
  Trash2,
  Bookmark,
  Shuffle,
  EyeOff,
  ClipboardList,
  Flame,
  CheckCircle2,
} from "lucide-react"
import type { SessionExercise, WorkoutSet, Exercise } from "@/lib/types/training.types"
import { useWorkoutStore } from "@/lib/store/workout.store"
import { SetLogger } from "./SetLogger"
import { useRestTimerStore } from "../store/restTimer.store"
import { cn } from "@/lib/utils/cn"

interface ExerciseCardProps {
  sessionExercise: SessionExercise
  onReplaceClick: (sessionExerciseId: string) => void
}

export function ExerciseCard({ sessionExercise, onReplaceClick }: ExerciseCardProps) {
  const { id: seId, exercise, sets, notes, restSeconds } = sessionExercise
  const {
    updateSet,
    toggleSetComplete,
    addSet,
    removeSet,
    removeExercise,
    updateExerciseNotes,
  } = useWorkoutStore()

  const { startTimer } = useRestTimerStore()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showNotesField, setShowNotesField] = useState(!!notes)
  const [isSkipped, setIsSkipped] = useState(false)

  // ─── Set Completion Rest Timer Hook ───────────────────────────────
  const handleSetCompleted = () => {
    // Standard Rest interval is fetched from exercise configuration (defaults to 90s)
    const restSec = restSeconds || 90
    startTimer(restSec)
  }

  const completedSetsCount = sets.filter((s) => s.completed).length
  const totalSetsCount = sets.length

  if (isSkipped) {
    return (
      <div className="rounded-lg border border-border-subtle/50 bg-bg-base/10 p-4 flex items-center justify-between opacity-50 transition-opacity">
        <div className="flex items-center gap-2">
          <EyeOff className="h-4 w-4 text-text-placeholder" />
          <span className="text-xs font-semibold text-text-placeholder line-through">
            {exercise?.name || "Exercise"} (Skipped)
          </span>
        </div>
        <button
          onClick={() => setIsSkipped(false)}
          className="text-[10px] font-semibold text-accent hover:underline"
        >
          Undo Skip
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border-subtle bg-bg-surface overflow-hidden transition-all duration-200 shadow-sm",
        completedSetsCount === totalSetsCount && totalSetsCount > 0 && "border-accent/35"
      )}
    >
      {/* ─── Card Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 bg-bg-base/10 border-b border-border-subtle/30">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Completion check indicator */}
          <div
            className={cn(
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs",
              completedSetsCount === totalSetsCount && totalSetsCount > 0
                ? "bg-accent/15 border-accent text-accent"
                : "border-border-default text-text-placeholder"
            )}
          >
            {completedSetsCount === totalSetsCount && totalSetsCount > 0 ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <span className="font-mono font-bold text-[10px]">{completedSetsCount}/{totalSetsCount}</span>
            )}
          </div>

          <div className="text-left overflow-hidden">
            <h4 className="text-xs font-semibold text-primary truncate hover:text-accent cursor-pointer">
              {exercise?.name || "Exercise"}
            </h4>
            <div className="flex gap-2 items-center text-[9px] text-text-placeholder font-mono uppercase mt-0.5">
              <span>{exercise?.muscleGroups?.join(", ") || "custom"}</span>
              {sessionExercise.supersetGroupId && (
                <span className="text-info font-bold flex items-center gap-0.5 bg-info/10 border border-info/20 px-1 py-0.25 rounded-sm">
                  <Flame className="h-2.5 w-2.5" /> SUPERSET
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Header controls */}
        <div className="flex items-center gap-2">
          {/* Quick previous performance helper stub */}
          <div className="hidden sm:block text-right pr-2 border-r border-border-subtle/60 text-[10px] font-mono">
            <span className="text-text-placeholder block uppercase">Previous</span>
            <span className="text-primary font-semibold block mt-0.5">60kg × 8 reps</span>
          </div>

          {/* Action options triggers */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNotesField(!showNotesField)}
              className={cn(
                "rounded p-1 hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors",
                showNotesField && "text-accent"
              )}
              title="Add exercise notes"
            >
              <ClipboardList className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onReplaceClick(seId)}
              className="rounded p-1 hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors"
              title="Swap exercise"
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsSkipped(true)}
              className="rounded p-1 hover:bg-bg-elevated text-text-placeholder hover:text-warning transition-colors"
              title="Skip exercise"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => removeExercise(seId)}
              className="rounded p-1 hover:bg-bg-elevated text-text-placeholder hover:text-negative transition-colors"
              title="Delete exercise"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded p-1 hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors ml-1"
              aria-label="Collapse exercise details"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isCollapsed && "-rotate-90"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Card Content (Set Logger table) ─────────────────────────── */}
      {!isCollapsed && (
        <div className="p-4 space-y-4 animate-in fade-in duration-100">
          {/* Optional notes block */}
          {showNotesField && (
            <div className="space-y-1">
              <label className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase block">
                Exercise Notes / Pain Check
              </label>
              <textarea
                placeholder="Include pain levels, setup adjustments, tempo details..."
                value={notes || ""}
                onChange={(e) => updateExerciseNotes(seId, e.target.value)}
                className="w-full h-12 p-2 rounded border border-border-subtle bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none resize-none"
              />
            </div>
          )}

          {/* Table logging sheet */}
          <SetLogger
            sessionExerciseId={seId}
            sets={sets}
            updateSet={updateSet}
            toggleSetComplete={toggleSetComplete}
            addSet={addSet}
            removeSet={removeSet}
            onSetCompletedChange={handleSetCompleted}
          />
        </div>
      )}
    </div>
  )
}
export default ExerciseCard
