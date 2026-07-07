/**
 * Common shared types used across all feature modules.
 * Domain-specific types live in their feature's types/ directory.
 */
import type { Timestamp } from "firebase/firestore"

// ─── Firestore Base ────────────────────────────────────────────────
export interface FirestoreDoc {
  id:        string
  createdAt: Timestamp
  updatedAt: Timestamp
  userId:    string
}

// ─── Units ────────────────────────────────────────────────────────
export type WeightUnit   = "kg" | "lbs"
export type DistanceUnit = "km" | "mi"
export type HeightUnit   = "cm" | "ft"
export type LengthUnit   = "cm" | "in"

export interface UnitPreferences {
  weight:   WeightUnit
  distance: DistanceUnit
  height:   HeightUnit
  length:   LengthUnit
}

// ─── Time Periods ─────────────────────────────────────────────────
export type TimePeriod = "week" | "month" | "3months" | "6months" | "year"
export type DayOfWeek  = 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Sunday

// ─── API Response Shapes ──────────────────────────────────────────
export interface ApiResponse<T> {
  data:    T
  error:   null
}
export interface ApiError {
  data:    null
  error:   {
    code:    string
    message: string
  }
}
export type ApiResult<T> = ApiResponse<T> | ApiError

// ─── Pagination ───────────────────────────────────────────────────
export interface PaginationParams {
  limit:  number
  cursor?: string // Firestore document ID for cursor-based pagination
}

export interface PaginatedResult<T> {
  items:      T[]
  nextCursor: string | null
  hasMore:    boolean
  total?:     number
}

// ─── Sort / Filter ────────────────────────────────────────────────
export type SortOrder = "asc" | "desc"

export interface SortParams<T extends string = string> {
  field: T
  order: SortOrder
}

// ─── Async State ──────────────────────────────────────────────────
export type AsyncStatus = "idle" | "loading" | "success" | "error"

// ─── Trend / Change ───────────────────────────────────────────────
export type TrendDirection = "up" | "down" | "flat"

export interface TrendData {
  value:     number
  change:    number           // Absolute change
  changePct: number           // Percentage change
  direction: TrendDirection
}

// ─── Status Semantic ──────────────────────────────────────────────
export type StatusSemantic = "positive" | "warning" | "negative" | "neutral" | "info"

// ─── Muscle Groups ────────────────────────────────────────────────
export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves"
  | "traps"
  | "lats"
  | "full_body"
  | "cardio"

// ─── Date String (YYYY-MM-DD) ─────────────────────────────────────
export type DateString = string  // ISO 8601 date string "2026-07-05"

// ─── ID Types ─────────────────────────────────────────────────────
export type UserId      = string
export type ExerciseId  = string
export type SessionId   = string
export type ProgramId   = string
export type HabitId     = string
export type GoalId      = string

// ─── Upload ───────────────────────────────────────────────────────
export interface UploadResult {
  url:          string
  storagePath:  string
  fileName:     string
  fileSize:     number
  mimeType:     string
}

// ─── Notification ─────────────────────────────────────────────────
export type NotificationType =
  | "workout_reminder"
  | "streak_milestone"
  | "pr_achieved"
  | "goal_progress"
  | "coach_message"
  | "weekly_summary"
  | "habit_reminder"

// ─── Network ──────────────────────────────────────────────────────
export type NetworkStatus = "online" | "offline" | "slow"
