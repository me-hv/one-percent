import { describe, it, expect } from "vitest"
import { generateRecoveryInsights } from "../recovery-insights.service"
import type { DailyRecoveryEntry, RecoveryConfig, TrainingLoadSummary } from "@/lib/types/recovery.types"

describe("recovery-insights.service — generateRecoveryInsights", () => {
  const config: RecoveryConfig = { targetSleepMinutes: 480, minCompletenessPct: 40 }

  it("returns intro insight when fewer than 2 entries exist", () => {
    const insights = generateRecoveryInsights([], undefined, config)
    expect(insights.length).toBe(1)
    expect(insights[0]?.id).toBe("ins-intro")
    expect(insights[0]?.level).toBe("neutral")
  })

  it("detects sleep deficit when 7-day sleep average is below target", () => {
    const entries: DailyRecoveryEntry[] = [
      {
        id: "r1",
        userId: "user-1",
        date: "2026-10-29",
        sleepDurationMinutes: 360, // 6h (deficit from 8h)
        muscleSoreness: {},
        schemaVersion: 1,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "r2",
        userId: "user-1",
        date: "2026-10-28",
        sleepDurationMinutes: 380, // 6.3h
        muscleSoreness: {},
        schemaVersion: 1,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "r3",
        userId: "user-1",
        date: "2026-10-27",
        sleepDurationMinutes: 390, // 6.5h
        muscleSoreness: {},
        schemaVersion: 1,
        createdAt: "",
        updatedAt: "",
      },
    ]

    const insights = generateRecoveryInsights(entries, undefined, config)
    const sleepInsight = insights.find((i) => i.id === "ins-sleep-deficit")
    expect(sleepInsight).toBeDefined()
    expect(sleepInsight?.level).toBe("caution")
  })

  it("identifies strained muscles from training load summary", () => {
    const entries: DailyRecoveryEntry[] = [
      {
        id: "r1",
        userId: "user-1",
        date: "2026-10-29",
        sleepDurationMinutes: 480,
        muscleSoreness: { quads: 4 },
        schemaVersion: 1,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "r2",
        userId: "user-1",
        date: "2026-10-28",
        sleepDurationMinutes: 480,
        muscleSoreness: {},
        schemaVersion: 1,
        createdAt: "",
        updatedAt: "",
      },
    ]

    const trainingLoad: Partial<TrainingLoadSummary> = {
      muscleStatuses: [
        {
          muscle: "quads",
          lastTrainedDate: "2026-10-28",
          daysSinceTrained: 1,
          totalSets7d: 5,
          totalVolume7d: 5000,
          currentSoreness: 4,
          recoveryEstimate: "strained",
          notes: "High soreness",
        },
      ],
    }

    const insights = generateRecoveryInsights(entries, trainingLoad as TrainingLoadSummary, config)
    const muscleInsight = insights.find((i) => i.id === "ins-muscle-strain")
    expect(muscleInsight).toBeDefined()
    expect(muscleInsight?.message).toContain("quads")
  })
})
