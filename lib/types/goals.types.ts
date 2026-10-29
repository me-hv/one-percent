import type { Timestamp } from "firebase/firestore"

export type GoalCategory =
  | "strength"
  | "body_comp"
  | "consistency"
  | "nutrition"
  | "custom"
  // Legacy aliases
  | "training"
  | "bodyweight"
  | "body_measurement"
  | "recovery"
  | "habit"
  | "other"

export type GoalPriority = "low" | "medium" | "high"

export type GoalStatus = "active" | "completed" | "abandoned"

export type GoalType = "numeric" | "binary"

export type AutoUpdateKey =
  | "bench_press"
  | "squat"
  | "deadlift"
  | "ohp"
  | "pull_up"
  | "body_weight"
  | "body_fat"
  | "muscle_mass"
  | "workout_streak"
  | "weekly_sessions"
  | "monthly_sessions"
  | "program_completion"
  | "daily_calories"
  | "daily_protein"
  | "water_intake"
  | "sleep_hours"
  | "readiness_score"
  | "custom"

export interface GoalMilestone {
  id:          string
  title:       string
  targetValue?: number
  completed:   boolean
  completedAt?: Timestamp
}

export interface Goal {
  id:           string
  userId:       string
  title:        string
  description?: string

  category:     GoalCategory
  priority:     GoalPriority
  type:         GoalType

  // Metric tracking
  startValue?:  number
  targetValue?: number
  currentValue?: number
  unit?:        string          // "kg", "%", "days", "sessions", "L", "hrs", etc.
  
  // Dynamic sync binding
  autoUpdateKey?: AutoUpdateKey
  exerciseId?:   string         // Optional link for strength goals (e.g. "ex-chest-001")

  // Target date
  deadline?:    Timestamp
  deadlineStr?: string          // "YYYY-MM-DD"

  // Status & Progress
  status:       GoalStatus
  progressPct:  number          // 0 - 100
  milestones?:  GoalMilestone[]
  notes?:       string

  completedAt?: Timestamp
  createdAt:    Timestamp
  updatedAt:    Timestamp
  schemaVersion?: number
}

export interface GoalProgressLog {
  id:        string
  userId:    string
  goalId:    string
  value:     number
  date:      string             // "YYYY-MM-DD"
  notes?:    string
  createdAt: Timestamp
}
