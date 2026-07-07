"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  Moon,
  Dumbbell,
  Play,
} from "lucide-react"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { useWorkoutStore } from "@/lib/store/workout.store"
import { ROUTES } from "@/lib/constants/ROUTES"
import { cn } from "@/lib/utils/cn"
import { toast } from "sonner"
import { ExerciseSelector } from "@/features/training/components/ExerciseSelector"
import { ProgramFormModal } from "@/features/training/components/ProgramFormModal"
import { WeeklySchedule } from "@/features/training/components/WeeklySchedule"
import type { Exercise, ProgramDay } from "@/lib/types/training.types"
import { findExerciseById } from "@/features/training/data/exercise-library.data"

interface Props {
  params: Promise<{ id: string }>
}

export default function ProgramDetailPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()

  const {
    programs,
    addDay,
    removeDay,
    updateDay,
    reorderDays,
    addExerciseToDay,
    removeExerciseFromDay,
    reorderExercisesInDay,
    updateExerciseInDay,
    setActiveProgram,
    deleteProgram,
  } = useProgramsStore()

  const { startWorkout, activeSession } = useWorkoutStore()

  const program = programs.find((p) => p.id === id)

  const [expandedDayId, setExpandedDayId] = useState<string | null>(program?.days[0]?.id ?? null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [exerciseSelectorDayId, setExerciseSelectorDayId] = useState<string | null>(null)
  const [activeMenuDay, setActiveMenuDay] = useState<string | null>(null)
  const [addingDay, setAddingDay] = useState(false)
  const [newDayName, setNewDayName] = useState("")
  const [activeTab, setActiveTab] = useState<"builder" | "schedule">("builder")

  if (!program) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <h3 className="text-lg font-semibold text-primary">Program not found</h3>
        <p className="text-sm text-text-secondary">This program may have been deleted.</p>
        <Link href={ROUTES.training.programs} className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-accent text-bg-base font-bold text-xs">
          <ArrowLeft className="h-4 w-4" /> Back to Programs
        </Link>
      </div>
    )
  }

  const handleAddDay = () => {
    if (!newDayName.trim()) return
    addDay(program.id, {
      name: newDayName.trim(),
      exercises: [],
      isRestDay: false,
    })
    setNewDayName("")
    setAddingDay(false)
  }

  const handleAddRestDay = () => {
    addDay(program.id, {
      name: "Rest Day",
      exercises: [],
      isRestDay: true,
    })
  }

  const handleExerciseSelected = (exercise: Exercise) => {
    if (!exerciseSelectorDayId) return
    // Try to find full exercise data from library first
    const fullEx = findExerciseById(exercise.id) ?? exercise
    addExerciseToDay(program.id, exerciseSelectorDayId, {
      exerciseId: fullEx.id,
      exercise: fullEx,
      targetSets: 3,
      targetReps: "8-12",
      restSeconds: 90,
    })
    toast.success(`Added ${fullEx.name}`)
    setExerciseSelectorDayId(null)
  }

  const handleStartFromDay = (day: ProgramDay) => {
    if (activeSession) {
      toast.error("A workout is already active. Finish or discard it first.")
      return
    }
    startWorkout(day.name, program.id, day.id)
    day.exercises.forEach((pe) => {
      const ex = pe.exercise ?? findExerciseById(pe.exerciseId)
      if (ex) {
        useWorkoutStore.getState().addExercise(ex)
        // Add remaining sets
        const sess = useWorkoutStore.getState().activeSession
        if (sess) {
          const added = sess.exercises[sess.exercises.length - 1]
          if (added) {
            for (let i = 1; i < pe.targetSets; i++) {
              useWorkoutStore.getState().addSet(added.id, "normal")
            }
          }
        }
      }
    })
    toast.success(`Started: ${day.name}`)
    router.push(ROUTES.training.log)
  }

  const handleMoveDay = (dayId: string, direction: "up" | "down") => {
    const idx = program.days.findIndex((d) => d.id === dayId)
    if (direction === "up" && idx > 0) reorderDays(program.id, idx, idx - 1)
    if (direction === "down" && idx < program.days.length - 1) reorderDays(program.id, idx, idx + 1)
  }

  return (
    <div className="page-container space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.training.programs} className="p-2 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="page-title">{program.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-mono text-text-placeholder uppercase tracking-wider capitalize">
                {program.difficulty} · {program.daysPerWeek} days/week
                {program.durationWeeks && ` · ${program.durationWeeks} weeks`}
              </span>
              {program.isActive && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/15 border border-accent/30 text-accent uppercase">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!program.isActive && (
            <button
              onClick={() => { setActiveProgram(program.id); toast.success("Program set as active") }}
              className="h-8 px-3 rounded border border-accent/30 text-accent hover:bg-accent/10 text-xs font-semibold transition-colors"
            >
              Set Active
            </button>
          )}
          <button
            onClick={() => setShowEditModal(true)}
            className="h-8 px-3 rounded border border-border-default hover:bg-bg-elevated text-primary text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        </div>
      </div>

      {/* Description */}
      {program.description && (
        <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">{program.description}</p>
      )}
      {program.goal && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-border-subtle bg-bg-surface text-xs text-text-secondary">
          <span className="font-mono text-text-placeholder uppercase text-[9px]">Goal:</span>
          <span>{program.goal}</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-border-subtle">
        {(["builder", "schedule"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "border-accent text-primary"
                : "border-transparent text-text-secondary hover:text-primary"
            )}
          >
            {tab === "builder" ? "Workout Builder" : "Weekly Schedule"}
          </button>
        ))}
      </div>

      {activeTab === "builder" && (
        <div className="space-y-4">
          {/* Days list */}
          {program.days.map((day, dayIdx) => (
            <div
              key={day.id}
              className={cn(
                "rounded-xl border bg-bg-surface overflow-hidden",
                expandedDayId === day.id ? "border-border-default" : "border-border-subtle"
              )}
            >
              {/* Day header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    disabled={dayIdx === 0}
                    onClick={() => handleMoveDay(day.id, "up")}
                    className="text-text-placeholder hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronDown className="h-3 w-3 rotate-180" />
                  </button>
                  <button
                    disabled={dayIdx === program.days.length - 1}
                    onClick={() => handleMoveDay(day.id, "down")}
                    className="text-text-placeholder hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                <button
                  onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0",
                    day.isRestDay ? "bg-bg-elevated text-text-placeholder" : "bg-accent/15 text-accent border border-accent/25"
                  )}>
                    {day.isRestDay ? <Moon className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="text-sm font-semibold text-primary block truncate">{day.name}</span>
                    {!day.isRestDay && (
                      <span className="text-[10px] font-mono text-text-placeholder">
                        {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}
                        {day.exercises.length > 0 && ` · est. ${Math.round(day.exercises.reduce((s, e) => s + e.targetSets * (e.restSeconds + 45), 0) / 60)}min`}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-text-placeholder transition-transform", expandedDayId === day.id && "rotate-180")} />
                </button>

                {/* Day actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!day.isRestDay && (
                    <button
                      onClick={() => handleStartFromDay(day)}
                      className="h-7 px-2 rounded border border-accent/30 text-accent hover:bg-accent/10 text-[10px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <Play className="h-3 w-3 fill-current" /> Start
                    </button>
                  )}
                  <button
                    onClick={() => { removeDay(program.id, day.id); setExpandedDayId(null) }}
                    className="p-1 rounded hover:bg-negative-bg/20 text-text-placeholder hover:text-negative transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Day content */}
              {expandedDayId === day.id && !day.isRestDay && (
                <div className="border-t border-border-subtle/50 px-4 py-4 space-y-3 bg-bg-base/20">
                  {day.exercises.length === 0 ? (
                    <div className="text-center py-6 text-xs text-text-placeholder">
                      No exercises yet. Add exercises to this day.
                    </div>
                  ) : (
                    day.exercises.map((pe) => {
                      const exName = pe.exercise?.name ?? findExerciseById(pe.exerciseId)?.name ?? pe.exerciseId
                      const muscles = pe.exercise?.muscleGroups ?? findExerciseById(pe.exerciseId)?.muscleGroups ?? []

                      return (
                        <div key={pe.id} className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle/50 bg-bg-surface hover:bg-bg-elevated/20 transition-colors">
                          <GripVertical className="h-4 w-4 text-text-placeholder flex-shrink-0 cursor-grab" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-xs font-semibold text-primary block truncate">{exName}</span>
                                <span className="text-[10px] text-text-placeholder font-mono capitalize">
                                  {muscles.slice(0, 2).join(", ")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 text-[10px] font-mono text-text-placeholder">
                                <span className="font-semibold text-primary">{pe.targetSets}×{pe.targetReps}</span>
                                <span>{pe.restSeconds}s rest</span>
                              </div>
                            </div>

                            {/* Inline edit targets */}
                            <div className="flex gap-2 mt-2 text-[10px]">
                              <label className="flex items-center gap-1">
                                <span className="text-text-placeholder font-mono">Sets</span>
                                <input
                                  type="number"
                                  value={pe.targetSets}
                                  onChange={(e) => updateExerciseInDay(program.id, day.id, pe.id, { targetSets: parseInt(e.target.value) || 1 })}
                                  min={1}
                                  max={20}
                                  className="w-10 h-6 px-1 rounded border border-border-subtle bg-bg-base text-primary text-center font-mono outline-none focus:border-accent"
                                />
                              </label>
                              <label className="flex items-center gap-1">
                                <span className="text-text-placeholder font-mono">Reps</span>
                                <input
                                  type="text"
                                  value={pe.targetReps}
                                  onChange={(e) => updateExerciseInDay(program.id, day.id, pe.id, { targetReps: e.target.value })}
                                  className="w-16 h-6 px-1 rounded border border-border-subtle bg-bg-base text-primary font-mono outline-none focus:border-accent text-center"
                                />
                              </label>
                              <label className="flex items-center gap-1">
                                <span className="text-text-placeholder font-mono">RPE</span>
                                <input
                                  type="number"
                                  value={pe.targetRPE ?? ""}
                                  onChange={(e) => updateExerciseInDay(program.id, day.id, pe.id, { targetRPE: parseInt(e.target.value) || undefined })}
                                  min={1}
                                  max={10}
                                  placeholder="—"
                                  className="w-10 h-6 px-1 rounded border border-border-subtle bg-bg-base text-primary text-center font-mono outline-none focus:border-accent"
                                />
                              </label>
                              <label className="flex items-center gap-1">
                                <span className="text-text-placeholder font-mono">Rest(s)</span>
                                <input
                                  type="number"
                                  value={pe.restSeconds}
                                  onChange={(e) => updateExerciseInDay(program.id, day.id, pe.id, { restSeconds: parseInt(e.target.value) || 60 })}
                                  min={0}
                                  max={600}
                                  className="w-14 h-6 px-1 rounded border border-border-subtle bg-bg-base text-primary font-mono outline-none focus:border-accent"
                                />
                              </label>
                            </div>
                          </div>

                          <button
                            onClick={() => removeExerciseFromDay(program.id, day.id, pe.id)}
                            className="p-1 rounded hover:bg-negative-bg/20 text-text-placeholder hover:text-negative transition-colors flex-shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })
                  )}

                  <button
                    onClick={() => setExerciseSelectorDayId(day.id)}
                    className="w-full h-8 rounded border border-dashed border-border-default hover:border-accent hover:text-accent text-text-placeholder text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Exercise
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add Day controls */}
          <div className="flex gap-3">
            {addingDay ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newDayName}
                  onChange={(e) => setNewDayName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddDay(); if (e.key === "Escape") setAddingDay(false) }}
                  placeholder="Day name e.g. Push A"
                  className="flex-1 h-9 px-3 rounded border border-accent bg-bg-surface text-primary placeholder-text-placeholder text-xs outline-none"
                  autoFocus
                />
                <button onClick={handleAddDay} className="h-9 px-3 rounded bg-accent text-bg-base font-bold text-xs hover:bg-accent-hover">
                  Add
                </button>
                <button onClick={() => setAddingDay(false)} className="h-9 px-3 rounded border border-border-default text-primary text-xs hover:bg-bg-elevated">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setAddingDay(true)}
                  className="flex-1 h-9 rounded border border-dashed border-border-default hover:border-accent hover:text-accent text-text-placeholder text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Workout Day
                </button>
                <button
                  onClick={handleAddRestDay}
                  className="h-9 px-3 rounded border border-dashed border-border-default hover:border-border-strong text-text-placeholder text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Moon className="h-3.5 w-3.5" /> Rest Day
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <WeeklySchedule program={program} />
      )}

      {/* Exercise Selector */}
      <ExerciseSelector
        isOpen={!!exerciseSelectorDayId}
        onClose={() => setExerciseSelectorDayId(null)}
        onSelect={handleExerciseSelected}
      />

      {/* Edit Modal */}
      <ProgramFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        program={program}
      />
    </div>
  )
}
