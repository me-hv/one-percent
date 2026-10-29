import { describe, it, expect } from "vitest"
import { resolveCoachChatQuery } from "../services/coach-chat.service"
import type { CoachEngineInput } from "../services/coach-engine.service"
import type { TrainingProgram, WorkoutSession } from "@/lib/types/training.types"
import type { DailyRecoveryEntry } from "@/lib/types/recovery.types"

describe("coach-chat.service", () => {
  const mockProgram: TrainingProgram = {
    id: "prog-1",
    userId: "usr-1",
    name: "Hypertrophy Blueprint",
    daysPerWeek: 4,
    difficulty: "intermediate",
    focus: ["hypertrophy"],
    isTemplate: false,
    isActive: true,
    isArchived: false,
    days: [
      {
        id: "d-1",
        name: "Push Focus",
        orderIndex: 0,
        isRestDay: false,
        exercises: [
          {
            id: "e-1",
            exerciseId: "bench",
            orderIndex: 0,
            restSeconds: 120,
            targetSets: 3,
            targetReps: "8-10",
            targetWeight: 80,
          },
        ],
      },
    ],
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
  }

  const mockRecovery: DailyRecoveryEntry = {
    id: "rec-1",
    userId: "usr-1",
    date: "2026-10-29",
    sleepDurationMinutes: 468,
    sleepQuality: 4,
    energy: 4,
    fatigue: 2,
    stress: 2,
    muscleSoreness: {},
    hrv: 72,
    restingHR: 52,
    schemaVersion: 1,
    createdAt: "2026-10-29T00:00:00.000Z",
    updatedAt: "2026-10-29T00:00:00.000Z",
  }

  const session1: WorkoutSession = {
    id: "s-1",
    userId: "usr-1",
    name: "Push Focus",
    status: "completed",
    totalVolume: 5000,
    totalSets: 12,
    totalReps: 100,
    exerciseCount: 4,
    musclesWorked: ["chest", "triceps"],
    completedAt: { toDate: () => new Date() } as any,
    startedAt: { toDate: () => new Date() } as any,
    durationSeconds: 3600,
    exercises: [],
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
  }

  const session2: WorkoutSession = {
    id: "s-2",
    userId: "usr-1",
    name: "Push Focus",
    status: "completed",
    totalVolume: 4800,
    totalSets: 12,
    totalReps: 100,
    exerciseCount: 4,
    musclesWorked: ["chest", "triceps"],
    completedAt: { toDate: () => new Date(Date.now() - 86400000 * 3) } as any,
    startedAt: { toDate: () => new Date(Date.now() - 86400000 * 3) } as any,
    durationSeconds: 3600,
    exercises: [],
    createdAt: { toDate: () => new Date(Date.now() - 86400000 * 3) } as any,
    updatedAt: { toDate: () => new Date(Date.now() - 86400000 * 3) } as any,
  }

  const baseInput: CoachEngineInput = {
    userId: "usr-1",
    sessions: [session1, session2],
    activeProgram: mockProgram,
    recoveryEntries: [mockRecovery],
    nutritionLogs: [],
    goals: [],
  }

  it("answers 'What should I focus on today?' by citing active program day and readiness score", () => {
    const res = resolveCoachChatQuery("What should I focus on today?", baseInput)

    expect(res.sender).toBe("coach")
    expect(res.source).toBe("deterministic")
    expect(res.text).toContain("Push Focus")
    expect(res.text).toContain("Hypertrophy Blueprint")
    expect(res.evidence).toBeDefined()
    expect(res.evidence?.length).toBeGreaterThanOrEqual(1)
    expect(res.suggestedQuestions?.length).toBeGreaterThan(0)
  })

  it("analyzes performance trajectory when >= 2 sessions are present", () => {
    const res = resolveCoachChatQuery("Why am I stalling on my bench press?", baseInput)

    expect(res.text).toContain("recent sessions")
    expect(res.text).toContain("Push Focus")
    expect(res.evidence).toBeDefined()
    expect(res.evidence?.length).toBeGreaterThanOrEqual(1)
    expect(res.suggestedQuestions).toBeDefined()
  })

  it("answers program consistency questions with telemetry", () => {
    const res = resolveCoachChatQuery("How is my program consistency?", baseInput)

    expect(res.text).toContain("Hypertrophy Blueprint")
    expect(res.text).toContain("Consistency beats intensity")
  })

  it("compares current week against prior week", () => {
    const res = resolveCoachChatQuery("How did this week compare to last week?", baseInput)

    expect(res.text).toContain("trailing 7-day summary")
    expect(res.evidence).toBeDefined()
  })

  it("returns an informative objective response for unknown queries", () => {
    const res = resolveCoachChatQuery("Tell me a random story", baseInput)

    expect(res.text).toContain("actual logged sessions")
    expect(res.suggestedQuestions?.length).toBeGreaterThan(0)
  })
})
