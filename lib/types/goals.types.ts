import type { Timestamp } from "firebase/firestore"

// ─── Goal Definition ──────────────────────────────────────────────
export interface Goal {
  id:          string
  userId:      string
  title:       string
  description?: string

  // Scope
  category:    GoalCategory

  // Progression metrics
  type:        GoalType         // "numeric" or "binary" (milestone)
  startValue?: number           // e.g. 100 (kg)
  targetValue?: number          // e.g. 140 (kg)
  currentValue?: number
  unit?:       string           // e.g. "kg", "lbs", "%", "workouts"

  // Timeframe
  deadline?:   Timestamp

  // Status
  status:      "active" | "completed" | "abandoned"
  progressPct: number           // Calculated 0-100
  milestones?: GoalMilestone[]

  completedAt?: Timestamp
  createdAt:   Timestamp
  updatedAt:   Timestamp
}

export type GoalCategory =
  | "training"
  | "bodyweight"
  | "body_measurement"
  | "nutrition"
  | "recovery"
  | "habit"
  | "other"

export type GoalType = "numeric" | "binary"

export interface GoalMilestone {
  id:          string
  title:       string
  completed:   boolean
  completedAt?: Timestamp
}

// ─── Goal History / Log ───────────────────────────────────────────
export interface GoalProgressLog {
  id:          string
  userId:      string
  goalId:      string
  value:       number
  date:        string           // "YYYY-MM-DD"
  notes?:      string
  createdAt:   Timestamp
}
