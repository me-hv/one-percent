"use client"

import { useWorkoutStore } from "@/lib/store/workout.store"
import { useUIStore } from "@/lib/store/ui.store"
import { useAuthStore } from "@/lib/store/auth.store"
import { trainingService } from "@/features/training/services/training.service"
import { formatDurationShort, formatVolume } from "@/lib/utils/format"
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Minimize2,
  Check,
  Dumbbell,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ExerciseCard } from "@/features/training/components/ExerciseCard"
import { ExerciseSelector } from "@/features/training/components/ExerciseSelector"
import { WorkoutSummaryModal } from "@/features/training/components/WorkoutSummaryModal"
import { RestTimer } from "@/features/training/components/RestTimer"
import type { Exercise, WorkoutSession } from "@/lib/types/training.types"
import Link from "next/link"
import { ROUTES } from "@/lib/constants/ROUTES"

export default function WorkoutLogPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { setActiveWorkoutModalOpen } = useUIStore()
  const {
    activeSession,
    timerSeconds,
    isPaused,
    tickTimer,
    togglePause,
    cancelWorkout,
    completeWorkout,
    addExercise,
    updateSessionNotes,
  } = useWorkoutStore()

  // ─── Local UI States ─────────────────────────────────────────────
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null)
  
  // Summary Modal States
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null)

  // ─── Live Workout Timer Interval ──────────────────────────────────
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (activeSession && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        tickTimer()
      }, 1000)
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [activeSession, isPaused, tickTimer])

  // ─── Live Metrics Calculations ────────────────────────────────────
  const liveStats = (() => {
    if (!activeSession) return { volume: 0, sets: 0, reps: 0, exercisesDone: 0 }
    
    let volume = 0
    let sets = 0
    let reps = 0
    let exercisesDone = 0

    activeSession.exercises.forEach((se) => {
      const isExDone = se.sets.length > 0 && se.sets.every((s) => s.completed)
      if (isExDone) exercisesDone++

      se.sets.forEach((set) => {
        if (set.completed) {
          sets++
          reps += set.reps || 0
          volume += (set.weight || 0) * (set.reps || 0)
        }
      })
    })

    return { volume, sets, reps, exercisesDone }
  })()

  // ─── Swap / Replace Action ────────────────────────────────────────
  const handleOpenReplaceSelector = (sessionExerciseId: string) => {
    setReplaceTargetId(sessionExerciseId)
    setSelectorOpen(true)
  }

  const handleSelectExercise = (exercise: Exercise) => {
    if (replaceTargetId) {
      // Swapping target exercise in active session
      const session = useWorkoutStore.getState().activeSession
      if (session) {
        const updated = session.exercises.map((se) => {
          if (se.id === replaceTargetId) {
            return { ...se, exerciseId: exercise.id, exercise }
          }
          return se
        })
        useWorkoutStore.setState({
          activeSession: { ...session, exercises: updated },
        })
        toast.success(`Swapped to ${exercise.name}`)
      }
      setReplaceTargetId(null)
    } else {
      // Standard Append exercise to session
      addExercise(exercise)
      toast.success(`Added ${exercise.name}`)
    }
  }

  // ─── Save / Discard Actions ───────────────────────────────────────
  const handleSaveWorkout = async () => {
    if (!activeSession) return

    const completedSetCount = activeSession.exercises.reduce(
      (acc, se) => acc + se.sets.filter((s) => s.completed).length,
      0
    )

    if (completedSetCount === 0) {
      toast.error("Please log at least one completed set before saving.")
      return
    }

    try {
      const uId = user?.uid || "mock-user"
      // Run calculations inside trainingService, write to Firestore
      const { finalSession } = await trainingService.completeWorkoutSession(uId, activeSession)
      
      // Reset active store state
      completeWorkout()
      
      // Open summary popup
      setCompletedSession(finalSession)
      setSummaryOpen(true)
    } catch (e) {
      toast.error("Error saving workout session. Check your connection.")
    }
  }

  const handleDiscardWorkout = () => {
    cancelWorkout()
    setShowCancelConfirm(false)
    toast.success("Workout discarded.")
    router.push(ROUTES.training.root)
  }

  const handleCloseSummary = () => {
    setSummaryOpen(false)
    router.push(ROUTES.dashboard)
  }

  // Redirect fallback if no session active
  if (!activeSession && !summaryOpen) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center space-y-4">
        <Dumbbell className="h-10 w-10 text-text-placeholder animate-bounce" />
        <h3 className="text-base font-semibold text-primary">No Active Session</h3>
        <p className="text-xs text-text-secondary max-w-xs">
          Start a new workout template program or quick custom session from the training hub.
        </p>
        <Link
          href={ROUTES.training.root}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-accent text-bg-base hover:bg-accent-hover font-bold text-xs transition-colors"
        >
          Go to Training <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="page-container max-w-4xl mx-auto space-y-8 pb-32">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-subtle pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.training.root}
            className="p-2 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-left">
            <h2 className="text-lg font-bold text-primary">{activeSession?.name || "Active Session"}</h2>
            <span className="font-mono text-xs text-text-placeholder">
              Elapsed: {formatDurationShort(timerSeconds)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={togglePause}
            className="px-3 h-8 rounded border border-border-default hover:bg-bg-elevated text-primary text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => setActiveWorkoutModalOpen(true)}
            className="px-3 h-8 rounded border border-border-default hover:bg-bg-elevated text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Minimize to top bar"
          >
            <Minimize2 className="h-3.5 w-3.5" /> Minimize
          </button>
        </div>
      </div>

      {/* ─── Live Calculations Stats Bar ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-elevated text-left p-3.5 space-y-1">
          <span className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase block">
            Volume Today
          </span>
          <span className="font-mono text-base font-bold text-primary block mt-0.5">
            {formatVolume(liveStats.volume)}
          </span>
        </div>

        <div className="card-elevated text-left p-3.5 space-y-1">
          <span className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase block">
            Working Sets
          </span>
          <span className="font-mono text-base font-bold text-primary block mt-0.5">
            {liveStats.sets} sets
          </span>
        </div>

        <div className="card-elevated text-left p-3.5 space-y-1">
          <span className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase block">
            Exercises Done
          </span>
          <span className="font-mono text-base font-bold text-primary block mt-0.5">
            {liveStats.exercisesDone} / {activeSession?.exercises.length || 0}
          </span>
        </div>

        <div className="card-elevated text-left p-3.5 space-y-1">
          <span className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase block">
            Est. Calories
          </span>
          <span className="font-mono text-base font-bold text-accent block mt-0.5">
            {Math.round((timerSeconds / 60) * 6)} kcal
          </span>
        </div>
      </div>

      {/* ─── Global Notes ───────────────────────────────────────────── */}
      {activeSession && (
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" /> General Workout Notes
          </label>
          <textarea
            placeholder="Energy levels, pre-workout focus details, pain comments..."
            value={activeSession.notes || ""}
            onChange={(e) => updateSessionNotes(e.target.value)}
            className="w-full h-16 p-2 rounded border border-border-default bg-bg-surface text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none resize-none"
          />
        </div>
      )}

      {/* ─── Exercises List ──────────────────────────────────────────── */}
      <div className="space-y-6">
        {activeSession?.exercises.map((se) => (
          <ExerciseCard
            key={se.id}
            sessionExercise={se}
            onReplaceClick={handleOpenReplaceSelector}
          />
        ))}
      </div>

      {/* ─── Action Triggers ─────────────────────────────────────────── */}
      <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4">
        {showCancelConfirm ? (
          <div className="flex items-center gap-2 border border-negative-border bg-negative-bg/20 p-2 rounded-lg">
            <span className="text-[10px] font-semibold text-negative flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Discard session logs?
            </span>
            <button
              onClick={handleDiscardWorkout}
              className="px-2.5 py-1 text-[10px] font-semibold rounded bg-negative text-primary hover:bg-negative-bg hover:text-negative border border-negative-border transition-all"
            >
              Confirm Discard
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
            className="px-4 h-9 rounded-md border border-negative-border text-negative hover:bg-negative-bg transition-colors text-xs font-semibold self-start sm:self-auto"
          >
            Discard Workout
          </button>
        )}

        <div className="flex gap-3 self-end sm:self-auto">
          <button
            onClick={() => {
              setReplaceTargetId(null)
              setSelectorOpen(true)
            }}
            className="px-4 h-9 rounded-md border border-border-default hover:bg-bg-elevated text-primary transition-colors text-xs font-medium"
          >
            + Add Exercise
          </button>

          <button
            onClick={handleSaveWorkout}
            className="px-5 h-9 rounded-md bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed transition-colors text-xs font-bold"
          >
            Complete & Save Workout
          </button>
        </div>
      </div>

      {/* ─── Float rest timer overlay ────────────────────────────────── */}
      <RestTimer />

      {/* ─── Exercise Selector Overlay ──────────────────────────────── */}
      <ExerciseSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleSelectExercise}
      />

      {/* ─── Summary Modal Overlay ──────────────────────────────────── */}
      <WorkoutSummaryModal
        isOpen={summaryOpen}
        onClose={handleCloseSummary}
        session={completedSession}
      />
    </div>
  )
}
