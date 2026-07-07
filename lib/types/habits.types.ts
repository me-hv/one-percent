import type { Timestamp } from "firebase/firestore"

// ─── Habit Definition ─────────────────────────────────────────────
export interface Habit {
  id:          string
  userId:      string
  name:        string
  description?: string

  // Scheduling
  frequency:   HabitFrequency
  daysOfWeek?: number[]         // 0 = Sunday, 1 = Monday (empty if daily)
  customIntervalDays?: number   // Every X days

  // Completion criteria
  category:    HabitCategory
  targetCount: number           // e.g. 1 (checkbox), 8 (glasses of water)
  unit?:       string           // e.g. "glasses", "pages", "mins"

  // Status
  archived:    boolean
  streak:      number           // Current consecutive completions
  bestStreak:  number           // All-time longest streak
  totalCompletions: number

  createdAt:   Timestamp
  updatedAt:   Timestamp
}

export type HabitFrequency = "daily" | "weekly" | "custom"

export type HabitCategory =
  | "nutrition"
  | "training"
  | "recovery"
  | "hydration"
  | "mindset"
  | "custom"

// ─── Habit Completion Log ─────────────────────────────────────────
export interface HabitLog {
  id:          string
  userId:      string
  habitId:     string
  date:        string           // "YYYY-MM-DD"
  count:       number           // Completed count (e.g. 3 of 8 glasses)
  completed:   boolean          // Set true when count >= targetCount
  notes?:      string
  createdAt:   Timestamp
  updatedAt:   Timestamp
}

// ─── Habit Stats ──────────────────────────────────────────────────
export interface HabitStats {
  habitId:          string
  completionRate:   number       // Percentage of days completed
  totalCompletions: number
  currentStreak:    number
  longestStreak:    number
  completionTrend:  boolean[]    // Last 30 days (true = completed, false = missed)
}
