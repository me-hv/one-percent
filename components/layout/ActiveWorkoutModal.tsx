"use client"

import { useUIStore } from "@/lib/store/ui.store"
import { useWorkoutStore } from "@/lib/store/workout.store"
import { formatDurationShort } from "@/lib/utils/format"
import {
  X,
  Plus,
  Trash2,
  Minimize2,
  Check,
  Dumbbell,
  Play,
  Pause,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useState } from "react"
import { toast } from "sonner"
import type { WorkoutSession, WorkoutSet, Exercise, SessionExercise } from "@/lib/types/training.types"

export function ActiveWorkoutModal() {
  const { activeWorkoutModalOpen, setActiveWorkoutModalOpen } = useUIStore()
  const {
    activeSession,
    timerSeconds,
    isPaused,
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
    removeExercise,
    updateSessionNotes,
    updateExerciseNotes,
    togglePause,
    cancelWorkout,
    completeWorkout,
  } = useWorkoutStore()

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  if (!activeSession || !activeWorkoutModalOpen) return null

  const handleComplete = () => {
    // Check if at least one set is completed
    const completedSetCount = activeSession.exercises.reduce(
      (acc, se) => acc + se.sets.filter((s) => s.completed).length,
      0,
    )

    if (completedSetCount === 0) {
      toast.error("Please complete at least one set before saving.")
      return
    }

    const completedSession = completeWorkout()
    if (completedSession) {
      toast.success("Workout session saved successfully!")
      setActiveWorkoutModalOpen(false)
    }
  }

  const handleCancel = () => {
    cancelWorkout()
    setShowCancelConfirm(false)
    setActiveWorkoutModalOpen(false)
    toast.success("Workout session discarded.")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/85 backdrop-blur-sm p-4">
      {/* ─── Modal Box ──────────────────────────────────────────────── */}
      <div className="flex h-[90dvh] w-full max-w-3xl flex-col rounded-xl border border-border-default bg-bg-surface shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-bg-base/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/10 border border-accent/20 text-accent">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary">
                {activeSession.name}
              </h2>
              <span className="font-mono text-xs text-text-placeholder">
                {formatDurationShort(timerSeconds)} elapsed
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePause}
              className="rounded p-1.5 hover:bg-bg-elevated text-text-secondary hover:text-primary transition-colors"
              aria-label={isPaused ? "Resume workout" : "Pause workout"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setActiveWorkoutModalOpen(false)}
              className="rounded p-1.5 hover:bg-bg-elevated text-text-secondary hover:text-primary transition-colors"
              aria-label="Minimize workout dashboard"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Main Content (Exercises list & inputs) ─────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Global Workout Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">
              Workout Notes
            </label>
            <textarea
              placeholder="Add general notes about today's energy levels, goals, etc."
              value={activeSession.notes || ""}
              onChange={(e) => updateSessionNotes(e.target.value)}
              className="w-full h-16 p-2 rounded border border-border-subtle bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none resize-none"
            />
          </div>

          {activeSession.exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <Dumbbell className="h-8 w-8 text-text-placeholder" />
              <p className="text-xs text-text-placeholder max-w-xs">
                No exercises added to this session yet. Tap the button below to
                select an exercise from your library.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeSession.exercises.map((se) => (
                <div
                  key={se.id}
                  className="rounded-lg border border-border-subtle bg-bg-base/30 p-4 space-y-4"
                >
                  {/* Exercise Title and Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-primary">
                        {se.exercise?.name || "Exercise"}
                      </h4>
                      <span className="text-[10px] text-text-placeholder capitalize">
                        {se.exercise?.category || "custom"} // {se.exercise?.equipment || "none"}
                      </span>
                    </div>
                    <button
                      onClick={() => removeExercise(se.id)}
                      className="rounded p-1 hover:bg-bg-elevated text-text-placeholder hover:text-negative transition-colors"
                      aria-label="Remove exercise"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Sets logging table */}
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle font-mono text-text-placeholder text-[10px] uppercase">
                        <th className="py-2 w-12 text-center">Set</th>
                        <th className="py-2 w-28">Type</th>
                        <th className="py-2 w-24">Weight (kg)</th>
                        <th className="py-2 w-20">Reps</th>
                        <th className="py-2 w-12 text-center">Done</th>
                        <th className="py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {se.sets.map((set, idx) => (
                        <tr
                          key={set.id}
                          className={cn(
                            "border-b border-border-subtle/50 transition-colors",
                            set.completed && "bg-accent/5",
                          )}
                        >
                          <td className="py-2 text-center font-mono font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-1">
                            <select
                              value={set.type}
                              onChange={(e) =>
                                updateSet(se.id, set.id, {
                                  type: e.target.value as any,
                                })
                              }
                              className="bg-transparent text-primary outline-none text-xs border border-transparent hover:border-border-subtle rounded px-1.5 py-0.5"
                            >
                              <option value="normal" className="bg-bg-surface">
                                Normal
                              </option>
                              <option value="warmup" className="bg-bg-surface">
                                Warmup
                              </option>
                              <option value="dropset" className="bg-bg-surface">
                                Dropset
                              </option>
                              <option value="failure" className="bg-bg-surface">
                                Failure
                              </option>
                            </select>
                          </td>
                          <td className="py-1">
                            <input
                              type="number"
                              value={set.weight ?? ""}
                              onChange={(e) =>
                                updateSet(se.id, set.id, {
                                  weight: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="0"
                              className="w-16 bg-transparent text-primary outline-none border border-transparent focus:border-border-strong rounded px-1.5 py-0.5 font-mono text-xs"
                            />
                          </td>
                          <td className="py-1">
                            <input
                              type="number"
                              value={set.reps ?? ""}
                              onChange={(e) =>
                                updateSet(se.id, set.id, {
                                  reps: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              placeholder="0"
                              className="w-12 bg-transparent text-primary outline-none border border-transparent focus:border-border-strong rounded px-1.5 py-0.5 font-mono text-xs"
                            />
                          </td>
                          <td className="py-1 text-center">
                            <button
                              onClick={() => toggleSetComplete(se.id, set.id)}
                              className={cn(
                                "mx-auto h-5 w-5 rounded border flex items-center justify-center transition-colors",
                                set.completed
                                  ? "bg-accent border-accent text-bg-base"
                                  : "border-border-default hover:border-border-strong text-transparent",
                              )}
                              aria-label="Toggle set complete"
                            >
                              <Check className="h-3 w-3 stroke-[3]" />
                            </button>
                          </td>
                          <td className="py-1 text-right">
                            <button
                              onClick={() => removeSet(se.id, set.id)}
                              className="text-text-placeholder hover:text-negative rounded p-1 transition-colors"
                              aria-label="Delete set"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Add set button */}
                  <button
                    onClick={() => addSet(se.id)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-secondary hover:text-primary transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add Set
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Footer Controls ────────────────────────────────────────── */}
        <div className="border-t border-border-subtle bg-bg-base/30 px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            {showCancelConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-negative flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Discard all data?
                </span>
                <button
                  onClick={handleCancel}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded bg-negative text-primary hover:bg-negative-bg hover:text-negative border border-negative-border transition-all"
                >
                  Yes, discard
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded bg-bg-elevated text-primary border border-border-default hover:bg-bg-base transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-3 h-9 rounded-md border border-negative-border text-negative hover:bg-negative-bg transition-colors text-xs font-semibold"
              >
                Discard Workout
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Quick add mock exercise button */}
            <button
              onClick={() => {
                const mockExercises: Exercise[] = [
                  {
                    id: "ex-1",
                    name: "Barbell Bench Press",
                    category: "barbell",
                    muscleGroups: ["chest", "triceps", "shoulders"],
                    equipment: ["barbell"],
                    isCustom: false,
                  },
                  {
                    id: "ex-2",
                    name: "Conventional Deadlift",
                    category: "barbell",
                    muscleGroups: ["back", "hamstrings", "glutes"],
                    equipment: ["barbell"],
                    isCustom: false,
                  },
                  {
                    id: "ex-3",
                    name: "Dumbbell Lateral Raise",
                    category: "dumbbell",
                    muscleGroups: ["shoulders"],
                    equipment: ["dumbbell"],
                    isCustom: false,
                  },
                ]
                // Pick one randomly
                const exercise = mockExercises[Math.floor(Math.random() * mockExercises.length)]!
                useWorkoutStore.getState().addExercise(exercise)
                toast.success(`Added ${exercise.name}`)
              }}
              className="px-3 h-9 rounded-md border border-border-default hover:bg-bg-elevated text-primary transition-colors text-xs font-medium"
            >
              + Add Exercise
            </button>

            <button
              onClick={handleComplete}
              className="px-4 h-9 rounded-md bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed transition-colors text-xs font-bold"
            >
              Save Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ActiveWorkoutModal
