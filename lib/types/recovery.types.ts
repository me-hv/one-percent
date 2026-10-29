import type { Timestamp } from "firebase/firestore"
import type { MuscleGroup } from "./common.types"
export type { MuscleGroup } from "./common.types"

// ─── Scale Enums & Documentation ──────────────────────────────────
/**
 * Soreness Rating Scale:
 * 0 = None (Completely fresh, no pain or tension)
 * 1 = Minimal (Barely perceptible tightness upon stretching)
 * 2 = Mild (Noticeable tightness/light soreness, does not impede movement)
 * 3 = Moderate (Standard DOMS, tender to touch, slight movement stiffness)
 * 4 = High (Significant soreness, distinctly limits range of motion)
 * 5 = Severe (Extreme DOMS or acute strain, intense discomfort during movement)
 */
export type SorenessRating = 0 | 1 | 2 | 3 | 4 | 5

/**
 * 1–5 Wellness Scale:
 * Energy: 1 (Exhausted) -> 5 (Peak Energy)
 * Stress: 1 (Very Calm / Low) -> 5 (Extreme Stress)
 * Fatigue: 1 (Fresh / Rested) -> 5 (Severe Exhaustion)
 * Motivation: 1 (Zero / Apathetic) -> 5 (Primed / Eager to Train)
 * Sleep Quality: 1 (Poor / Disturbed) -> 5 (Restorative / Deep)
 */
export type WellnessRating1to5 = 1 | 2 | 3 | 4 | 5

export const WELLNESS_SCALE_LABELS = {
  energy: {
    1: "Exhausted",
    2: "Low Energy",
    3: "Moderate",
    4: "High Energy",
    5: "Peak Energy",
  },
  stress: {
    1: "Very Calm",
    2: "Low Stress",
    3: "Moderate",
    4: "Elevated",
    5: "Severe Stress",
  },
  fatigue: {
    1: "Fully Rested",
    2: "Mild Fatigue",
    3: "Moderate",
    4: "High Fatigue",
    5: "Exhausted",
  },
  motivation: {
    1: "Apathetic",
    2: "Low",
    3: "Moderate",
    4: "Driven",
    5: "Fully Primed",
  },
  sleepQuality: {
    1: "Poor / Restless",
    2: "Fair",
    3: "Average",
    4: "Good",
    5: "Deep / Restorative",
  },
  soreness: {
    0: "None / Fresh",
    1: "Minimal",
    2: "Mild",
    3: "Moderate",
    4: "High",
    5: "Severe",
  },
} as const

// ─── Daily Recovery & Wellness Check-In Entry ─────────────────────
export interface DailyRecoveryEntry {
  id: string
  userId: string
  date: string // "YYYY-MM-DD" local calendar date

  // Sleep details
  sleepDurationMinutes?: number // Time asleep in minutes (e.g. 450 = 7h 30m)
  bedtime?: string // "HH:MM" (e.g. "23:15")
  wakeTime?: string // "HH:MM" (e.g. "07:00")
  sleepQuality?: WellnessRating1to5

  // Daily wellness self-assessment (1-5 scales)
  energy?: WellnessRating1to5
  stress?: WellnessRating1to5
  fatigue?: WellnessRating1to5
  motivation?: WellnessRating1to5

  // Muscle soreness by group (0-5 scale)
  muscleSoreness: Partial<Record<MuscleGroup, SorenessRating>>

  // Optional biometric indicators
  restingHR?: number // bpm
  hrv?: number // ms (rMSSD)

  notes?: string
  schemaVersion: number
  createdAt: string
  updatedAt: string
}

export type WellnessCheckIn = DailyRecoveryEntry

// ─── Configuration ───────────────────────────────────────────────
export interface RecoveryConfig {
  targetSleepMinutes: number // User configured target (e.g. 480 mins = 8h)
  minCompletenessPct: number // Minimum factor completeness required for readiness score (default: 40%)
}

// ─── Readiness Calculation Types ──────────────────────────────────
export type ReadinessFactorId =
  | "sleep_duration"
  | "sleep_quality"
  | "energy"
  | "fatigue"
  | "stress"
  | "muscle_soreness"
  | "hrv"
  | "resting_hr"

export interface ReadinessFactorBreakdown {
  factorId: ReadinessFactorId
  name: string
  score: number // Normalized 0–100
  weight: number // Effective decimal weight (sums to 1.0 across available factors)
  rawWeight: number // Configured nominal weight before missing-data redistribution
  contribution: number // score * weight
  status: "optimal" | "moderate" | "low" | "missing"
  description: string
  rawValue?: number | string | null
  isAvailable: boolean
}

export interface ReadinessCalculationResult {
  score: number | null // 0–100, or null if insufficient data
  category: "High Readiness" | "Moderate Readiness" | "Low Readiness" | "Insufficient Data"
  factors: ReadinessFactorBreakdown[]
  completenessPct: number // 0–100 proportion of factors provided
  isSufficientData: boolean
  summaryMessage: string
  calculatedAt: string
}

// ─── Muscle Recovery Status ───────────────────────────────────────
export interface MuscleRecoveryStatus {
  muscle: MuscleGroup
  lastTrainedDate: string | null
  daysSinceTrained: number | null
  totalSets7d: number
  totalVolume7d: number
  currentSoreness: SorenessRating
  recoveryEstimate: "fresh" | "recovering" | "strained" | "untrained"
  notes: string
}

// ─── Training Load Summary ────────────────────────────────────────
export interface TrainingLoadSummary {
  workoutsCount7d: number
  workoutsCount28d: number
  totalVolume7d: number
  totalVolumePrev7d: number
  volumeChangePct: number | null
  avgWeeklyVolume4w: number
  acwr?: number | null // Acute:Chronic Workload Ratio (with clearly documented caveats)
  acwrStatus?: "optimal" | "undertraining" | "overreaching" | "caution"
  muscleGroupFrequency7d: Partial<Record<MuscleGroup, number>>
  muscleStatuses: MuscleRecoveryStatus[]
  accumulatedFatigueIndicator: "low" | "moderate" | "elevated" | "high"
  accumulatedFatigueReason: string
}

// ─── Recovery Insights ────────────────────────────────────────────
export type RecoveryInsightType =
  | "sleep"
  | "wellness"
  | "muscle"
  | "training_load"
  | "readiness"

export type RecoveryInsightLevel = "positive" | "neutral" | "caution"

export interface RecoveryInsight {
  id: string
  type: RecoveryInsightType
  level: RecoveryInsightLevel
  title: string
  message: string
  observationPeriod: string
  metricValues: Record<string, string | number>
}

// ─── Legacy Wearable & Compatibility Models (Preserved) ───────────
export interface SleepLog {
  id: string
  userId: string
  date: string // "YYYY-MM-DD"
  asleepAt: Timestamp
  awakeAt: Timestamp
  durationSeconds: number
  timeInBedSeconds: number
  deepSeconds?: number
  remSeconds?: number
  lightSeconds?: number
  awakeSeconds?: number
  qualityScore?: number
  restingHR?: number
  hrv?: number
  respiratoryRate?: number
  notes?: string
  source: SleepSource
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type SleepSource = "manual" | "whoop" | "oura" | "apple_health" | "garmin"

export interface RecoveryScore {
  id: string
  userId: string
  date: string // "YYYY-MM-DD"
  score: number // 1 to 100
  hrv?: number
  restingHR?: number
  sleepPerformancePct?: number
  skinTempDeviation?: number
  source: SleepSource
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ReadinessLog {
  id: string
  userId: string
  date: string // "YYYY-MM-DD"
  soreness: number // 1-10
  soreMuscles: string[]
  energy: number // 1-10
  stress: number // 1-10
  motivation: number // 1-10
  injuryRisk?: number
  notes?: string
  createdAt: Timestamp
}
