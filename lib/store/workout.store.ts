import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { WorkoutSession, WorkoutSet, Exercise, SessionExercise } from "@/lib/types/training.types"
import { Timestamp } from "firebase/firestore"

interface WorkoutState {
  activeSession: WorkoutSession | null
  timerSeconds: number
  isTimerRunning: boolean
  isPaused: boolean

  // Actions
  startWorkout: (name: string, programId?: string, programDayId?: string) => void
  addExercise: (exercise: Exercise) => void
  removeExercise: (sessionExerciseId: string) => void
  addSet: (sessionExerciseId: string, type?: WorkoutSet["type"]) => void
  removeSet: (sessionExerciseId: string, setId: string) => void
  updateSet: (sessionExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void
  toggleSetComplete: (sessionExerciseId: string, setId: string) => void
  tickTimer: () => void
  togglePause: () => void
  cancelWorkout: () => void
  completeWorkout: () => WorkoutSession | null
  updateSessionNotes: (notes: string) => void
  updateExerciseNotes: (sessionExerciseId: string, notes: string) => void
  reorderExercises: (startIndex: number, endIndex: number) => void
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      timerSeconds: 0,
      isTimerRunning: false,
      isPaused: false,

      startWorkout: (name, programId, programDayId) => {
        const newSession: WorkoutSession = {
          id: Math.random().toString(36).substring(2, 9),
          userId: "", // Will be set by service/repository layer
          name,
          programId,
          programDayId,
          exercises: [],
          status: "active",
          startedAt: Timestamp.now(),
          totalVolume: 0,
          totalSets: 0,
          totalReps: 0,
          exerciseCount: 0,
          musclesWorked: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }

        set({
          activeSession: newSession,
          timerSeconds: 0,
          isTimerRunning: true,
          isPaused: false,
        })
      },

      addExercise: (exercise) => {
        const session = get().activeSession
        if (!session) return

        const orderIndex = session.exercises.length
        const newSessionExercise: SessionExercise = {
          id: `se-${Math.random().toString(36).substring(2, 9)}`,
          exerciseId: exercise.id,
          exercise,
          orderIndex,
          sets: [
            {
              id: `set-${Math.random().toString(36).substring(2, 9)}`,
              setNumber: 1,
              type: "normal",
              completed: false,
              isWarmup: false,
              isDropset: false,
            },
          ],
        }

        const updatedSession: WorkoutSession = {
          ...session,
          exercises: [...session.exercises, newSessionExercise],
          exerciseCount: session.exercises.length + 1,
          updatedAt: Timestamp.now(),
        }

        set({ activeSession: updatedSession })
      },

      removeExercise: (sessionExerciseId) => {
        const session = get().activeSession
        if (!session) return

        const updatedExercises = session.exercises
          .filter((se) => se.id !== sessionExerciseId)
          .map((se, index) => ({ ...se, orderIndex: index })) // re-index

        const updatedSession: WorkoutSession = {
          ...session,
          exercises: updatedExercises,
          exerciseCount: updatedExercises.length,
          updatedAt: Timestamp.now(),
        }

        set({ activeSession: updatedSession })
      },

      addSet: (sessionExerciseId, type = "normal") => {
        const session = get().activeSession
        if (!session) return

        const updatedExercises = session.exercises.map((se) => {
          if (se.id !== sessionExerciseId) return se

          const nextSetNum = se.sets.length + 1
          // Prefill set details from the last set if available
          const lastSet = se.sets[se.sets.length - 1]

          const newSet: WorkoutSet = {
            id: `set-${Math.random().toString(36).substring(2, 9)}`,
            setNumber: nextSetNum,
            type,
            weight: lastSet?.weight,
            reps: lastSet?.reps,
            duration: lastSet?.duration,
            distance: lastSet?.distance,
            completed: false,
            isWarmup: type === "warmup",
            isDropset: type === "dropset",
          }

          return {
            ...se,
            sets: [...se.sets, newSet],
          }
        })

        set({
          activeSession: {
            ...session,
            exercises: updatedExercises,
            updatedAt: Timestamp.now(),
          },
        })
      },

      removeSet: (sessionExerciseId, setId) => {
        const session = get().activeSession
        if (!session) return

        const updatedExercises = session.exercises.map((se) => {
          if (se.id !== sessionExerciseId) return se

          const filteredSets = se.sets
            .filter((set) => set.id !== setId)
            .map((set, idx) => ({ ...set, setNumber: idx + 1 })) // re-index

          return {
            ...se,
            sets: filteredSets,
          }
        })

        set({
          activeSession: {
            ...session,
            exercises: updatedExercises,
            updatedAt: Timestamp.now(),
          },
        })
      },

      updateSet: (sessionExerciseId, setId, updates) => {
        const session = get().activeSession
        if (!session) return

        const updatedExercises = session.exercises.map((se) => {
          if (se.id !== sessionExerciseId) return se

          const updatedSets = se.sets.map((set) => {
            if (set.id !== setId) return set
            return { ...set, ...updates }
          })

          return {
            ...se,
            sets: updatedSets,
          }
        })

        set({
          activeSession: {
            ...session,
            exercises: updatedExercises,
            updatedAt: Timestamp.now(),
          },
        })
      },

      toggleSetComplete: (sessionExerciseId, setId) => {
        const session = get().activeSession
        if (!session) return

        const updatedExercises = session.exercises.map((se) => {
          if (se.id !== sessionExerciseId) return se

          const updatedSets = se.sets.map((set) => {
            if (set.id !== setId) return set
            const newCompleted = !set.completed
            return {
              ...set,
              completed: newCompleted,
              completedAt: newCompleted ? Timestamp.now() : undefined,
            }
          })

          return {
            ...se,
            sets: updatedSets,
          }
        })

        set({
          activeSession: {
            ...session,
            exercises: updatedExercises,
            updatedAt: Timestamp.now(),
          },
        })
      },

      tickTimer: () => {
        if (get().isTimerRunning && !get().isPaused) {
          set((state) => ({ timerSeconds: state.timerSeconds + 1 }))
        }
      },

      togglePause: () => {
        set((state) => ({ isPaused: !state.isPaused }))
      },

      cancelWorkout: () => {
        set({
          activeSession: null,
          timerSeconds: 0,
          isTimerRunning: false,
          isPaused: false,
        })
      },

      completeWorkout: () => {
        const session = get().activeSession
        if (!session) return null

        // Calculate workout totals from completed sets
        let totalVolume = 0
        let totalSets = 0
        let totalReps = 0
        const muscles = new Set<string>()

        session.exercises.forEach((se) => {
          se.sets.forEach((set) => {
            if (set.completed) {
              totalSets++
              totalReps += set.reps || 0
              totalVolume += (set.weight || 0) * (set.reps || 0)
            }
          })
          if (se.exercise?.muscleGroups) {
            se.exercise.muscleGroups.forEach((m) => muscles.add(m))
          }
        })

        const finalSession: WorkoutSession = {
          ...session,
          status: "completed",
          completedAt: Timestamp.now(),
          durationSeconds: get().timerSeconds,
          totalVolume,
          totalSets,
          totalReps,
          musclesWorked: Array.from(muscles) as any[],
          updatedAt: Timestamp.now(),
        }

        // Reset state
        set({
          activeSession: null,
          timerSeconds: 0,
          isTimerRunning: false,
          isPaused: false,
        })

        return finalSession
      },

      updateSessionNotes: (notes) => {
        const session = get().activeSession
        if (!session) return
        set({
          activeSession: {
            ...session,
            notes,
            updatedAt: Timestamp.now(),
          },
        })
      },

      updateExerciseNotes: (sessionExerciseId, notes) => {
        const session = get().activeSession
        if (!session) return
        const updatedExercises = session.exercises.map((se) => {
          if (se.id !== sessionExerciseId) return se
          return { ...se, notes }
        })
        set({
          activeSession: {
            ...session,
            exercises: updatedExercises,
            updatedAt: Timestamp.now(),
          },
        })
      },

      reorderExercises: (startIndex, endIndex) => {
        const session = get().activeSession
        if (!session) return

        const reordered = Array.from(session.exercises)
        const [removed] = reordered.splice(startIndex, 1)
        if (removed) {
          reordered.splice(endIndex, 0, removed)
        }

        const updated = reordered.map((se, idx) => ({
          ...se,
          orderIndex: idx,
        }))

        set({
          activeSession: {
            ...session,
            exercises: updated,
            updatedAt: Timestamp.now(),
          },
        })
      },
    }),
    {
      name: "one-percent-workout-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist activeSession and timers
      partialize: (state) => ({
        activeSession: state.activeSession,
        timerSeconds: state.timerSeconds,
        isPaused: state.isPaused,
      }),
    },
  ),
)
