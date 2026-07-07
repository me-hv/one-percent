import type { Timestamp } from "firebase/firestore"

// ─── Weight Log Entry ─────────────────────────────────────────────
export interface WeightLog {
  id:          string
  userId:      string
  weightKg:    number           // Weight value stored in kg
  loggedAt:    Timestamp        // Specific time (e.g. morning weigh-in)
  date:        string           // "YYYY-MM-DD"
  notes?:      string
  createdAt:   Timestamp
}

// ─── Body Measurements ────────────────────────────────────────────
export interface BodyMeasurements {
  id:          string
  userId:      string
  date:        string           // "YYYY-MM-DD"
  loggedAt:    Timestamp

  // Circumferences (all stored in cm)
  neck?:       number
  shoulders?:  number
  chest?:      number
  bicepLeft?:  number
  bicepRight?: number
  forearmLeft?: number
  forearmRight?: number
  waist?:      number           // At navel
  hips?:       number
  thighLeft?:  number
  thighRight?: number
  calfLeft?:   number
  calfRight?:  number

  // Composition metrics
  bodyFatPct?: number
  skeletalMuscleKg?: number

  notes?:      string
  createdAt:   Timestamp
  updatedAt:   Timestamp
}

// ─── Progress Photo ───────────────────────────────────────────────
export interface ProgressPhoto {
  id:          string
  userId:      string
  storagePath: string           // Firebase storage path
  url:         string           // CDN URL
  date:        string           // "YYYY-MM-DD"
  pose:        ProgressPhotoPose
  weightKg?:   number           // Weight on that day if available
  notes?:      string
  createdAt:   Timestamp
}

export type ProgressPhotoPose = "front" | "side" | "back" | "flexed" | "relaxed"

// ─── Weight Trends ────────────────────────────────────────────────
export interface WeightTrends {
  currentWeight: number
  startWeight:   number
  targetWeight?: number

  // Moving averages (to smooth out water weight fluctuations)
  weeklyAverage: number
  previousWeeklyAverage: number
  averageChange: number          // Current week average - prev week average

  // Highs / Lows
  allTimeHigh:   number
  allTimeLow:    number
}
