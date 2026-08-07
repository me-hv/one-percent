import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Timestamp } from "firebase/firestore"
import type { TrainingProgram, ProgramDay, ProgramExercise, WorkoutTemplate, Exercise } from "@/lib/types/training.types"

// ─── Helpers ──────────────────────────────────────────────────────
function genId(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

/** Returns a Firestore-compatible Timestamp-like object that is JSON-serializable */
function nowTs(): Timestamp {
  const now = Date.now()
  return {
    seconds: Math.floor(now / 1000),
    nanoseconds: (now % 1000) * 1e6,
    toDate: () => new Date(now),
    toMillis: () => now,
    isEqual: (other: Timestamp) => other.seconds === Math.floor(now / 1000),
    valueOf: () => `${Math.floor(now / 1000)}.${Math.floor((now % 1000) * 1e6)}`,
  } as unknown as Timestamp
}

// ─── State Shape ──────────────────────────────────────────────────
interface ProgramsState {
  programs: TrainingProgram[]
  templates: WorkoutTemplate[]
  customExercises: Exercise[]
  favoriteExerciseIds: string[]
  favoriteProgramIds: string[]

  // Program CRUD
  createProgram: (data: Omit<TrainingProgram, "id" | "userId" | "createdAt" | "updatedAt">) => TrainingProgram
  updateProgram: (id: string, updates: Partial<TrainingProgram>) => void
  deleteProgram: (id: string) => void
  duplicateProgram: (id: string) => TrainingProgram | null
  archiveProgram: (id: string) => void
  restoreProgram: (id: string) => void
  setActiveProgram: (id: string) => void
  importProgram: (programData: TrainingProgram) => TrainingProgram

  // Day & Schedule management
  addDay: (programId: string, day: Omit<ProgramDay, "id" | "orderIndex">) => void
  updateDay: (programId: string, dayId: string, updates: Partial<ProgramDay>) => void
  removeDay: (programId: string, dayId: string) => void
  reorderDays: (programId: string, startIndex: number, endIndex: number) => void
  duplicateDay: (programId: string, dayId: string) => void
  copyWeek: (programId: string) => void
  clearWeek: (programId: string) => void
  assignDayToWeekday: (programId: string, dayId: string, weekdayIndex: number | undefined) => void

  // Exercise management within a day
  addExerciseToDay: (programId: string, dayId: string, exercise: Omit<ProgramExercise, "id" | "orderIndex">) => void
  updateExerciseInDay: (programId: string, dayId: string, exerciseId: string, updates: Partial<ProgramExercise>) => void
  removeExerciseFromDay: (programId: string, dayId: string, exerciseId: string) => void
  reorderExercisesInDay: (programId: string, dayId: string, startIndex: number, endIndex: number) => void
  replaceExerciseInDay: (programId: string, dayId: string, exerciseId: string, newExerciseId: string) => void
  duplicateExerciseInDay: (programId: string, dayId: string, exerciseId: string) => void

  // Custom exercises CRUD
  addCustomExercise: (data: Omit<Exercise, "id" | "isCustom">) => Exercise
  updateCustomExercise: (id: string, updates: Partial<Exercise>) => void
  deleteCustomExercise: (id: string) => void

  // Templates CRUD
  createTemplate: (data: Omit<WorkoutTemplate, "id" | "userId" | "createdAt" | "updatedAt">) => WorkoutTemplate
  updateTemplate: (id: string, updates: Partial<WorkoutTemplate>) => void
  deleteTemplate: (id: string) => void
  duplicateTemplate: (id: string) => WorkoutTemplate | null
  toggleTemplateFavorite: (id: string) => void
  importTemplate: (templateData: WorkoutTemplate) => WorkoutTemplate

  // Favorites
  toggleFavoriteExercise: (exerciseId: string) => void
  toggleFavoriteProgram: (programId: string) => void
  isFavoriteExercise: (exerciseId: string) => boolean
  isFavoriteProgram: (programId: string) => boolean
}

// ─── Store ────────────────────────────────────────────────────────
export const useProgramsStore = create<ProgramsState>()(
  persist(
    (set, get) => ({
      programs: [],
      templates: [],
      customExercises: [],
      favoriteExerciseIds: [],
      favoriteProgramIds: [],

      // ─── Programs ──────────────────────────────────────────────
      createProgram: (data) => {
        const newProgram: TrainingProgram = {
          ...data,
          id: genId("prog"),
          userId: "",
          createdAt: nowTs(),
          updatedAt: nowTs(),
        }
        set((state) => ({
          programs: [
            ...(data.isActive
              ? state.programs.map((p) => ({ ...p, isActive: false }))
              : state.programs),
            newProgram,
          ],
        }))
        return newProgram
      },

      updateProgram: (id, updates) => {
        set((state) => ({
          programs: state.programs.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: nowTs() } : p
          ),
        }))
      },

      deleteProgram: (id) => {
        set((state) => ({ programs: state.programs.filter((p) => p.id !== id) }))
      },

      duplicateProgram: (id) => {
        const src = get().programs.find((p) => p.id === id)
        if (!src) return null
        const clone: TrainingProgram = {
          ...src,
          id: genId("prog"),
          name: `${src.name} (Copy)`,
          isActive: false,
          isArchived: false,
          startedAt: undefined,
          archivedAt: undefined,
          createdAt: nowTs(),
          updatedAt: nowTs(),
          days: src.days.map((day) => ({
            ...day,
            id: genId("day"),
            exercises: day.exercises.map((ex) => ({ ...ex, id: genId("pex") })),
          })),
        }
        set((state) => ({ programs: [...state.programs, clone] }))
        return clone
      },

      archiveProgram: (id) => {
        set((state) => ({
          programs: state.programs.map((p) =>
            p.id === id
              ? { ...p, isArchived: true, isActive: false, archivedAt: nowTs(), updatedAt: nowTs() }
              : p
          ),
        }))
      },

      restoreProgram: (id) => {
        set((state) => ({
          programs: state.programs.map((p) =>
            p.id === id ? { ...p, isArchived: false, archivedAt: undefined, updatedAt: nowTs() } : p
          ),
        }))
      },

      setActiveProgram: (id) => {
        set((state) => ({
          programs: state.programs.map((p) => ({
            ...p,
            isActive: p.id === id,
            updatedAt: p.id === id ? nowTs() : p.updatedAt,
          })),
        }))
      },

      importProgram: (programData) => {
        const imported: TrainingProgram = {
          ...programData,
          id: genId("prog"),
          createdAt: nowTs(),
          updatedAt: nowTs(),
          days: (programData.days || []).map((d) => ({
            ...d,
            id: genId("day"),
            exercises: (d.exercises || []).map((e) => ({ ...e, id: genId("pex") })),
          })),
        }
        set((state) => ({ programs: [...state.programs, imported] }))
        return imported
      },

      // ─── Days ─────────────────────────────────────────────────
      addDay: (programId, dayData) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            const newDay: ProgramDay = {
              ...dayData,
              id: genId("day"),
              orderIndex: p.days.length,
            }
            return { ...p, days: [...p.days, newDay], updatedAt: nowTs() }
          }),
        }))
      },

      updateDay: (programId, dayId, updates) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            return {
              ...p,
              days: p.days.map((d) => (d.id === dayId ? { ...d, ...updates } : d)),
              updatedAt: nowTs(),
            }
          }),
        }))
      },

      removeDay: (programId, dayId) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            const filtered = p.days.filter((d) => d.id !== dayId).map((d, i) => ({ ...d, orderIndex: i }))
            return { ...p, days: filtered, updatedAt: nowTs() }
          }),
        }))
      },

      reorderDays: (programId, startIndex, endIndex) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            const days = [...p.days]
            const [removed] = days.splice(startIndex, 1)
            if (removed) days.splice(endIndex, 0, removed)
            return { ...p, days: days.map((d, i) => ({ ...d, orderIndex: i })), updatedAt: nowTs() }
          }),
        }))
      },

      duplicateDay: (programId, dayId) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            const targetDay = p.days.find((d) => d.id === dayId)
            if (!targetDay) return p
            const cloneDay: ProgramDay = {
              ...targetDay,
              id: genId("day"),
              name: `${targetDay.name} (Copy)`,
              orderIndex: p.days.length,
              exercises: targetDay.exercises.map((e) => ({ ...e, id: genId("pex") })),
            }
            return { ...p, days: [...p.days, cloneDay], updatedAt: nowTs() }
          }),
        }))
      },

      copyWeek: (programId) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            const duplicatedDays = p.days.map((d, i) => ({
              ...d,
              id: genId("day"),
              orderIndex: p.days.length + i,
              exercises: d.exercises.map((e) => ({ ...e, id: genId("pex") })),
            }))
            return { ...p, days: [...p.days, ...duplicatedDays], updatedAt: nowTs() }
          }),
        }))
      },

      clearWeek: (programId) => {
        set((state) => ({
          programs: state.programs.map((p) =>
            p.id === programId ? { ...p, days: [], updatedAt: nowTs() } : p
          ),
        }))
      },

      assignDayToWeekday: (programId, dayId, weekdayIndex) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            return {
              ...p,
              days: p.days.map((d) => (d.id === dayId ? { ...d, dayOfWeek: weekdayIndex } : d)),
              updatedAt: nowTs(),
            }
          }),
        }))
      },

      // ─── Exercises in Days ────────────────────────────────────
      addExerciseToDay: (programId, dayId, exerciseData) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            return {
              ...p,
              days: p.days.map((d) => {
                if (d.id !== dayId) return d
                const newEx: ProgramExercise = {
                  ...exerciseData,
                  id: genId("pex"),
                  orderIndex: d.exercises.length,
                }
                return { ...d, exercises: [...d.exercises, newEx] }
              }),
              updatedAt: nowTs(),
            }
          }),
        }))
      },

      updateExerciseInDay: (programId, dayId, exerciseId, updates) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            return {
              ...p,
              days: p.days.map((d) => {
                if (d.id !== dayId) return d
                return {
                  ...d,
                  exercises: d.exercises.map((e) => (e.id === exerciseId ? { ...e, ...updates } : e)),
                }
              }),
              updatedAt: nowTs(),
            }
          }),
        }))
      },

      removeExerciseFromDay: (programId, dayId, exerciseId) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            return {
              ...p,
              days: p.days.map((d) => {
                if (d.id !== dayId) return d
                const filtered = d.exercises
                  .filter((e) => e.id !== exerciseId)
                  .map((e, i) => ({ ...e, orderIndex: i }))
                return { ...d, exercises: filtered }
              }),
              updatedAt: nowTs(),
            }
          }),
        }))
      },

      reorderExercisesInDay: (programId, dayId, startIndex, endIndex) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            return {
              ...p,
              days: p.days.map((d) => {
                if (d.id !== dayId) return d
                const exes = [...d.exercises]
                const [removed] = exes.splice(startIndex, 1)
                if (removed) exes.splice(endIndex, 0, removed)
                return { ...d, exercises: exes.map((e, i) => ({ ...e, orderIndex: i })) }
              }),
              updatedAt: nowTs(),
            }
          }),
        }))
      },

      replaceExerciseInDay: (programId, dayId, exerciseId, newExerciseId) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            return {
              ...p,
              days: p.days.map((d) => {
                if (d.id !== dayId) return d
                return {
                  ...d,
                  exercises: d.exercises.map((e) =>
                    e.id === exerciseId ? { ...e, exerciseId: newExerciseId, exercise: undefined } : e
                  ),
                }
              }),
              updatedAt: nowTs(),
            }
          }),
        }))
      },

      duplicateExerciseInDay: (programId, dayId, exerciseId) => {
        set((state) => ({
          programs: state.programs.map((p) => {
            if (p.id !== programId) return p
            return {
              ...p,
              days: p.days.map((d) => {
                if (d.id !== dayId) return d
                const src = d.exercises.find((e) => e.id === exerciseId)
                if (!src) return d
                const clone: ProgramExercise = {
                  ...src,
                  id: genId("pex"),
                  orderIndex: d.exercises.length,
                }
                return { ...d, exercises: [...d.exercises, clone] }
              }),
              updatedAt: nowTs(),
            }
          }),
        }))
      },

      // ─── Custom Exercises ──────────────────────────────────────
      addCustomExercise: (data) => {
        const customEx: Exercise = {
          ...data,
          id: genId("ex-custom"),
          isCustom: true,
        }
        set((state) => ({ customExercises: [...state.customExercises, customEx] }))
        return customEx
      },

      updateCustomExercise: (id, updates) => {
        set((state) => ({
          customExercises: state.customExercises.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }))
      },

      deleteCustomExercise: (id) => {
        set((state) => ({
          customExercises: state.customExercises.filter((e) => e.id !== id),
        }))
      },

      // ─── Templates ────────────────────────────────────────────
      createTemplate: (data) => {
        const newTemplate: WorkoutTemplate = {
          ...data,
          id: genId("tmpl"),
          userId: "",
          createdAt: nowTs(),
          updatedAt: nowTs(),
        }
        set((state) => ({ templates: [...state.templates, newTemplate] }))
        return newTemplate
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: nowTs() } : t
          ),
        }))
      },

      deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }))
      },

      duplicateTemplate: (id) => {
        const src = get().templates.find((t) => t.id === id)
        if (!src) return null
        const clone: WorkoutTemplate = {
          ...src,
          id: genId("tmpl"),
          name: `${src.name} (Copy)`,
          isFavorite: false,
          createdAt: nowTs(),
          updatedAt: nowTs(),
          exercises: src.exercises.map((e) => ({ ...e, id: genId("pex") })),
        }
        set((state) => ({ templates: [...state.templates, clone] }))
        return clone
      },

      toggleTemplateFavorite: (id) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
          ),
        }))
      },

      importTemplate: (templateData) => {
        const imported: WorkoutTemplate = {
          ...templateData,
          id: genId("tmpl"),
          createdAt: nowTs(),
          updatedAt: nowTs(),
          exercises: (templateData.exercises || []).map((e) => ({ ...e, id: genId("pex") })),
        }
        set((state) => ({ templates: [...state.templates, imported] }))
        return imported
      },

      // ─── Favorites ────────────────────────────────────────────
      toggleFavoriteExercise: (exerciseId) => {
        set((state) => {
          const ids = state.favoriteExerciseIds
          return {
            favoriteExerciseIds: ids.includes(exerciseId)
              ? ids.filter((id) => id !== exerciseId)
              : [...ids, exerciseId],
          }
        })
      },

      toggleFavoriteProgram: (programId) => {
        set((state) => {
          const ids = state.favoriteProgramIds
          return {
            favoriteProgramIds: ids.includes(programId)
              ? ids.filter((id) => id !== programId)
              : [...ids, programId],
          }
        })
      },

      isFavoriteExercise: (exerciseId) => get().favoriteExerciseIds.includes(exerciseId),
      isFavoriteProgram: (programId) => get().favoriteProgramIds.includes(programId),
    }),
    {
      name: "one-percent-programs-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
