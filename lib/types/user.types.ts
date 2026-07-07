import type { Timestamp } from "firebase/firestore"
import type { UnitPreferences } from "./common.types"

// ─── User Profile ─────────────────────────────────────────────────
export interface UserProfile {
  id:          string
  uid:         string           // Firebase Auth UID
  email:       string
  displayName: string
  photoURL?:   string
  createdAt:   Timestamp
  updatedAt:   Timestamp

  // Personal details
  dateOfBirth?: string          // "YYYY-MM-DD"
  gender?:      "male" | "female" | "other" | "prefer_not_to_say"
  heightCm?:    number
  timezone:     string          // IANA timezone, e.g. "America/New_York"
  locale:       string          // BCP47, e.g. "en-US"

  // Onboarding
  onboardingCompleted: boolean
  experienceLevel?:    ExperienceLevel
  primaryGoals?:       FitnessGoalType[]
  trainingDaysPerWeek?: number

  // Subscription
  plan:        SubscriptionPlan
  planStatus:  SubscriptionStatus
  trialEndsAt?: Timestamp

  // Feature flags
  features:    Record<string, boolean>
}

// ─── User Preferences ─────────────────────────────────────────────
export interface UserPreferences {
  userId:    string
  units:     UnitPreferences
  theme:     "dark" | "light" | "system"
  startOfWeek: 0 | 1            // 0 = Sunday, 1 = Monday

  // Dashboard customization
  dashboardWidgets: DashboardWidget[]
  sidebarCollapsed: boolean

  // Notifications
  notifications: NotificationPreferences
}

// ─── Dashboard Widget ─────────────────────────────────────────────
export interface DashboardWidget {
  id:       string
  type:     DashboardWidgetType
  position: number
  visible:  boolean
  config?:  Record<string, unknown>
}

export type DashboardWidgetType =
  | "training_summary"
  | "streak"
  | "body_weight"
  | "todays_nutrition"
  | "recovery_score"
  | "habit_completion"
  | "active_goal"
  | "recent_prs"
  | "coach_briefing"
  | "volume_trend"
  | "weekly_overview"

// ─── Notification Preferences ────────────────────────────────────
export interface NotificationPreferences {
  workoutReminders:    boolean
  workoutReminderTime: string   // "HH:mm"
  habitReminders:      boolean
  weeklyDigest:        boolean
  prAlerts:            boolean
  goalUpdates:         boolean
  coachMessages:       boolean
  streakAlerts:        boolean
}

// ─── Subscription ─────────────────────────────────────────────────
export type SubscriptionPlan   = "free" | "pro" | "pro_annual" | "lifetime"
export type SubscriptionStatus = "active" | "trial" | "cancelled" | "expired" | "paused"

// ─── Experience Level ─────────────────────────────────────────────
export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "elite"

// ─── Fitness Goal Types ───────────────────────────────────────────
export type FitnessGoalType =
  | "lose_weight"
  | "gain_muscle"
  | "improve_strength"
  | "improve_endurance"
  | "improve_health"
  | "sport_performance"
  | "recomposition"
  | "maintain"
