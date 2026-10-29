import { describe, it, expect } from "vitest"
import { generateWeeklyReview } from "../services/weekly-review.service"
import type { WorkoutSession, TrainingProgram } from "@/lib/types/training.types"
import type { DailyRecoveryEntry } from "@/lib/types/recovery.types"
import type { DailyNutritionLog, NutritionTargets } from "@/lib/types/nutrition.types"

describe("weekly-review.service", () => {
  const now = new Date()
  const todayMs = now.getTime()

  const createCompletedSession = (daysAgo: number, volumeKg: number): WorkoutSession => ({
    id: `sess-${daysAgo}`,
    userId: "usr-1",
    name: "Workout Day",
    status: "completed",
    totalVolume: volumeKg,
    totalSets: 1,
    totalReps: 10,
    exerciseCount: 1,
    musclesWorked: ["chest"],
    startedAt: { toDate: () => new Date(todayMs - daysAgo * 86400000 - 3600000) } as any,
    completedAt: { toDate: () => new Date(todayMs - daysAgo * 86400000) } as any,
    durationSeconds: 3600,
    exercises: [
      {
        id: "ex-1",
        exerciseId: "bench",
        orderIndex: 0,
        sets: [
          {
            id: "s-1",
            setNumber: 1,
            type: "normal",
            isWarmup: false,
            isDropset: false,
            reps: 10,
            weight: volumeKg / 10,
            completed: true,
          },
        ],
      },
    ],
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
  })

  const mockProgram: TrainingProgram = {
    id: "prog-1",
    userId: "usr-1",
    name: "Upper Lower",
    daysPerWeek: 4,
    difficulty: "intermediate",
    focus: ["strength"],
    isTemplate: false,
    isActive: true,
    isArchived: false,
    days: [],
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
  }

  it("calculates session adherence against planned program frequency", () => {
    // 3 sessions in trailing 7 days
    const currentSessions = [
      createCompletedSession(1, 1000),
      createCompletedSession(3, 1000),
      createCompletedSession(5, 1000),
    ]

    const review = generateWeeklyReview({
      userId: "usr-1",
      sessions: currentSessions,
      activeProgram: mockProgram, // planned: 4
      recoveryEntries: [],
      nutritionLogs: [],
      endDate: now,
    })

    expect(review.completedSessions).toBe(3)
    expect(review.plannedSessions).toBe(4)
    expect(review.adherenceRatePct).toBe(75) // 3 / 4 = 75%
  })

  it("calculates volume trajectory change percentage against prior week", () => {
    // Current week: 2 sessions of 2000kg each = 4000kg
    const currentSessions = [
      createCompletedSession(1, 2000),
      createCompletedSession(3, 2000),
    ]

    // Prior week (days 8-13): 2 sessions of 1000kg each = 2000kg
    const priorSessions = [
      createCompletedSession(8, 1000),
      createCompletedSession(10, 1000),
    ]

    const review = generateWeeklyReview({
      userId: "usr-1",
      sessions: [...currentSessions, ...priorSessions],
      activeProgram: mockProgram,
      recoveryEntries: [],
      nutritionLogs: [],
      endDate: now,
    })

    expect(review.totalVolumeKg).toBe(4000)
    // 4000 vs 2000 = +100%
    expect(review.volumeChangePct).toBe(100)
  })

  it("synthesizes recovery and nutrition telemetry into clean averages", () => {
    const recoveryEntries: DailyRecoveryEntry[] = [
      {
        id: "rec-1",
        userId: "usr-1",
        date: "2026-10-29",
        sleepDurationMinutes: 480, // 8.0 hrs
        sleepQuality: 4,
        energy: 4,
        fatigue: 2,
        stress: 2,
        muscleSoreness: { quads: 4 },
        hrv: 70,
        restingHR: 52,
        schemaVersion: 1,
        createdAt: "2026-10-29T00:00:00.000Z",
        updatedAt: "2026-10-29T00:00:00.000Z",
      },
      {
        id: "rec-2",
        userId: "usr-1",
        date: "2026-10-28",
        sleepDurationMinutes: 420, // 7.0 hrs
        sleepQuality: 4,
        energy: 4,
        fatigue: 2,
        stress: 1,
        muscleSoreness: {},
        hrv: 75,
        restingHR: 50,
        schemaVersion: 1,
        createdAt: "2026-10-28T00:00:00.000Z",
        updatedAt: "2026-10-28T00:00:00.000Z",
      },
    ]

    const nutritionLogs: DailyNutritionLog[] = [
      {
        id: "nut-1",
        userId: "usr-1",
        date: "2026-10-29",
        totalCalories: 2500,
        totalProtein: 160,
        totalCarbs: 250,
        totalFat: 70,
        totalFiber: 30,
        waterMl: 3000,
        foods: [],
        schemaVersion: 1,
      },
    ]

    const nutritionTargets: NutritionTargets = {
      calories: 2500,
      protein: 160,
      carbs: 250,
      fat: 70,
      fiber: 35,
      waterMl: 3000,
    }

    const review = generateWeeklyReview({
      userId: "usr-1",
      sessions: [],
      activeProgram: mockProgram,
      recoveryEntries,
      nutritionLogs,
      nutritionTargets,
      endDate: now,
    })

    expect(review.recoverySummary.averageReadiness).toBeGreaterThan(0)
    expect(review.recoverySummary.averageSleepHours).toBe(7.5) // (8 + 7) / 2
    expect(review.recoverySummary.sorenessHotspots).toContain("quads")
    expect(review.nutritionSummary.proteinAdherencePct).toBe(100)
    expect(review.focusAreasNextWeek.length).toBeGreaterThan(0)
  })
})
