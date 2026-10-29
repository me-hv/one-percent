/**
 * Schema Version Constants
 * Single source of truth for persistent schema versioning and data migrations.
 */

export const CURRENT_SCHEMA_VERSION = 1

export const STORE_PERSIST_KEYS = {
  workout: "one-percent-workout-store",
  goals: "one-percent-goals-store",
  body: "one-percent-body-store",
  analytics: "one-percent-analytics-store",
  exercise: "one-percent-exercise-store",
  program: "one-percent-program-store",
  recovery: "one-percent-recovery-store",
  coach: "one-percent-coach-store",
} as const
