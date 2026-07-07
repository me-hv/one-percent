"use client"

import { Trash2, Copy, Plus } from "lucide-react"
import type { WorkoutSet, SetType } from "@/lib/types/training.types"
import { cn } from "@/lib/utils/cn"
import React, { useRef } from "react"

interface SetLoggerProps {
  sessionExerciseId: string
  sets: WorkoutSet[]
  updateSet: (sessionExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void
  toggleSetComplete: (sessionExerciseId: string, setId: string) => void
  addSet: (sessionExerciseId: string, type?: WorkoutSet["type"]) => void
  removeSet: (sessionExerciseId: string, setId: string) => void
  onSetCompletedChange?: () => void
}

export function SetLogger({
  sessionExerciseId,
  sets,
  updateSet,
  toggleSetComplete,
  addSet,
  removeSet,
  onSetCompletedChange,
}: SetLoggerProps) {
  const containerRef = useRef<HTMLTableSectionElement>(null)

  // ─── Keyboard Navigation Handlers ───────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, rowIndex: number, colIndex: number) => {
    const tableBody = containerRef.current
    if (!tableBody) return

    let nextRow = rowIndex
    let nextCol = colIndex

    switch (e.key) {
      case "ArrowUp":
        nextRow = rowIndex - 1
        e.preventDefault()
        break
      case "ArrowDown":
        nextRow = rowIndex + 1
        e.preventDefault()
        break
      case "ArrowLeft":
        nextCol = colIndex - 1
        // Only navigate left if cursor is at start of text input
        const target = e.currentTarget as HTMLInputElement
        if (target.selectionStart !== 0) return
        e.preventDefault()
        break
      case "ArrowRight":
        nextCol = colIndex + 1
        // Only navigate right if cursor is at end of text input
        const targetInput = e.currentTarget as HTMLInputElement
        if (targetInput.selectionStart !== targetInput.value.length) return
        e.preventDefault()
        break
      case "Enter":
        e.preventDefault()
        const currentSet = sets[rowIndex]
        if (currentSet) {
          // Enter toggles completion state of set
          toggleSetComplete(sessionExerciseId, currentSet.id)
          if (onSetCompletedChange && !currentSet.completed) {
            onSetCompletedChange()
          }
          // Move focus to next row's weight input if available
          nextRow = rowIndex + 1
          nextCol = 1 // focus weight
        }
        break
      default:
        return // Let normal keypress through
    }

    // Attempt to locate and focus target cell
    const targetElement = tableBody.querySelector(
      `[data-row="${nextRow}"][data-col="${nextCol}"]`
    ) as HTMLInputElement | HTMLSelectElement | null

    if (targetElement) {
      targetElement.focus()
      if (targetElement instanceof HTMLInputElement && targetElement.type === "number") {
        targetElement.select() // auto-select numeric content
      }
    }
  }

  const handleDuplicateSet = (rowIndex: number) => {
    const set = sets[rowIndex]
    if (!set) return
    
    // Add set first
    addSet(sessionExerciseId, set.type)
    
    // Wait for state updates, find the new last set, and prefill with matching values
    setTimeout(() => {
      const updatedSession = useWorkoutStore.getState().activeSession
      const targetExercise = updatedSession?.exercises.find((se) => se.id === sessionExerciseId)
      if (targetExercise && targetExercise.sets.length > 0) {
        const last = targetExercise.sets[targetExercise.sets.length - 1]!
        updateSet(sessionExerciseId, last.id, {
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
          notes: set.notes,
        })
      }
    }, 50)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-border-subtle font-mono text-text-placeholder text-[10px] uppercase">
            <th className="py-2 w-12 text-center">Set</th>
            <th className="py-2 w-28">Type</th>
            <th className="py-2 w-24">Weight (kg)</th>
            <th className="py-2 w-20">Reps</th>
            <th className="py-2 w-20">RPE</th>
            <th className="py-2 min-w-[120px]">Notes</th>
            <th className="py-2 w-12 text-center">Done</th>
            <th className="py-2 w-16 text-right">Actions</th>
          </tr>
        </thead>
        <tbody ref={containerRef}>
          {sets.map((set, rIdx) => (
            <tr
              key={set.id}
              className={cn(
                "border-b border-border-subtle/50 transition-colors duration-150 hover:bg-bg-elevated/10",
                set.completed && "bg-accent/5"
              )}
            >
              {/* Set number */}
              <td className="py-2 text-center font-mono font-medium text-text-secondary">
                {rIdx + 1}
              </td>

              {/* Set Type selection */}
              <td className="py-1">
                <select
                  value={set.type}
                  data-row={rIdx}
                  data-col={0}
                  onKeyDown={(e) => handleKeyDown(e, rIdx, 0)}
                  onChange={(e) =>
                    updateSet(sessionExerciseId, set.id, {
                      type: e.target.value as SetType,
                      isWarmup: e.target.value === "warmup",
                      isDropset: e.target.value === "dropset",
                    })
                  }
                  className="bg-transparent text-primary outline-none font-medium hover:border-border-subtle border border-transparent rounded px-1.5 py-0.5 text-xs transition-all duration-100"
                >
                  <option value="normal" className="bg-bg-surface">Normal</option>
                  <option value="warmup" className="bg-bg-surface">Warmup</option>
                  <option value="dropset" className="bg-bg-surface">Dropset</option>
                  <option value="failure" className="bg-bg-surface">Failure</option>
                  <option value="amrap" className="bg-bg-surface">AMRAP</option>
                </select>
              </td>

              {/* Weight Input */}
              <td className="py-1">
                <input
                  type="number"
                  value={set.weight ?? ""}
                  data-row={rIdx}
                  data-col={1}
                  onKeyDown={(e) => handleKeyDown(e, rIdx, 1)}
                  onChange={(e) =>
                    updateSet(sessionExerciseId, set.id, {
                      weight: parseFloat(e.target.value) || 0,
                    })
                  }
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className="w-16 bg-transparent text-primary outline-none border border-transparent focus:border-border-strong rounded px-1.5 py-0.5 font-mono text-xs transition-all duration-100"
                />
              </td>

              {/* Reps Input */}
              <td className="py-1">
                <input
                  type="number"
                  value={set.reps ?? ""}
                  data-row={rIdx}
                  data-col={2}
                  onKeyDown={(e) => handleKeyDown(e, rIdx, 2)}
                  onChange={(e) =>
                    updateSet(sessionExerciseId, set.id, {
                      reps: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className="w-12 bg-transparent text-primary outline-none border border-transparent focus:border-border-strong rounded px-1.5 py-0.5 font-mono text-xs transition-all duration-100"
                />
              </td>

              {/* RPE Input */}
              <td className="py-1">
                <input
                  type="number"
                  value={set.rpe ?? ""}
                  data-row={rIdx}
                  data-col={3}
                  min={1}
                  max={10}
                  onKeyDown={(e) => handleKeyDown(e, rIdx, 3)}
                  onChange={(e) =>
                    updateSet(sessionExerciseId, set.id, {
                      rpe: Math.min(10, Math.max(1, parseInt(e.target.value, 10))) || undefined,
                    })
                  }
                  onFocus={(e) => e.target.select()}
                  placeholder="—"
                  className="w-10 bg-transparent text-primary outline-none border border-transparent focus:border-border-strong rounded px-1.5 py-0.5 font-mono text-xs transition-all duration-100"
                />
              </td>

              {/* Notes Input */}
              <td className="py-1">
                <input
                  type="text"
                  value={set.notes ?? ""}
                  data-row={rIdx}
                  data-col={4}
                  onKeyDown={(e) => handleKeyDown(e, rIdx, 4)}
                  onChange={(e) =>
                    updateSet(sessionExerciseId, set.id, {
                      notes: e.target.value,
                    })
                  }
                  placeholder="Set details..."
                  className="w-full bg-transparent text-primary outline-none border border-transparent focus:border-border-strong rounded px-1.5 py-0.5 text-xs transition-all duration-100"
                />
              </td>

              {/* Check Completed Toggle */}
              <td className="py-1 text-center">
                <button
                  onClick={() => {
                    toggleSetComplete(sessionExerciseId, set.id)
                    if (onSetCompletedChange && !set.completed) {
                      onSetCompletedChange()
                    }
                  }}
                  className={cn(
                    "mx-auto h-5 w-5 rounded border flex items-center justify-center transition-all duration-150",
                    set.completed
                      ? "bg-accent border-accent text-bg-base"
                      : "border-border-default hover:border-border-strong text-transparent"
                  )}
                  aria-label={`Mark set ${rIdx + 1} complete`}
                >
                  <span className="text-[10px] font-bold">✓</span>
                </button>
              </td>

              {/* Action Buttons */}
              <td className="py-1 text-right space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleDuplicateSet(rIdx)}
                  className="inline-flex items-center justify-center p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors duration-100"
                  title="Duplicate set values"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSet(sessionExerciseId, set.id)}
                  disabled={sets.length === 1}
                  className="inline-flex items-center justify-center p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-negative disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-100"
                  title="Delete set"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Quick Add Row CTA */}
      <button
        onClick={() => addSet(sessionExerciseId, "normal")}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Add Set Row
      </button>
    </div>
  )
}

// Named import check wrapper to prevent store retrieval crashes
import { useWorkoutStore } from "@/lib/store/workout.store"
