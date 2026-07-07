"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWorkoutStore } from "@/lib/store/workout.store"
import { useUIStore } from "@/lib/store/ui.store"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { ROUTES } from "@/lib/constants/ROUTES"
import { formatDuration, formatVolume } from "@/lib/utils/format"
import { formatDateShort } from "@/lib/utils/date"
import Link from "next/link"
import {
  Play,
  Dumbbell,
  BookOpen,
  Calendar,
  Award,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Clock,
  Flame,
  Plus,
  Eye,
  LayoutList,
  Library,
} from "lucide-react"
import { toast } from "sonner"
import { EXERCISE_LIBRARY } from "@/features/training/data/exercise-library.data"
import type { TrainingProgram, Exercise, ProgramDay } from "@/lib/types/training.types"

// ─── Core Exercise Database Mock for Previews ─────────────────────
const MOCK_EXERCISES: Record<string, Exercise> = {
  "ex-bench": {
    id: "ex-bench",
    name: "Barbell Bench Press",
    category: "barbell",
    muscleGroups: ["chest", "triceps", "shoulders"],
    equipment: ["barbell"],
    isCustom: false,
  },
  "ex-squat": {
    id: "ex-squat",
    name: "Barbell Back Squat",
    category: "barbell",
    muscleGroups: ["quads", "hamstrings", "glutes"],
    equipment: ["barbell"],
    isCustom: false,
  },
  "ex-deadlift": {
    id: "ex-deadlift",
    name: "Conventional Deadlift",
    category: "barbell",
    muscleGroups: ["back", "hamstrings", "glutes"],
    equipment: ["barbell"],
    isCustom: false,
  },
  "ex-pullup": {
    id: "ex-pullup",
    name: "Weighted Pullup",
    category: "bodyweight",
    muscleGroups: ["back", "biceps"],
    equipment: ["pullup_bar"],
    isCustom: false,
  },
  "ex-overhead": {
    id: "ex-overhead",
    name: "Barbell Overhead Press",
    category: "barbell",
    muscleGroups: ["shoulders", "triceps"],
    equipment: ["barbell"],
    isCustom: false,
  },
  "ex-row": {
    id: "ex-row",
    name: "Barbell Row",
    category: "barbell",
    muscleGroups: ["back", "biceps"],
    equipment: ["barbell"],
    isCustom: false,
  },
}

export default function TrainingPage() {
  const router = useRouter()
  const { startWorkout, activeSession } = useWorkoutStore()
  const { setActiveWorkoutModalOpen } = useUIStore()
  const { programs } = useProgramsStore()

  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)

  const activeUserProgram = programs.find((p) => p.isActive && !p.isArchived)
  // ─── Template Programs (static previews for hub page) ──────────────────────────────
  const templatePrograms: TrainingProgram[] = [
    {
      id: "prog-1",
      userId: "system",
      name: "One Percent Strength (3-Day)",
      description: "Relentless strength focus based on heavy compound lifts. Compound progression weekly.",
      daysPerWeek: 3,
      difficulty: "beginner",
      focus: ["strength", "power"],
      isActive: true,
      isTemplate: true,
      createdAt: {} as any,
      updatedAt: {} as any,
      days: [
        {
          id: "p1-d1",
          name: "Day 1: Squat & Push Focus",
          orderIndex: 0,
          isRestDay: false,
          exercises: [
            { id: "pe-1", exerciseId: "ex-squat", orderIndex: 0, targetSets: 3, targetReps: "5", restSeconds: 180 },
            { id: "pe-2", exerciseId: "ex-bench", orderIndex: 1, targetSets: 3, targetReps: "8", restSeconds: 120 },
            { id: "pe-3", exerciseId: "ex-row", orderIndex: 2, targetSets: 3, targetReps: "8-10", restSeconds: 90 },
          ],
        },
        {
          id: "p1-d2",
          name: "Day 2: Overhead Press & Pullups",
          orderIndex: 1,
          isRestDay: false,
          exercises: [
            { id: "pe-4", exerciseId: "ex-overhead", orderIndex: 0, targetSets: 3, targetReps: "5", restSeconds: 180 },
            { id: "pe-5", exerciseId: "ex-pullup", orderIndex: 1, targetSets: 3, targetReps: "AMRAP", restSeconds: 120 },
          ],
        },
        {
          id: "p1-d3",
          name: "Day 3: Deadlift Focus",
          orderIndex: 2,
          isRestDay: false,
          exercises: [
            { id: "pe-6", exerciseId: "ex-deadlift", orderIndex: 0, targetSets: 3, targetReps: "5", restSeconds: 240 },
            { id: "pe-7", exerciseId: "ex-bench", orderIndex: 1, targetSets: 3, targetReps: "8", restSeconds: 120 },
          ],
        },
      ],
    },
    {
      id: "prog-2",
      userId: "system",
      name: "Linear Hypertrophy (4-Day)",
      description: "High-density bodybuilding program. Focuses on total volume tracking, progressive overload.",
      daysPerWeek: 4,
      difficulty: "intermediate",
      focus: ["hypertrophy"],
      isActive: false,
      isTemplate: true,
      createdAt: {} as any,
      updatedAt: {} as any,
      days: [
        {
          id: "p2-d1",
          name: "Upper Day A",
          orderIndex: 0,
          isRestDay: false,
          exercises: [
            { id: "pe-8", exerciseId: "ex-bench", orderIndex: 0, targetSets: 4, targetReps: "8-12", restSeconds: 90 },
            { id: "pe-9", exerciseId: "ex-row", orderIndex: 1, targetSets: 4, targetReps: "10-12", restSeconds: 90 },
          ],
        },
      ],
    },
  ]

  // ─── Recent Workout History ────────────────────────────────────────
  const history = [
    {
      id: "s-1",
      name: "Push Day A",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2),
      durationSeconds: 3450,
      totalVolume: 8450,
      totalSets: 16,
      prs: 2,
    },
    {
      id: "s-2",
      name: "Pull Day A",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000 * 4),
      durationSeconds: 3120,
      totalVolume: 9100,
      totalSets: 15,
      prs: 1,
    },
  ]

  const handleStartWorkout = (name: string, day?: ProgramDay) => {
    if (activeSession) {
      toast.error("A workout session is already active. Please minimize or save it first.")
      setActiveWorkoutModalOpen(true)
      return
    }

    startWorkout(name, day ? "prog-1" : undefined, day?.id)

    // Load exercises from day template if provided
    if (day) {
      day.exercises.forEach((pe) => {
        const fullExercise = MOCK_EXERCISES[pe.exerciseId]
        if (fullExercise) {
          // Add default exercise block with configuration
          useWorkoutStore.getState().addExercise(fullExercise)
          // Add target set counts
          const session = useWorkoutStore.getState().activeSession
          if (session) {
            const added = session.exercises[session.exercises.length - 1]
            if (added) {
              // Add remaining sets (addExercise creates 1 default set)
              for (let i = 1; i < pe.targetSets; i++) {
                useWorkoutStore.getState().addSet(added.id, "normal")
              }
            }
          }
        }
      })
    }

    toast.success(`Started: ${name}`)
    router.push(ROUTES.training.log)
  }

  const toggleExpandProgram = (programId: string) => {
    setExpandedProgramId(expandedProgramId === programId ? null : programId)
    setSelectedDayId(null)
  }

  const toggleExpandDay = (dayId: string) => {
    setSelectedDayId(selectedDayId === dayId ? null : dayId)
  }

  return (
    <div className="page-container space-y-8">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-title">Training Hub</h2>
          <p className="text-sm text-text-secondary">
            Select a template program, preview targets, or start logging custom sessions.
          </p>
        </div>

        <button
          onClick={() => handleStartWorkout("Custom Workout")}
          className="px-4 h-10 rounded-md bg-accent text-bg-base font-bold hover:bg-accent-hover active:bg-accent-pressed transition-all text-xs flex items-center gap-1.5 self-start sm:self-center"
        >
          <Play className="h-3.5 w-3.5 fill-bg-base" /> Start Empty Session
        </button>
      </div>

      {/* ─── Quick Nav Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={ROUTES.training.programs}
          className="group flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-bg-surface hover:border-border-default hover:bg-bg-elevated/40 transition-all duration-150"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
            <LayoutList className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-sm font-semibold text-primary">Programs</h3>
            <p className="text-[11px] text-text-secondary truncate">
              {programs.length > 0
                ? `${programs.filter((p) => !p.isArchived).length} program${programs.filter((p) => !p.isArchived).length !== 1 ? "s" : ""}${activeUserProgram ? ` · ${activeUserProgram.name} active` : ""}`
                : "Create and manage your training programs"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-text-placeholder group-hover:text-primary transition-colors flex-shrink-0" />
        </Link>

        <Link
          href={ROUTES.training.exercises}
          className="group flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-bg-surface hover:border-border-default hover:bg-bg-elevated/40 transition-all duration-150"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Library className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-sm font-semibold text-primary">Exercise Library</h3>
            <p className="text-[11px] text-text-secondary truncate">
              {EXERCISE_LIBRARY.length} exercises — search, filter, add to programs
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-text-placeholder group-hover:text-primary transition-colors flex-shrink-0" />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-bg-surface p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
              Today&apos;s Workout
            </span>
            <h3 className="text-base font-semibold text-primary">
              Day 1: Squat & Push Focus
            </h3>
            <p className="text-xs text-text-secondary">
              Recommended session from program <strong className="text-primary">One Percent Strength</strong>.
            </p>
          </div>
          <button
            onClick={() => {
              const activeProg = templatePrograms[0]
              const dayOne = activeProg?.days[0]
              handleStartWorkout("Day 1: Squat & Push Focus", dayOne)
            }}
            className="px-4 h-8 rounded bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed font-semibold text-xs transition-colors whitespace-nowrap"
          >
            Start Scheduled Workout
          </button>
        </div>
      </div>

      {/* ─── Programs List accordion ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider font-mono border-b border-border-subtle pb-2">
            Workout Programs
          </h3>

          <div className="space-y-4">
            {templatePrograms.map((program) => {
              const isExpanded = expandedProgramId === program.id

              return (
                <div
                  key={program.id}
                  className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden transition-all"
                >
                  {/* Accordion header */}
                  <div
                    onClick={() => toggleExpandProgram(program.id)}
                    className="flex justify-between items-start p-5 hover:bg-bg-elevated/20 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-primary">
                          {program.name}
                        </h4>
                        {program.isActive && (
                          <span className="text-[9px] font-mono font-bold text-accent bg-accent/15 border border-accent/25 px-1.5 py-0.5 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {program.description}
                      </p>
                      <div className="flex gap-4 pt-1 text-[10px] text-text-placeholder font-mono uppercase">
                        <span>{program.difficulty}</span>
                        <span>{program.daysPerWeek} Days / Week</span>
                      </div>
                    </div>
                    <div className="text-text-placeholder pt-0.5">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 rotate-180 transition-transform duration-200" />
                      ) : (
                        <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                      )}
                    </div>
                  </div>

                  {/* Accordion Content (Days & Exercises Preview) */}
                  {isExpanded && (
                    <div className="border-t border-border-subtle bg-bg-base/20 px-5 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
                      <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block mb-1">
                        Select day schedule to preview:
                      </span>
                      {program.days.map((day) => {
                        const isDaySelected = selectedDayId === day.id

                        return (
                          <div
                            key={day.id}
                            className="rounded border border-border-subtle bg-bg-surface overflow-hidden"
                          >
                            <div
                              onClick={() => toggleExpandDay(day.id)}
                              className="flex justify-between items-center px-4 py-3 hover:bg-bg-elevated/40 cursor-pointer transition-colors"
                            >
                              <span className="text-xs font-semibold text-primary">
                                {day.name}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-text-placeholder">
                                  {day.exercises.length} Exercises
                                </span>
                                <ChevronRight
                                  className={`h-4 w-4 text-text-placeholder transition-transform duration-150 ${
                                    isDaySelected ? "rotate-90" : ""
                                  }`}
                                />
                              </div>
                            </div>

                            {isDaySelected && (
                              <div className="border-t border-border-subtle bg-bg-base/30 px-4 py-3 space-y-3">
                                <div className="space-y-2">
                                  {day.exercises.map((pe) => {
                                    const ex = MOCK_EXERCISES[pe.exerciseId]
                                    return (
                                      <div
                                        key={pe.id}
                                        className="flex justify-between items-center text-xs"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Dumbbell className="h-3 w-3 text-text-placeholder" />
                                          <span className="text-primary font-medium">
                                            {ex?.name || "Exercise"}
                                          </span>
                                        </div>
                                        <span className="font-mono text-text-secondary text-[11px]">
                                          {pe.targetSets} Sets × {pe.targetReps} Reps (Rest: {pe.restSeconds}s)
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>

                                <div className="flex justify-end pt-2 border-t border-border-subtle/50">
                                  <button
                                    onClick={() => handleStartWorkout(day.name, day)}
                                    className="px-3 h-7 rounded bg-accent text-bg-base font-bold hover:bg-accent-hover active:bg-accent-pressed text-[11px] transition-colors flex items-center gap-1"
                                  >
                                    <Play className="h-3 w-3 fill-bg-base" /> Start Workout
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider font-mono">
              Recent Log History
            </h3>
            <span className="font-mono text-xs text-text-placeholder">
              {history.length} workouts
            </span>
          </div>

          <div className="space-y-3">
            {history.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-elevated/40 transition-colors duration-150 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-semibold text-primary">{log.name}</h4>
                    <span className="text-[10px] text-text-placeholder font-mono">
                      {formatDateShort(log.date)}
                    </span>
                  </div>
                  {log.prs > 0 && (
                    <span className="text-[9px] font-mono font-bold text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded">
                      +{log.prs} PRs
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle/50 text-[10px] font-mono">
                  <div>
                    <span className="text-text-placeholder block uppercase tracking-wider">
                      Volume
                    </span>
                    <span className="text-primary font-bold block mt-0.5">
                      {formatVolume(log.totalVolume)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-placeholder block uppercase tracking-wider">
                      Sets
                    </span>
                    <span className="text-primary font-bold block mt-0.5">
                      {log.totalSets} sets
                    </span>
                  </div>
                  <div>
                    <span className="text-text-placeholder block uppercase tracking-wider">
                      Duration
                    </span>
                    <span className="text-primary font-bold block mt-0.5">
                      {formatDuration(log.durationSeconds)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
