import type { DailyRecoveryEntry, SorenessRating, WellnessRating1to5 } from "@/lib/types/recovery.types"
import { subDays, formatDateKey } from "@/lib/utils/date"
import { CURRENT_SCHEMA_VERSION } from "@/lib/constants/VERSION"

export function generateSeedRecoveryEntries(): DailyRecoveryEntry[] {
  const entries: DailyRecoveryEntry[] = []
  const today = new Date()

  // Generate 30 days of historical wellness and recovery check-ins
  for (let i = 29; i >= 0; i--) {
    const d = subDays(today, i)
    const dateStr = formatDateKey(d)

    // Simulate cyclic training fatigue and recovery waves
    const cycle = Math.sin(i * 0.4)
    const noise = Math.cos(i * 0.9)

    // Sleep duration between 390m (6.5h) and 510m (8.5h)
    const sleepDurationMinutes = Math.min(
      520,
      Math.max(380, Math.round(460 + cycle * 35 + noise * 15))
    )

    // Sleep quality 1-5
    const sleepQuality = Math.min(
      5,
      Math.max(1, Math.round(3.8 + cycle * 0.8))
    ) as WellnessRating1to5

    // Energy 1-5
    const energy = Math.min(
      5,
      Math.max(1, Math.round(3.7 + cycle * 0.9))
    ) as WellnessRating1to5

    // Fatigue 1-5 (inverted from energy)
    const fatigue = Math.min(
      5,
      Math.max(1, Math.round(2.6 - cycle * 0.8))
    ) as WellnessRating1to5

    // Stress 1-5
    const stress = Math.min(
      5,
      Math.max(1, Math.round(2.4 - noise * 0.7))
    ) as WellnessRating1to5

    // Motivation 1-5
    const motivation = Math.min(
      5,
      Math.max(1, Math.round(4.0 + cycle * 0.6))
    ) as WellnessRating1to5

    // Realistic muscle soreness tied to simulated 3-day split
    const muscleSoreness: DailyRecoveryEntry["muscleSoreness"] = {}
    if (i % 4 === 1) {
      muscleSoreness.chest = 3 as SorenessRating
      muscleSoreness.triceps = 2 as SorenessRating
      muscleSoreness.shoulders = 1 as SorenessRating
    } else if (i % 4 === 2) {
      muscleSoreness.back = 3 as SorenessRating
      muscleSoreness.biceps = 2 as SorenessRating
    } else if (i % 4 === 3) {
      muscleSoreness.quads = 4 as SorenessRating
      muscleSoreness.glutes = 3 as SorenessRating
      muscleSoreness.hamstrings = 2 as SorenessRating
    } else {
      muscleSoreness.quads = 1 as SorenessRating
      muscleSoreness.core = 1 as SorenessRating
    }

    // Biometrics: resting HR (50-62 bpm), HRV (58-82 ms)
    const restingHR = Math.round(54 - cycle * 3 + Math.abs(noise) * 2)
    const hrv = Math.round(72 + cycle * 8 - Math.abs(noise) * 3)

    // Simulate occasional partial entries (e.g. days 12 and 22 have no wearable metrics)
    const includeBiometrics = i !== 12 && i !== 22

    entries.push({
      id: `rec-${dateStr}`,
      userId: "user-1",
      date: dateStr,
      sleepDurationMinutes,
      bedtime: "23:15",
      wakeTime: "07:05",
      sleepQuality,
      energy,
      stress,
      fatigue,
      motivation,
      muscleSoreness,
      restingHR: includeBiometrics ? restingHR : undefined,
      hrv: includeBiometrics ? hrv : undefined,
      notes:
        i === 0
          ? "Feeling refreshed and ready for heavy squats today."
          : i === 3
          ? "Leg day soreness lingering in quads."
          : i === 10
          ? "Great sleep recovery after rest day."
          : undefined,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      createdAt: d.toISOString(),
      updatedAt: d.toISOString(),
    })
  }

  return entries
}
