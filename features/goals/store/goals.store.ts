import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Goal, GoalCategory, GoalPriority, GoalStatus } from "@/lib/types/goals.types"
import type { WorkoutSession } from "@/lib/types/training.types"
import type { WeightLog, BodyMeasurements } from "@/lib/types/body.types"
import type { HabitLog } from "@/lib/types/habits.types"
import { syncGoalsWithLiveData } from "@/features/goals/services/goals-sync.service"

const mockTimestamp = (date: Date): any => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
})

const genId = (prefix: string) => `${prefix}-${Math.random().toString(36).substring(2, 9)}`

const INITIAL_GOALS: Goal[] = [
  {
    id: "goal-1",
    userId: "user-1",
    title: "Bench Press 100kg",
    description: "Reach a 100kg one-rep max on Barbell Flat Bench Press",
    category: "strength",
    priority: "high",
    type: "numeric",
    startValue: 80,
    currentValue: 92.5,
    targetValue: 100,
    unit: "kg",
    autoUpdateKey: "bench_press",
    exerciseId: "ex-chest-001",
    status: "active",
    progressPct: 62.5,
    createdAt: mockTimestamp(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)),
    updatedAt: mockTimestamp(new Date()),
  },
  {
    id: "goal-2",
    userId: "user-1",
    title: "Deadlift 180kg",
    description: "Pull 180kg with clean technique and lockout",
    category: "strength",
    priority: "high",
    type: "numeric",
    startValue: 140,
    currentValue: 165,
    targetValue: 180,
    unit: "kg",
    autoUpdateKey: "deadlift",
    exerciseId: "ex-back-001",
    status: "active",
    progressPct: 62.5,
    createdAt: mockTimestamp(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)),
    updatedAt: mockTimestamp(new Date()),
  },
  {
    id: "goal-3",
    userId: "user-1",
    title: "Reach 80kg Bodyweight",
    description: "Lean mass gain phase targeting 80kg morning weight",
    category: "body_comp",
    priority: "medium",
    type: "numeric",
    startValue: 74,
    currentValue: 78.4,
    targetValue: 80,
    unit: "kg",
    autoUpdateKey: "body_weight",
    status: "active",
    progressPct: 73.3,
    createdAt: mockTimestamp(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)),
    updatedAt: mockTimestamp(new Date()),
  },
  {
    id: "goal-4",
    userId: "user-1",
    title: "Train 5x Per Week",
    description: "Maintain 5 completed workout sessions per calendar week",
    category: "consistency",
    priority: "high",
    type: "numeric",
    startValue: 3,
    currentValue: 5,
    targetValue: 5,
    unit: "sessions",
    autoUpdateKey: "weekly_sessions",
    status: "active",
    progressPct: 100,
    createdAt: mockTimestamp(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    updatedAt: mockTimestamp(new Date()),
  },
  {
    id: "goal-5",
    userId: "user-1",
    title: "Complete 12-Week Hypertrophy Program",
    description: "Finish all 12 weeks of Push Pull Legs macrocycle without skipping",
    category: "consistency",
    priority: "medium",
    type: "numeric",
    startValue: 0,
    currentValue: 8,
    targetValue: 12,
    unit: "weeks",
    autoUpdateKey: "program_completion",
    status: "active",
    progressPct: 66.7,
    createdAt: mockTimestamp(new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)),
    updatedAt: mockTimestamp(new Date()),
  },
]

interface GoalsState {
  goals: Goal[]
  categoryFilter: "all" | GoalCategory
  priorityFilter: "all" | GoalPriority
  statusFilter: "all" | GoalStatus
  searchQuery: string
  milestoneNotifications: string[]

  // Actions
  addGoal: (goal: Omit<Goal, "id" | "userId" | "progressPct" | "createdAt" | "updatedAt">) => Goal
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  setCategoryFilter: (cat: "all" | GoalCategory) => void
  setPriorityFilter: (pri: "all" | GoalPriority) => void
  setStatusFilter: (stat: "all" | GoalStatus) => void
  setSearchQuery: (query: string) => void
  syncLiveData: (
    sessions?: WorkoutSession[],
    weightLogs?: WeightLog[],
    measurements?: BodyMeasurements[],
    habitLogs?: HabitLog[]
  ) => void
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: INITIAL_GOALS,
      categoryFilter: "all",
      priorityFilter: "all",
      statusFilter: "active",
      searchQuery: "",
      milestoneNotifications: [],

      addGoal: (goalInput) => {
        const startVal = goalInput.startValue ?? 0
        const curVal = goalInput.currentValue ?? startVal
        const tgtVal = goalInput.targetValue ?? startVal
        const diff = Math.abs(tgtVal - startVal)

        const progressPct = diff > 0 ? Math.min(100, Math.round((Math.abs(curVal - startVal) / diff) * 100)) : 0
        const isCompleted = progressPct >= 100

        const newGoal: Goal = {
          ...goalInput,
          id: genId("goal"),
          userId: "user-1",
          progressPct,
          status: isCompleted ? "completed" : goalInput.status || "active",
          createdAt: mockTimestamp(new Date()),
          updatedAt: mockTimestamp(new Date()),
        }

        set({ goals: [newGoal, ...get().goals] })
        return newGoal
      },

      updateGoal: (id, updates) => {
        set({
          goals: get().goals.map((g) => {
            if (g.id !== id) return g
            const merged: Goal = { ...g, ...updates, updatedAt: mockTimestamp(new Date()) }

            if (merged.startValue != null && merged.targetValue != null && merged.currentValue != null) {
              const diff = Math.abs(merged.targetValue - merged.startValue)
              merged.progressPct =
                diff > 0
                  ? Math.min(100, Math.round((Math.abs(merged.currentValue - merged.startValue) / diff) * 100))
                  : 0
            }

            if (merged.progressPct >= 100) {
              merged.status = "completed"
              if (!merged.completedAt) merged.completedAt = mockTimestamp(new Date())
            }

            return merged
          }),
        })
      },

      deleteGoal: (id) => {
        set({ goals: get().goals.filter((g) => g.id !== id) })
      },

      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      syncLiveData: (sessions = [], weightLogs = [], measurements = [], habitLogs = []) => {
        const { updatedGoals, notifications } = syncGoalsWithLiveData(
          get().goals,
          sessions,
          weightLogs,
          measurements,
          habitLogs
        )

        set({
          goals: updatedGoals,
          milestoneNotifications: notifications,
        })
      },
    }),
    {
      name: "onepercent_goals_store",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
