import { describe, it, expect } from "vitest"
import { calculateReadinessScore } from "../readiness.service"
import type { DailyRecoveryEntry, RecoveryConfig } from "@/lib/types/recovery.types"

describe("readiness.service — calculateReadinessScore", () => {
  const customConfig: RecoveryConfig = {
    targetSleepMinutes: 480, // 8h
    minCompletenessPct: 40,
  }

  it("handles null/undefined entry by returning Insufficient Data with 0% completeness", () => {
    const result = calculateReadinessScore(null, customConfig)
    expect(result.score).toBeNull()
    expect(result.isSufficientData).toBe(false)
    expect(result.category).toBe("Insufficient Data")
    expect(result.completenessPct).toBe(0)
    expect(result.factors.every((f) => !f.isAvailable)).toBe(true)
  })

  it("returns Insufficient Data when entry completeness is below threshold (e.g. only stress logged)", () => {
    const partialEntry: Partial<DailyRecoveryEntry> = {
      date: "2026-10-29",
      stress: 2, // 10% weight < 40% threshold
    }
    const result = calculateReadinessScore(partialEntry, customConfig)
    expect(result.score).toBeNull()
    expect(result.isSufficientData).toBe(false)
    expect(result.completenessPct).toBe(10)
    expect(result.category).toBe("Insufficient Data")
  })

  it("calculates High Readiness with all optimal inputs", () => {
    const optimalEntry: Partial<DailyRecoveryEntry> = {
      date: "2026-10-29",
      sleepDurationMinutes: 480, // 100% of target
      sleepQuality: 5,
      energy: 5,
      fatigue: 1, // 1 = fully rested
      stress: 1, // 1 = very calm
      muscleSoreness: { quads: 0, chest: 0 },
      hrv: 78,
      restingHR: 50,
    }
    const result = calculateReadinessScore(optimalEntry, customConfig)
    expect(result.isSufficientData).toBe(true)
    expect(result.completenessPct).toBe(100)
    expect(result.score).toBe(100)
    expect(result.category).toBe("High Readiness")

    // Verify weights sum to 1.0 (100%)
    const sumWeights = result.factors.reduce((sum, f) => sum + f.weight, 0)
    expect(Math.abs(sumWeights - 1.0)).toBeLessThan(0.001)
  })

  it("calculates Low Readiness with poor sleep, high fatigue, and severe soreness", () => {
    const strainedEntry: Partial<DailyRecoveryEntry> = {
      date: "2026-10-29",
      sleepDurationMinutes: 240, // 4 hours
      sleepQuality: 1,
      energy: 1,
      fatigue: 5, // severe fatigue
      stress: 4, // elevated stress
      muscleSoreness: { quads: 5, hamstrings: 4 },
    }
    const result = calculateReadinessScore(strainedEntry, customConfig)
    expect(result.isSufficientData).toBe(true)
    expect(result.score).not.toBeNull()
    expect(result.score!).toBeLessThan(50)
    expect(result.category).toBe("Low Readiness")
  })

  it("dynamically normalizes weights when biometrics (HRV/RHR) are omitted", () => {
    const subjectiveOnlyEntry: Partial<DailyRecoveryEntry> = {
      date: "2026-10-29",
      sleepDurationMinutes: 450, // 7.5h
      sleepQuality: 4,
      energy: 4,
      fatigue: 2,
      stress: 2,
      muscleSoreness: {},
      // No HRV, No Resting HR
    }
    const result = calculateReadinessScore(subjectiveOnlyEntry, customConfig)
    expect(result.isSufficientData).toBe(true)
    // 100 - (5 + 5) = 90% completeness
    expect(result.completenessPct).toBe(90)
    expect(result.score).toBeGreaterThan(70)

    // Verify effective weights of available factors sum to exactly 1.0
    const availableFactors = result.factors.filter((f) => f.isAvailable)
    const sumWeights = availableFactors.reduce((sum, f) => sum + f.weight, 0)
    expect(Math.abs(sumWeights - 1.0)).toBeLessThan(0.0001)

    // Missing factors have 0 effective weight
    const missingFactors = result.factors.filter((f) => !f.isAvailable)
    expect(missingFactors.length).toBe(2)
    expect(missingFactors.every((f) => f.weight === 0 && f.contribution === 0)).toBe(true)
  })

  it("respects customized target sleep duration", () => {
    const entry: Partial<DailyRecoveryEntry> = {
      date: "2026-10-29",
      sleepDurationMinutes: 420, // 7 hours
      sleepQuality: 3,
      energy: 3,
      fatigue: 3,
    }

    // When target is 7h (420m), sleep duration is 100% of target
    const resultConfig7h = calculateReadinessScore(entry, {
      targetSleepMinutes: 420,
      minCompletenessPct: 40,
    })
    const sleepFactor7h = resultConfig7h.factors.find((f) => f.factorId === "sleep_duration")
    expect(sleepFactor7h?.score).toBe(100)

    // When target is 9h (540m), 420m is ~78%
    const resultConfig9h = calculateReadinessScore(entry, {
      targetSleepMinutes: 540,
      minCompletenessPct: 40,
    })
    const sleepFactor9h = resultConfig9h.factors.find((f) => f.factorId === "sleep_duration")
    expect(sleepFactor9h?.score).toBe(78)
  })

  it("handles boundary values gracefully", () => {
    const boundaryZero: Partial<DailyRecoveryEntry> = {
      date: "2026-10-29",
      sleepDurationMinutes: 0, // treated as missing
      energy: 1,
      fatigue: 5,
      stress: 5,
    }
    const result = calculateReadinessScore(boundaryZero, customConfig)
    expect(result.isSufficientData).toBe(true)
    const sleepFactor = result.factors.find((f) => f.factorId === "sleep_duration")
    expect(sleepFactor?.isAvailable).toBe(false)
  })
})
