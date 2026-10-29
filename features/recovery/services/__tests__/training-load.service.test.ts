import { describe, it, expect } from "vitest"
import { calculateTrainingLoadSummary } from "../training-load.service"
import type { WorkoutSession } from "@/lib/types/training.types"
import type { DailyRecoveryEntry, SorenessRating } from "@/lib/types/recovery.types"
import { subDays, formatDateKey } from "@/lib/utils/date"

describe("training-load.service — calculateTrainingLoadSummary", () => {
  const refDate = new Date("2026-10-29T12:00:00Z")

  const createMockSession = (overrides: Partial<WorkoutSession>): WorkoutSession => ({
    id: "mock-session",
    userId: "user-1",
    name: "Mock Workout",
    status: "completed",
    startedAt: refDate as any,
    completedAt: refDate as any,
    totalVolume: 5000,
    totalSets: 10,
    totalReps: 80,
    exerciseCount: 1,
    musclesWorked: ["chest"],
    createdAt: refDate as any,
    updatedAt: refDate as any,
    exercises: [],
    ...overrides,
  })

  it("handles empty sessions gracefully without throwing or dividing by zero", () => {
    const summary = calculateTrainingLoadSummary([], [], refDate)
    expect(summary.workoutsCount7d).toBe(0)
    expect(summary.workoutsCount28d).toBe(0)
    expect(summary.totalVolume7d).toBe(0)
    expect(summary.totalVolumePrev7d).toBe(0)
    expect(summary.volumeChangePct).toBeNull()
    expect(summary.acwr).toBeNull()
    expect(summary.accumulatedFatigueIndicator).toBe("low")
    expect(summary.muscleStatuses.every((m) => m.recoveryEstimate === "untrained")).toBe(true)
  })

  it("accurately calculates 7d volume, volume change %, and ACWR", () => {
    const sessions: WorkoutSession[] = [
      // 2 workouts in last 7d (each 5,000kg vol = 10,000kg)
      createMockSession({
        id: "w1",
        startedAt: subDays(refDate, 1) as any,
        completedAt: subDays(refDate, 1) as any,
        totalVolume: 5000,
      }),
      createMockSession({
        id: "w2",
        startedAt: subDays(refDate, 3) as any,
        completedAt: subDays(refDate, 3) as any,
        totalVolume: 5000,
      }),
      // 1 workout in previous 7-14d window (8,000kg)
      createMockSession({
        id: "w3",
        startedAt: subDays(refDate, 9) as any,
        completedAt: subDays(refDate, 9) as any,
        totalVolume: 8000,
      }),
      // 2 workouts earlier in 28d window (total 28d volume = 10000 + 8000 + 12000 = 30000kg)
      createMockSession({
        id: "w4",
        startedAt: subDays(refDate, 20) as any,
        completedAt: subDays(refDate, 20) as any,
        totalVolume: 6000,
      }),
      createMockSession({
        id: "w5",
        startedAt: subDays(refDate, 25) as any,
        completedAt: subDays(refDate, 25) as any,
        totalVolume: 6000,
      }),
    ]

    const summary = calculateTrainingLoadSummary(sessions, [], refDate)
    expect(summary.workoutsCount7d).toBe(2)
    expect(summary.workoutsCount28d).toBe(5)
    expect(summary.totalVolume7d).toBe(10000)
    expect(summary.totalVolumePrev7d).toBe(8000)

    // Volume change %: (10000 - 8000) / 8000 = +25%
    expect(summary.volumeChangePct).toBe(25)

    // Chronic volume: 30000 / 4 = 7500
    // ACWR: 10000 / 7500 = 1.33 (overreaching)
    expect(summary.acwr).toBe(1.33)
    expect(summary.acwrStatus).toBe("overreaching")
  })

  it("maps exercise muscle groups and marks strained muscles based on recent workout and soreness", () => {
    const sessions: WorkoutSession[] = [
      createMockSession({
        id: "w-chest",
        name: "Chest Day",
        startedAt: subDays(refDate, 1) as any,
        completedAt: subDays(refDate, 1) as any,
        totalVolume: 4000,
        totalSets: 3,
        totalReps: 24,
        exercises: [
          {
            id: "se-1",
            exerciseId: "ex-bench-barbell", // Primary: chest
            orderIndex: 1,
            sets: [
              { id: "s1", setNumber: 1, type: "normal", weight: 100, reps: 8, completed: true, isWarmup: false, isDropset: false },
              { id: "s2", setNumber: 2, type: "normal", weight: 100, reps: 8, completed: true, isWarmup: false, isDropset: false },
              { id: "s3", setNumber: 3, type: "normal", weight: 100, reps: 8, completed: true, isWarmup: false, isDropset: false },
            ],
          },
        ],
      }),
    ]

    const checkIns: DailyRecoveryEntry[] = [
      {
        id: "rec-today",
        userId: "user-1",
        date: formatDateKey(refDate),
        muscleSoreness: {
          chest: 4 as SorenessRating, // High soreness
        },
        schemaVersion: 1,
        createdAt: refDate.toISOString(),
        updatedAt: refDate.toISOString(),
      },
    ]

    const summary = calculateTrainingLoadSummary(sessions, checkIns, refDate)
    const chestStatus = summary.muscleStatuses.find((m) => m.muscle === "chest")
    expect(chestStatus).toBeDefined()
    expect(chestStatus?.totalSets7d).toBe(3)
    expect(chestStatus?.daysSinceTrained).toBe(1)
    expect(chestStatus?.currentSoreness).toBe(4)
    expect(chestStatus?.recoveryEstimate).toBe("strained")
  })
})
