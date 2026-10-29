import { describe, it, expect } from "vitest"
import {
  calculateDataCompleteness,
  generateCoachingRecommendations,
  type CoachEngineInput,
} from "../services/coach-engine.service"
import type { WorkoutSession, TrainingProgram } from "@/lib/types/training.types"
import type { DailyRecoveryEntry } from "@/lib/types/recovery.types"

describe("coach-engine.service", () => {
  const mockProgram: TrainingProgram = {
    id: "prog-1",
    userId: "usr-1",
    name: "Upper Lower Hypertrophy",
    daysPerWeek: 4,
    difficulty: "intermediate",
    focus: ["hypertrophy"],
    isTemplate: false,
    isActive: true,
    isArchived: false,
    days: [
      {
        id: "day-1",
        name: "Upper Power",
        orderIndex: 0,
        isRestDay: false,
        exercises: [
          {
            id: "prog-ex-1",
            exerciseId: "bench-press",
            orderIndex: 0,
            restSeconds: 120,
            targetSets: 3,
            targetReps: "8",
            targetWeight: 80,
            targetRPE: 8,
            exercise: {
              id: "bench-press",
              name: "Barbell Bench Press",
              category: "barbell",
              equipment: ["barbell"],
              mechanics: "compound",
              muscleGroups: ["chest"],
              secondaryMuscles: ["triceps", "shoulders"],
              isCustom: false,
            },
          },
        ],
      },
    ],
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
  }

  const mockSession: WorkoutSession = {
    id: "sess-1",
    userId: "usr-1",
    name: "Upper Power",
    programId: "prog-1",
    status: "completed",
    totalVolume: 1920,
    totalSets: 3,
    totalReps: 24,
    exerciseCount: 1,
    musclesWorked: ["chest"],
    startedAt: { toDate: () => new Date(Date.now() - 3600000) } as any,
    completedAt: { toDate: () => new Date() } as any,
    durationSeconds: 3600,
    exercises: [
      {
        id: "se-1",
        exerciseId: "bench-press",
        orderIndex: 0,
        sets: [
          {
            id: "s-1",
            setNumber: 1,
            type: "normal",
            isWarmup: false,
            isDropset: false,
            reps: 8,
            weight: 80,
            rpe: 7.5,
            completed: true,
          },
          {
            id: "s-2",
            setNumber: 2,
            type: "normal",
            isWarmup: false,
            isDropset: false,
            reps: 8,
            weight: 80,
            rpe: 8.0,
            completed: true,
          },
          {
            id: "s-3",
            setNumber: 3,
            type: "normal",
            isWarmup: false,
            isDropset: false,
            reps: 8,
            weight: 80,
            rpe: 8.0,
            completed: true,
          },
        ],
      },
    ],
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
  }

  const mockSession2: WorkoutSession = {
    ...mockSession,
    id: "sess-2",
    completedAt: { toDate: () => new Date(Date.now() - 86400000 * 2) } as any,
  }

  it("calculates 0% completeness when no inputs are present", () => {
    const input: CoachEngineInput = {
      userId: "usr-1",
      sessions: [],
      recoveryEntries: [],
      nutritionLogs: [],
      goals: [],
    }

    const { scorePct, missingDataItems } = calculateDataCompleteness(input)
    expect(scorePct).toBe(0)
    expect(missingDataItems.length).toBe(4)
  })

  it("calculates 100% completeness when all 4 streams have sufficient data", () => {
    const input: CoachEngineInput = {
      userId: "usr-1",
      activeProgram: mockProgram,
      sessions: [mockSession, mockSession2, { ...mockSession, id: "sess-3" }],
      recoveryEntries: [
        { id: "rec-1", readinessScore: 85 } as any,
        { id: "rec-2", readinessScore: 80 } as any,
        { id: "rec-3", readinessScore: 78 } as any,
      ],
      nutritionLogs: [
        { id: "nut-1", totalCalories: 2500 } as any,
        { id: "nut-2", totalCalories: 2600 } as any,
        { id: "nut-3", totalCalories: 2450 } as any,
      ],
      goals: [],
    }

    const { scorePct, missingDataItems } = calculateDataCompleteness(input)
    expect(scorePct).toBe(100)
    expect(missingDataItems.length).toBe(0)
  })

  it("generates a progression recommendation when compound lift hits target reps at RPE <= 8", () => {
    const input: CoachEngineInput = {
      userId: "usr-1",
      activeProgram: mockProgram,
      sessions: [mockSession, mockSession2],
      recoveryEntries: [],
      nutritionLogs: [],
      goals: [],
    }

    const recs = generateCoachingRecommendations(input)
    const progRec = recs.find((r) => r.category === "progression")

    expect(progRec).toBeDefined()
    expect(progRec?.title).toContain("Barbell Bench Press")
    expect(progRec?.recommendation).toContain("82.5kg") // +2.5kg for heavy compound
    expect(progRec?.evidence.length).toBeGreaterThanOrEqual(2)
    expect(progRec?.action?.type).toBe("adaptive_proposal")
  })

  it("generates a critical recovery alert when composite readiness is under 50", () => {
    const lowRecovery: DailyRecoveryEntry = {
      id: "rec-fatigued",
      userId: "usr-1",
      date: "2026-10-29",
      sleepDurationMinutes: 240, // 4 hours
      sleepQuality: 1,
      energy: 1,
      fatigue: 5,
      stress: 5,
      muscleSoreness: {},
      hrv: 30,
      restingHR: 75,
      schemaVersion: 1,
      createdAt: "2026-10-29T00:00:00.000Z",
      updatedAt: "2026-10-29T00:00:00.000Z",
    }

    const input: CoachEngineInput = {
      userId: "usr-1",
      activeProgram: mockProgram,
      sessions: [],
      recoveryEntries: [lowRecovery],
      nutritionLogs: [],
      goals: [],
    }

    const recs = generateCoachingRecommendations(input)
    const recAlert = recs.find((r) => r.category === "recovery" && r.priority === "critical")

    expect(recAlert).toBeDefined()
    expect(recAlert?.recommendation).toContain("Reduce training volume")
  })

  it("flags localized soreness conflicts when muscle group has severe DOMS (>= 4)", () => {
    const soreRecovery: DailyRecoveryEntry = {
      id: "rec-sore",
      userId: "usr-1",
      date: "2026-10-29",
      sleepDurationMinutes: 480,
      sleepQuality: 4,
      energy: 3,
      fatigue: 2,
      stress: 2,
      muscleSoreness: { chest: 4, shoulders: 4 },
      hrv: 65,
      restingHR: 55,
      schemaVersion: 1,
      createdAt: "2026-10-29T00:00:00.000Z",
      updatedAt: "2026-10-29T00:00:00.000Z",
    }

    const input: CoachEngineInput = {
      userId: "usr-1",
      activeProgram: mockProgram,
      sessions: [],
      recoveryEntries: [soreRecovery],
      nutritionLogs: [],
      goals: [],
    }

    const recs = generateCoachingRecommendations(input)
    const sorenessRec = recs.find((r) => r.id === "rec-soreness-conflict")

    expect(sorenessRec).toBeDefined()
    expect(sorenessRec?.title).toContain("chest")
    expect(sorenessRec?.recommendation).toContain("Allow an extra 24-48 hours")
  })

  it("respects dismissed IDs and does not return dismissed recommendations", () => {
    const input: CoachEngineInput = {
      userId: "usr-1",
      activeProgram: mockProgram,
      sessions: [mockSession, mockSession2],
      recoveryEntries: [],
      nutritionLogs: [],
      goals: [],
      dismissedIds: ["rec-prog-bench-press"],
    }

    const recs = generateCoachingRecommendations(input)
    const progRec = recs.find((r) => r.id === "rec-prog-bench-press")
    expect(progRec).toBeUndefined()
  })
})
