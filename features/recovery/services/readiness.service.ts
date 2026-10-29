import type {
  DailyRecoveryEntry,
  RecoveryConfig,
  ReadinessCalculationResult,
  ReadinessFactorBreakdown,
  ReadinessFactorId,
  SorenessRating,
  WellnessRating1to5,
} from "@/lib/types/recovery.types"
import { DEFAULT_RECOVERY_CONFIG } from "@/features/recovery/repository/recovery.repository"

interface FactorDef {
  id: ReadinessFactorId
  name: string
  rawWeight: number
  calculate: (
    entry: Partial<DailyRecoveryEntry>,
    config: RecoveryConfig
  ) => { score: number; description: string; rawValue: number | string | null } | null
}

const FACTOR_DEFINITIONS: FactorDef[] = [
  {
    id: "sleep_duration",
    name: "Sleep Duration",
    rawWeight: 0.25,
    calculate: (entry, config) => {
      if (entry.sleepDurationMinutes == null || entry.sleepDurationMinutes <= 0) return null
      const target = config.targetSleepMinutes || 480
      const ratio = entry.sleepDurationMinutes / target
      const hrs = (entry.sleepDurationMinutes / 60).toFixed(1)
      const targetHrs = (target / 60).toFixed(1)

      let score: number
      if (ratio >= 1.0) {
        // Full target achieved
        score = 100
      } else {
        // Proportion of target down to minimum 20
        score = Math.max(20, Math.min(100, Math.round(ratio * 100)))
      }

      return {
        score,
        description: `${hrs} hrs logged (${Math.round(ratio * 100)}% of ${targetHrs}h target)`,
        rawValue: entry.sleepDurationMinutes,
      }
    },
  },
  {
    id: "sleep_quality",
    name: "Sleep Quality",
    rawWeight: 0.15,
    calculate: (entry) => {
      if (entry.sleepQuality == null) return null
      const map: Record<WellnessRating1to5, { score: number; label: string }> = {
        5: { score: 100, label: "Deep & Restorative (5/5)" },
        4: { score: 85, label: "Good quality (4/5)" },
        3: { score: 65, label: "Average / Fair (3/5)" },
        2: { score: 45, label: "Restless / Broken (2/5)" },
        1: { score: 20, label: "Poor sleep (1/5)" },
      }
      const item = map[entry.sleepQuality]
      if (!item) return null
      return { score: item.score, description: item.label, rawValue: entry.sleepQuality }
    },
  },
  {
    id: "energy",
    name: "Energy Level",
    rawWeight: 0.15,
    calculate: (entry) => {
      if (entry.energy == null) return null
      const map: Record<WellnessRating1to5, { score: number; label: string }> = {
        5: { score: 100, label: "Peak energy (5/5)" },
        4: { score: 85, label: "High energy (4/5)" },
        3: { score: 65, label: "Moderate energy (3/5)" },
        2: { score: 45, label: "Low energy (2/5)" },
        1: { score: 20, label: "Exhausted (1/5)" },
      }
      const item = map[entry.energy]
      if (!item) return null
      return { score: item.score, description: item.label, rawValue: entry.energy }
    },
  },
  {
    id: "fatigue",
    name: "Systemic Fatigue",
    rawWeight: 0.15,
    calculate: (entry) => {
      if (entry.fatigue == null) return null
      // Inverted: Low reported fatigue = higher recovery score
      const map: Record<WellnessRating1to5, { score: number; label: string }> = {
        1: { score: 100, label: "Fully rested & fresh (1/5)" },
        2: { score: 85, label: "Mild tiredness (2/5)" },
        3: { score: 65, label: "Moderate fatigue (3/5)" },
        4: { score: 40, label: "High fatigue (4/5)" },
        5: { score: 20, label: "Severe fatigue (5/5)" },
      }
      const item = map[entry.fatigue]
      if (!item) return null
      return { score: item.score, description: item.label, rawValue: entry.fatigue }
    },
  },
  {
    id: "stress",
    name: "Stress Load",
    rawWeight: 0.10,
    calculate: (entry) => {
      if (entry.stress == null) return null
      // Inverted: Low reported stress = higher recovery score
      const map: Record<WellnessRating1to5, { score: number; label: string }> = {
        1: { score: 100, label: "Calm / Low stress (1/5)" },
        2: { score: 85, label: "Mild tension (2/5)" },
        3: { score: 65, label: "Moderate stress (3/5)" },
        4: { score: 40, label: "Elevated stress (4/5)" },
        5: { score: 20, label: "High stress (5/5)" },
      }
      const item = map[entry.stress]
      if (!item) return null
      return { score: item.score, description: item.label, rawValue: entry.stress }
    },
  },
  {
    id: "muscle_soreness",
    name: "Muscle Freshness",
    rawWeight: 0.10,
    calculate: (entry) => {
      if (entry.muscleSoreness == null) return null
      const ratings = Object.values(entry.muscleSoreness).filter(
        (val): val is SorenessRating => typeof val === "number"
      )

      // If provided as empty object, default to 0 soreness
      if (ratings.length === 0) {
        return {
          score: 100,
          description: "No muscle soreness reported (Fresh)",
          rawValue: 0,
        }
      }

      const maxSoreness = Math.max(...ratings)
      const avgSoreness = (ratings as number[]).reduce((sum: number, r: number) => sum + r, 0) / ratings.length
      // Heavily weigh the most sore muscle (60%) plus average (40%)
      const composite = 0.6 * maxSoreness + 0.4 * avgSoreness

      let score: number
      if (composite <= 0.2) score = 100
      else if (composite <= 1.2) score = 88
      else if (composite <= 2.2) score = 72
      else if (composite <= 3.2) score = 52
      else if (composite <= 4.2) score = 35
      else score = 18

      const soreCount = ratings.filter((r) => r > 0).length
      const description =
        soreCount === 0
          ? "No muscles sore"
          : `${soreCount} muscle group${soreCount > 1 ? "s" : ""} sore (peak rating: ${maxSoreness}/5)`

      return { score, description, rawValue: Math.round(composite * 10) / 10 }
    },
  },
  {
    id: "hrv",
    name: "Heart Rate Variability",
    rawWeight: 0.05,
    calculate: (entry) => {
      if (entry.hrv == null || entry.hrv <= 0) return null
      let score: number
      if (entry.hrv >= 75) score = 100
      else if (entry.hrv >= 65) score = 85
      else if (entry.hrv >= 55) score = 70
      else if (entry.hrv >= 45) score = 50
      else score = 30

      return {
        score,
        description: `${entry.hrv} ms (rMSSD)`,
        rawValue: entry.hrv,
      }
    },
  },
  {
    id: "resting_hr",
    name: "Resting Heart Rate",
    rawWeight: 0.05,
    calculate: (entry) => {
      if (entry.restingHR == null || entry.restingHR <= 0) return null
      let score: number
      if (entry.restingHR <= 52) score = 100
      else if (entry.restingHR <= 58) score = 85
      else if (entry.restingHR <= 65) score = 70
      else if (entry.restingHR <= 72) score = 50
      else score = 35

      return {
        score,
        description: `${entry.restingHR} bpm`,
        rawValue: entry.restingHR,
      }
    },
  },
]

/**
 * Pure, deterministic calculation of Readiness Score (0-100) with factor breakdown.
 *
 * Rules:
 * 1. Missing data is NEVER silently defaulted to 0 or 100.
 * 2. Available factor weights are dynamically normalized to sum to exactly 1.0 (100%).
 * 3. If data completeness is below the minimum threshold (default 40%), returns Insufficient Data.
 * 4. Transparent breakdown is provided for every factor.
 */
export function calculateReadinessScore(
  entry?: Partial<DailyRecoveryEntry> | null,
  config: RecoveryConfig = DEFAULT_RECOVERY_CONFIG
): ReadinessCalculationResult {
  const calculatedAt = new Date().toISOString()

  if (!entry) {
    return {
      score: null,
      category: "Insufficient Data",
      factors: FACTOR_DEFINITIONS.map((f) => ({
        factorId: f.id,
        name: f.name,
        score: 0,
        weight: 0,
        rawWeight: f.rawWeight,
        contribution: 0,
        status: "missing",
        description: "No data recorded",
        isAvailable: false,
      })),
      completenessPct: 0,
      isSufficientData: false,
      summaryMessage: "Check in with sleep and daily wellness to evaluate readiness.",
      calculatedAt,
    }
  }

  // 1. Evaluate all factors
  const evaluatedFactors: {
    def: FactorDef
    result: { score: number; description: string; rawValue: number | string | null } | null
  }[] = FACTOR_DEFINITIONS.map((def) => ({
    def,
    result: def.calculate(entry, config),
  }))

  // 2. Determine available factors & total available nominal weight
  const availableItems = evaluatedFactors.filter((item) => item.result !== null)
  const totalAvailableRawWeight = availableItems.reduce(
    (sum, item) => sum + item.def.rawWeight,
    0
  )
  const completenessPct = Math.round(totalAvailableRawWeight * 100)
  const isSufficientData = completenessPct >= (config.minCompletenessPct ?? 40)

  // 3. Normalize factor weights and calculate contributions
  const factors: ReadinessFactorBreakdown[] = evaluatedFactors.map(({ def, result }) => {
    if (!result || totalAvailableRawWeight === 0) {
      return {
        factorId: def.id,
        name: def.name,
        score: 0,
        weight: 0,
        rawWeight: def.rawWeight,
        contribution: 0,
        status: "missing",
        description: "Not logged",
        isAvailable: false,
      }
    }

    const effectiveWeight = def.rawWeight / totalAvailableRawWeight
    const contribution = Math.round(result.score * effectiveWeight)
    const status =
      result.score >= 80 ? "optimal" : result.score >= 60 ? "moderate" : "low"

    return {
      factorId: def.id,
      name: def.name,
      score: result.score,
      weight: effectiveWeight,
      rawWeight: def.rawWeight,
      contribution,
      status,
      description: result.description,
      rawValue: result.rawValue,
      isAvailable: true,
    }
  })

  // 4. Compute final overall score
  if (!isSufficientData) {
    return {
      score: null,
      category: "Insufficient Data",
      factors,
      completenessPct,
      isSufficientData: false,
      summaryMessage: `Partial check-in recorded (${completenessPct}% completeness). Log sleep or wellness ratings to reach ${config.minCompletenessPct}% for readiness evaluation.`,
      calculatedAt,
    }
  }

  const rawScoreSum = factors.reduce((sum, f) => sum + f.contribution, 0)
  const finalScore = Math.min(100, Math.max(0, rawScoreSum))

  // 5. Objective neutral categorization
  let category: ReadinessCalculationResult["category"]
  let summaryMessage: string

  if (finalScore >= 80) {
    category = "High Readiness"
    summaryMessage =
      "Recovery indicators are favorable. Capacity supports programmed high-intensity and volume."
  } else if (finalScore >= 60) {
    category = "Moderate Readiness"
    summaryMessage =
      "Adequate baseline recovery. Normal training session volume is well-tolerated."
  } else {
    category = "Low Readiness"
    summaryMessage =
      "Elevated systemic strain or reduced sleep reported. Consider prioritizing warm-up and monitoring session RPE."
  }

  return {
    score: finalScore,
    category,
    factors,
    completenessPct,
    isSufficientData: true,
    summaryMessage,
    calculatedAt,
  }
}
