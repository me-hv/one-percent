import type { Timestamp } from "firebase/firestore"

// ─── Sleep Log Entry ──────────────────────────────────────────────
export interface SleepLog {
  id:          string
  userId:      string
  date:        string           // "YYYY-MM-DD" (morning date after sleep)

  // Sleep times
  asleepAt:    Timestamp
  awakeAt:     Timestamp
  durationSeconds: number       // Time asleep (total)
  timeInBedSeconds: number

  // Sleep stages (optional, for wearable integration)
  deepSeconds?:  number
  remSeconds?:   number
  lightSeconds?: number
  awakeSeconds?: number

  // Sleep quality
  qualityScore?: number         // User self-rating (1-10) or wearable rating (1-100)
  restingHR?:    number         // bpm
  hrv?:          number         // ms (Heart Rate Variability)
  respiratoryRate?: number      // breaths per minute

  notes?:        string
  source:        SleepSource    // "manual" | "whoop" | "oura" | "apple_health" | "garmin"
  createdAt:     Timestamp
  updatedAt:     Timestamp
}

export type SleepSource = "manual" | "whoop" | "oura" | "apple_health" | "garmin"

// ─── Recovery Score ───────────────────────────────────────────────
export interface RecoveryScore {
  id:          string
  userId:      string
  date:        string           // "YYYY-MM-DD"
  score:       number           // 1 to 100

  // Metrics contributing to recovery
  hrv?:          number
  restingHR?:    number
  sleepPerformancePct?: number  // Sleep duration vs. sleep need
  skinTempDeviation?:   number  // Celsius offset from baseline

  source:      SleepSource
  createdAt:   Timestamp
  updatedAt:   Timestamp
}

// ─── Readiness Log (Manual Check-in) ──────────────────────────────
export interface ReadinessLog {
  id:          string
  userId:      string
  date:        string           // "YYYY-MM-DD"

  // Self-assessments (1-10 scales)
  soreness:    number           // 1 = fresh, 10 = extremely sore
  soreMuscles: string[]         // Muscle names sore today
  energy:      number           // 1 = exhausted, 10 = high energy
  stress:      number           // 1 = calm, 10 = high stress
  motivation:  number           // 1 = none, 10 = ready to train
  injuryRisk?: number

  notes?:      string
  createdAt:   Timestamp
}
