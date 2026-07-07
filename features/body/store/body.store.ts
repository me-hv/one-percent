"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Timestamp } from "firebase/firestore"
import type { WeightLog, BodyMeasurements, ProgressPhoto } from "@/lib/types/body.types"
import type { Goal } from "@/lib/types/goals.types"
import type { Habit, HabitLog } from "@/lib/types/habits.types"
import type { SleepLog, RecoveryScore, ReadinessLog } from "@/lib/types/recovery.types"
import { subDays, formatDateKey } from "@/lib/utils/date"

// ─── Helpers ──────────────────────────────────────────────────────
function genId(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

function mockTimestamp(date: Date): Timestamp {
  const ms = date.getTime()
  return {
    seconds: Math.floor(ms / 1000),
    nanoseconds: (ms % 1000) * 1e6,
    toDate: () => date,
    toMillis: () => ms,
    isEqual: (other: Timestamp) => other.seconds === Math.floor(ms / 1000),
    valueOf: () => `${Math.floor(ms / 1000)}.${Math.floor((ms % 1000) * 1e6)}`,
  } as unknown as Timestamp
}

const SILHOUETTE_FRONT = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400" width="200" height="400" style="background:%230A0A0A;"><path d="M100 40c8 0 14-6 14-14s-6-14-14-14-14 6-14 14 6 14 14 14zm0 18c-20 0-25 15-28 35-2 15-4 40-10 60-4 12-8 22-8 30s6 12 12 8c4-3 8-15 11-28 3-15 4-30 5-45 0 20-2 45-2 70v90c0 10 5 15 10 15s10-5 10-15v-75h4v75c0 10 5 15 10 15s10-5 10-15v-90c0-25-2-50-2-70 1 15 2 30 5 45 3 13 7 25 11 28 6 4 12 0 12-8s-4-18-8-30c-6-20-8-45-10-60-3-20-8-35-28-35z" fill="%2322C55E" opacity="0.35"/><rect x="10" y="10" width="180" height="380" fill="none" stroke="%2322C55E" stroke-width="0.5" stroke-dasharray="2 4" opacity="0.2"/></svg>`
const SILHOUETTE_SIDE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400" width="200" height="400" style="background:%230A0A0A;"><path d="M96 40c7 0 13-6 13-13s-6-13-13-13-13 6-13 13 6 13 13 13zm0 18c-12 0-22 10-22 30 0 20 6 35 12 55 4 12 8 30 8 50v80c0 10 4 14 8 14s8-4 8-14v-60c0 15 2 35 2 50 0 10 4 10 8 10s8-4 8-14v-90c0-30-12-40-16-65-3-15-2-30-6-45-2-8-6-15-10-15z" fill="%2322C55E" opacity="0.35"/><rect x="10" y="10" width="180" height="380" fill="none" stroke="%2322C55E" stroke-width="0.5" stroke-dasharray="2 4" opacity="0.2"/></svg>`
const SILHOUETTE_BACK = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400" width="200" height="400" style="background:%230A0A0A;"><path d="M100 40c8 0 14-6 14-14s-6-14-14-14-14 6-14 14 6 14 14 14zm0 18c-20 0-25 15-28 35-2 15-4 40-10 60-4 12-8 22-8 30s6 12 12 8c4-3 8-15 11-28 3-15 4-30 5-45 0 20-2 45-2 70v90c0 10 5 15 10 15s10-5 10-15v-75h4v75c0 10 5 15 10 15s10-5 10-15v-90c0-25-2-50-2-70 1 15 2 30 5 45 3 13 7 25 11 28 6 4 12 0 12-8s-4-18-8-30c-6-20-8-45-10-60-3-20-8-35-28-35z" fill="%2322C55E" opacity="0.25"/><path d="M85 85h30v5H85zm-5 25h40v3H80z" fill="%2322C55E" opacity="0.4"/><rect x="10" y="10" width="180" height="380" fill="none" stroke="%2322C55E" stroke-width="0.5" stroke-dasharray="2 4" opacity="0.2"/></svg>`

// ─── Initial Seed Data (30 Days History) ──────────────────────────
const seedWeightLogs = (): WeightLog[] => {
  const logs: WeightLog[] = []
  const baseWeight = 82.5
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i)
    // Daily minor fluctuations with a general downward progress trend
    const noise = Math.sin(i * 0.5) * 0.25 + (Math.random() - 0.5) * 0.15
    const trend = -((30 - i) * 0.08) // Losing ~2.4 kg over 30 days
    const weight = Math.round((baseWeight + trend + noise) * 10) / 10
    logs.push({
      id: genId("w"),
      userId: "user-1",
      weightKg: weight,
      loggedAt: mockTimestamp(date),
      date: formatDateKey(date),
      notes: i === 30 ? "Starting weight" : i === 0 ? "Morning weigh-in" : undefined,
      createdAt: mockTimestamp(date),
    })
  }
  return logs
}

const seedMeasurements = (): BodyMeasurements[] => {
  const dates = [30, 15, 0]
  const list: BodyMeasurements[] = []
  dates.forEach((daysAgo, idx) => {
    const date = subDays(new Date(), daysAgo)
    list.push({
      id: genId("m"),
      userId: "user-1",
      date: formatDateKey(date),
      loggedAt: mockTimestamp(date),
      neck: 38.5 - idx * 0.1,
      shoulders: 120.0 + idx * 0.3,
      chest: 104.0 + idx * 0.4,
      bicepLeft: 36.5 + idx * 0.25,
      bicepRight: 36.7 + idx * 0.20,
      forearmLeft: 29.5 + idx * 0.1,
      forearmRight: 29.7 + idx * 0.1,
      waist: 86.5 - idx * 0.6, // Significant waist loss
      hips: 98.0 - idx * 0.3,
      thighLeft: 58.5 - idx * 0.1,
      thighRight: 58.6 - idx * 0.1,
      calfLeft: 38.0,
      calfRight: 38.1,
      bodyFatPct: 18.5 - idx * 0.5,
      skeletalMuscleKg: 35.2 + idx * 0.3,
      notes: idx === 0 ? "Waist is dropping nicely, biceps showing growth." : undefined,
      createdAt: mockTimestamp(date),
      updatedAt: mockTimestamp(date),
    })
  })
  return list
}

const seedPhotos = (): ProgressPhoto[] => {
  const dates = [30, 15, 0]
  const list: ProgressPhoto[] = []
  dates.forEach((daysAgo, idx) => {
    const date = subDays(new Date(), daysAgo)
    const dateStr = formatDateKey(date)
    list.push({
      id: genId("photo-front"),
      userId: "user-1",
      storagePath: `photos/front-${dateStr}.jpg`,
      url: SILHOUETTE_FRONT,
      date: dateStr,
      pose: "front",
      weightKg: 82.5 - idx * 1.2,
      notes: `Front check-in - Day ${30 - daysAgo}`,
      createdAt: mockTimestamp(date),
    })
    list.push({
      id: genId("photo-side"),
      userId: "user-1",
      storagePath: `photos/side-${dateStr}.jpg`,
      url: SILHOUETTE_SIDE,
      date: dateStr,
      pose: "side",
      weightKg: 82.5 - idx * 1.2,
      notes: `Side check-in - Day ${30 - daysAgo}`,
      createdAt: mockTimestamp(date),
    })
  })
  return list
}

const seedGoals = (): Goal[] => [
  {
    id: "goal-1",
    userId: "user-1",
    title: "Deadlift 200kg 1RM",
    description: "Get strength up on conventional deadlifts.",
    category: "training",
    type: "numeric",
    startValue: 160,
    targetValue: 200,
    currentValue: 190,
    unit: "kg",
    status: "active",
    progressPct: 75,
    createdAt: mockTimestamp(subDays(new Date(), 30)),
    updatedAt: mockTimestamp(new Date()),
  },
  {
    id: "goal-2",
    userId: "user-1",
    title: "Reduce Waist to 80cm",
    description: "Target body fat reduction.",
    category: "body_measurement",
    type: "numeric",
    startValue: 86.5,
    targetValue: 80.0,
    currentValue: 83.5,
    unit: "cm",
    status: "active",
    progressPct: 46,
    createdAt: mockTimestamp(subDays(new Date(), 30)),
    updatedAt: mockTimestamp(new Date()),
  },
]

const seedHabits = (): Habit[] => [
  {
    id: "habit-1",
    userId: "user-1",
    name: "10 min mobility flow",
    description: "Keep joints healthy and warm up for sessions.",
    frequency: "daily",
    category: "recovery",
    targetCount: 1,
    unit: "completed",
    archived: false,
    streak: 6,
    bestStreak: 12,
    totalCompletions: 22,
    createdAt: mockTimestamp(subDays(new Date(), 30)),
    updatedAt: mockTimestamp(new Date()),
  },
  {
    id: "habit-2",
    userId: "user-1",
    name: "Drink 4L Water",
    description: "Hydration target for recovery and muscle function.",
    frequency: "daily",
    category: "hydration",
    targetCount: 8,
    unit: "cups",
    archived: false,
    streak: 3,
    bestStreak: 9,
    totalCompletions: 19,
    createdAt: mockTimestamp(subDays(new Date(), 30)),
    updatedAt: mockTimestamp(new Date()),
  },
  {
    id: "habit-3",
    userId: "user-1",
    name: "Log all food intake",
    description: "Ensure calories and macros targets are logged.",
    frequency: "daily",
    category: "nutrition",
    targetCount: 1,
    unit: "completed",
    archived: false,
    streak: 5,
    bestStreak: 14,
    totalCompletions: 24,
    createdAt: mockTimestamp(subDays(new Date(), 30)),
    updatedAt: mockTimestamp(new Date()),
  },
  {
    id: "habit-4",
    userId: "user-1",
    name: "8h Sleep time",
    description: "Track sleep duration for optimal performance.",
    frequency: "daily",
    category: "recovery",
    targetCount: 1,
    unit: "completed",
    archived: false,
    streak: 2,
    bestStreak: 8,
    totalCompletions: 17,
    createdAt: mockTimestamp(subDays(new Date(), 30)),
    updatedAt: mockTimestamp(new Date()),
  },
]

const seedHabitLogs = (): HabitLog[] => {
  const logs: HabitLog[] = []
  const todayStr = formatDateKey(new Date())
  
  // Seed logs for the past 7 days
  for (let i = 7; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dateStr = formatDateKey(date)
    
    // habit-1 (mobility)
    logs.push({
      id: genId("hl"),
      userId: "user-1",
      habitId: "habit-1",
      date: dateStr,
      count: i === 3 ? 0 : 1, // Missed one day
      completed: i !== 3,
      createdAt: mockTimestamp(date),
      updatedAt: mockTimestamp(date),
    })

    // habit-2 (water)
    logs.push({
      id: genId("hl"),
      userId: "user-1",
      habitId: "habit-2",
      date: dateStr,
      count: i === 4 ? 4 : 8,
      completed: i !== 4,
      createdAt: mockTimestamp(date),
      updatedAt: mockTimestamp(date),
    })

    // habit-3 (food logging)
    logs.push({
      id: genId("hl"),
      userId: "user-1",
      habitId: "habit-3",
      date: dateStr,
      count: 1,
      completed: true,
      createdAt: mockTimestamp(date),
      updatedAt: mockTimestamp(date),
    })

    // habit-4 (sleep)
    logs.push({
      id: genId("hl"),
      userId: "user-1",
      habitId: "habit-4",
      date: dateStr,
      count: i === 1 || i === 5 ? 0 : 1, // Missed couple days
      completed: i !== 1 && i !== 5,
      createdAt: mockTimestamp(date),
      updatedAt: mockTimestamp(date),
    })
  }
  return logs
}

const seedSleepLogs = (): SleepLog[] => {
  const list: SleepLog[] = []
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const baseHRV = 70
    const noiseHRV = Math.sin(i) * 5 + (Math.random() - 0.5) * 3
    const baseHR = 55
    const noiseHR = Math.cos(i) * 2 + (Math.random() - 0.5) * 2
    
    list.push({
      id: genId("s"),
      userId: "user-1",
      date: formatDateKey(date),
      asleepAt: mockTimestamp(subDays(date, 1)),
      awakeAt: mockTimestamp(date),
      durationSeconds: (7 * 3600 + Math.round(Math.random() * 90 * 60)), // 7h to 8.5h
      timeInBedSeconds: 8 * 3600,
      qualityScore: Math.round(75 + Math.random() * 20),
      restingHR: Math.round(baseHR + noiseHR),
      hrv: Math.round(baseHRV + noiseHRV),
      source: "oura",
      createdAt: mockTimestamp(date),
      updatedAt: mockTimestamp(date),
    })
  }
  return list
}

const seedRecoveryScores = (): RecoveryScore[] => {
  const list: RecoveryScore[] = []
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const baseScore = 80
    const noise = Math.sin(i * 0.8) * 12 + (Math.random() - 0.5) * 5
    list.push({
      id: genId("rec"),
      userId: "user-1",
      date: formatDateKey(date),
      score: Math.min(Math.max(Math.round(baseScore + noise), 30), 100),
      hrv: Math.round(70 + Math.sin(i) * 6),
      restingHR: Math.round(54 + Math.cos(i) * 3),
      sleepPerformancePct: Math.round(85 + Math.random() * 15),
      source: "oura",
      createdAt: mockTimestamp(date),
      updatedAt: mockTimestamp(date),
    })
  }
  return list
}

const seedReadinessLogs = (): ReadinessLog[] => {
  const list: ReadinessLog[] = []
  for (let i = 10; i >= 0; i--) {
    const date = subDays(new Date(), i)
    list.push({
      id: genId("readi"),
      userId: "user-1",
      date: formatDateKey(date),
      soreness: Math.max(Math.round(3 + Math.sin(i) * 2), 1),
      soreMuscles: i % 3 === 0 ? ["quads", "hamstrings"] : i % 3 === 1 ? ["chest", "triceps"] : [],
      energy: Math.min(Math.max(Math.round(7 + Math.cos(i) * 2), 1), 10),
      stress: Math.min(Math.max(Math.round(4 + Math.sin(i) * 1.5), 1), 10),
      motivation: Math.min(Math.max(Math.round(8 + Math.cos(i) * 1), 1), 10),
      createdAt: mockTimestamp(date),
    })
  }
  return list
}

// ─── Store Interface ──────────────────────────────────────────────
interface BodyState {
  weightLogs: WeightLog[]
  measurements: BodyMeasurements[]
  photos: ProgressPhoto[]
  goals: Goal[]
  habits: Habit[]
  habitLogs: HabitLog[]
  sleepLogs: SleepLog[]
  recoveryScores: RecoveryScore[]
  readinessLogs: ReadinessLog[]

  // Daily Nutrition
  nutrition: {
    caloriesLogged: number
    caloriesTarget: number
    proteinLogged: number
    proteinTarget: number
    carbsLogged: number
    carbsTarget: number
    fatLogged: number
    fatTarget: number
  }

  // Weight actions
  addWeightLog: (weight: number, notes?: string, date?: string) => WeightLog
  editWeightLog: (id: string, weight: number, notes?: string) => void
  deleteWeightLog: (id: string) => void

  // Measurements actions
  addMeasurements: (meas: Omit<BodyMeasurements, "id" | "userId" | "loggedAt" | "createdAt" | "updatedAt">) => BodyMeasurements
  deleteMeasurements: (id: string) => void

  // Photos actions
  addProgressPhoto: (url: string, pose: ProgressPhoto["pose"], notes?: string, date?: string) => ProgressPhoto
  deleteProgressPhoto: (id: string) => void

  // Goal actions
  addGoal: (goal: Omit<Goal, "id" | "userId" | "progressPct" | "createdAt" | "updatedAt">) => Goal
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void

  // Habit actions
  toggleHabitLog: (habitId: string, date: string) => void
  incrementHabitLog: (habitId: string, date: string, count: number) => void
  addHabit: (name: string, category: Habit["category"], target: number, unit?: string) => Habit
  deleteHabit: (id: string) => void

  // Nutrition actions
  logNutrition: (calories: number, protein: number, carbs: number, fat: number) => void
}

export const useBodyStore = create<BodyState>()(
  persist(
    (set, get) => ({
      weightLogs: seedWeightLogs(),
      measurements: seedMeasurements(),
      photos: seedPhotos(),
      goals: seedGoals(),
      habits: seedHabits(),
      habitLogs: seedHabitLogs(),
      sleepLogs: seedSleepLogs(),
      recoveryScores: seedRecoveryScores(),
      readinessLogs: seedReadinessLogs(),
      nutrition: {
        caloriesLogged: 1850,
        caloriesTarget: 2400,
        proteinLogged: 145,
        proteinTarget: 180,
        carbsLogged: 210,
        carbsTarget: 260,
        fatLogged: 60,
        fatTarget: 80,
      },

      addWeightLog: (weight, notes, date) => {
        const logDate = date ? new Date(date) : new Date()
        const dateStr = formatDateKey(logDate)
        
        // Remove duplicate entry for the same day if exists, to avoid multiple weigh-ins
        const cleanedLogs = get().weightLogs.filter((w) => w.date !== dateStr)

        const newLog: WeightLog = {
          id: genId("w"),
          userId: "user-1",
          weightKg: weight,
          loggedAt: mockTimestamp(logDate),
          date: dateStr,
          notes: notes || undefined,
          createdAt: mockTimestamp(new Date()),
        }
        set({
          weightLogs: [...cleanedLogs, newLog].sort((a, b) => b.date.localeCompare(a.date)),
        })
        return newLog
      },

      editWeightLog: (id, weight, notes) => {
        set({
          weightLogs: get().weightLogs.map((w) =>
            w.id === id
              ? {
                  ...w,
                  weightKg: weight,
                  notes: notes || undefined,
                }
              : w
          ),
        })
      },

      deleteWeightLog: (id) => {
        set({
          weightLogs: get().weightLogs.filter((w) => w.id !== id),
        })
      },

      addMeasurements: (meas) => {
        const logDate = meas.date ? new Date(meas.date) : new Date()
        
        // Remove duplicate entry for the same day
        const cleanedMeas = get().measurements.filter((m) => m.date !== meas.date)

        const newMeas: BodyMeasurements = {
          ...meas,
          id: genId("m"),
          userId: "user-1",
          loggedAt: mockTimestamp(logDate),
          createdAt: mockTimestamp(new Date()),
          updatedAt: mockTimestamp(new Date()),
        }

        set({
          measurements: [...cleanedMeas, newMeas].sort((a, b) => b.date.localeCompare(a.date)),
        })
        return newMeas
      },

      deleteMeasurements: (id) => {
        set({
          measurements: get().measurements.filter((m) => m.id !== id),
        })
      },

      addProgressPhoto: (url, pose, notes, date) => {
        const photoDate = date ? new Date(date) : new Date()
        const dateStr = formatDateKey(photoDate)

        const newPhoto: ProgressPhoto = {
          id: genId("photo"),
          userId: "user-1",
          storagePath: `photos/${pose}-${dateStr}.jpg`,
          url,
          date: dateStr,
          pose,
          notes: notes || undefined,
          createdAt: mockTimestamp(photoDate),
        }

        set({
          photos: [newPhoto, ...get().photos],
        })
        return newPhoto
      },

      deleteProgressPhoto: (id) => {
        set({
          photos: get().photos.filter((p) => p.id !== id),
        })
      },

      addGoal: (goal) => {
        const progressPct =
          goal.startValue != null && goal.targetValue != null && goal.currentValue != null
            ? Math.round(
                (Math.abs(goal.currentValue - goal.startValue) /
                  Math.abs(goal.targetValue - goal.startValue)) *
                  100
              )
            : 0

        const newGoal: Goal = {
          ...goal,
          id: genId("goal"),
          userId: "user-1",
          progressPct: Math.min(progressPct, 100),
          createdAt: mockTimestamp(new Date()),
          updatedAt: mockTimestamp(new Date()),
        }

        set({
          goals: [...get().goals, newGoal],
        })
        return newGoal
      },

      updateGoal: (id, updates) => {
        set({
          goals: get().goals.map((g) => {
            if (g.id !== id) return g
            const merged = { ...g, ...updates, updatedAt: mockTimestamp(new Date()) }
            
            // Recompute progressPct if values are updated
            if (
              merged.startValue != null &&
              merged.targetValue != null &&
              merged.currentValue != null
            ) {
              const diff = Math.abs(merged.targetValue - merged.startValue)
              merged.progressPct =
                diff > 0
                  ? Math.min(
                      Math.round((Math.abs(merged.currentValue - merged.startValue) / diff) * 100),
                      100
                    )
                  : 0
            }
            if (merged.progressPct >= 100) {
              merged.status = "completed"
              merged.completedAt = mockTimestamp(new Date())
            }
            return merged
          }),
        })
      },

      deleteGoal: (id) => {
        set({
          goals: get().goals.filter((g) => g.id !== id),
        })
      },

      toggleHabitLog: (habitId, date) => {
        const logs = get().habitLogs
        const found = logs.find((l) => l.habitId === habitId && l.date === date)
        const targetHabit = get().habits.find((h) => h.id === habitId)
        if (!targetHabit) return

        let updatedLogs: HabitLog[] = []
        let completed = false

        if (found) {
          completed = !found.completed
          updatedLogs = logs.map((l) =>
            l.id === found.id
              ? {
                  ...l,
                  completed,
                  count: completed ? targetHabit.targetCount : 0,
                  updatedAt: mockTimestamp(new Date()),
                }
              : l
          )
        } else {
          completed = true
          const newLog: HabitLog = {
            id: genId("hl"),
            userId: "user-1",
            habitId,
            date,
            count: targetHabit.targetCount,
            completed: true,
            createdAt: mockTimestamp(new Date()),
            updatedAt: mockTimestamp(new Date()),
          }
          updatedLogs = [...logs, newLog]
        }

        set({ habitLogs: updatedLogs })

        // Recalculate streak for this habit
        const sortedLogs = updatedLogs
          .filter((l) => l.habitId === habitId && l.completed)
          .sort((a, b) => b.date.localeCompare(a.date))

        let streak = 0
        let tempDate = new Date()

        for (let i = 0; i < 30; i++) {
          const checkStr = formatDateKey(tempDate)
          const logged = sortedLogs.find((l) => l.date === checkStr)
          if (logged) {
            streak++
          } else {
            // Allow today to be missing if we checked yesterday
            if (i > 0) break
          }
          tempDate = subDays(tempDate, 1)
        }

        set({
          habits: get().habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  streak,
                  bestStreak: Math.max(h.bestStreak, streak),
                  totalCompletions: h.totalCompletions + (completed ? 1 : -1),
                  updatedAt: mockTimestamp(new Date()),
                }
              : h
          ),
        })
      },

      incrementHabitLog: (habitId, date, count) => {
        const logs = get().habitLogs
        const targetHabit = get().habits.find((h) => h.id === habitId)
        if (!targetHabit) return

        const found = logs.find((l) => l.habitId === habitId && l.date === date)
        let updatedLogs: HabitLog[] = []
        let finalCount = count

        if (found) {
          finalCount = found.count + count
          if (finalCount < 0) finalCount = 0
          const completed = finalCount >= targetHabit.targetCount

          updatedLogs = logs.map((l) =>
            l.id === found.id
              ? {
                  ...l,
                  count: finalCount,
                  completed,
                  updatedAt: mockTimestamp(new Date()),
                }
              : l
          )
        } else {
          if (finalCount < 0) finalCount = 0
          const completed = finalCount >= targetHabit.targetCount
          const newLog: HabitLog = {
            id: genId("hl"),
            userId: "user-1",
            habitId,
            date,
            count: finalCount,
            completed,
            createdAt: mockTimestamp(new Date()),
            updatedAt: mockTimestamp(new Date()),
          }
          updatedLogs = [...logs, newLog]
        }

        set({
          habitLogs: updatedLogs,
          habits: get().habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  totalCompletions: h.totalCompletions + (finalCount >= h.targetCount ? 1 : 0),
                  updatedAt: mockTimestamp(new Date()),
                }
              : h
          ),
        })
      },

      addHabit: (name, category, target, unit) => {
        const newHabit: Habit = {
          id: genId("habit"),
          userId: "user-1",
          name,
          frequency: "daily",
          category,
          targetCount: target,
          unit: unit || "completed",
          archived: false,
          streak: 0,
          bestStreak: 0,
          totalCompletions: 0,
          createdAt: mockTimestamp(new Date()),
          updatedAt: mockTimestamp(new Date()),
        }
        set({
          habits: [...get().habits, newHabit],
        })
        return newHabit
      },

      deleteHabit: (id) => {
        set({
          habits: get().habits.filter((h) => h.id !== id),
          habitLogs: get().habitLogs.filter((l) => l.habitId !== id),
        })
      },

      logNutrition: (calories, protein, carbs, fat) => {
        set({
          nutrition: {
            ...get().nutrition,
            caloriesLogged: calories,
            proteinLogged: protein,
            carbsLogged: carbs,
            fatLogged: fat,
          }
        })
      },
    }),
    {
      name: "one-percent-body-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
