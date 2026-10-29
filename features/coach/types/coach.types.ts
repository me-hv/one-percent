import type { Timestamp } from "firebase/firestore"
import type { MuscleGroup } from "@/lib/types/common.types"

// ─── Categories & Priorities ──────────────────────────────────────
export type RecommendationCategory =
  | "progression"
  | "recovery"
  | "consistency"
  | "nutrition"
  | "goal_alignment"
  | "program_adherence"
  | "data_quality"

export type RecommendationPriority = "critical" | "high" | "medium" | "low"

export type ConfidenceLevel = "high" | "medium" | "low"

export type RecommendationStatus = "active" | "accepted" | "dismissed" | "completed"

// ─── Supporting Evidence ──────────────────────────────────────────
export interface SupportingEvidence {
  metric: string             // e.g. "Target Rep Completion", "Recent Session RPE", "Readiness Score"
  observedValue: string | number
  baselineOrTarget?: string | number
  threshold?: string | number
  unit?: string
  timeframe: string          // e.g. "Last 2 sessions", "Today's check-in", "Trailing 7 days"
  sourceDataRef?: string     // e.g. "sessions[0].exercises[2]", "recoveryScores[0]"
  interpretation: string     // Human-readable plain English context
}

// ─── Action Dispatcher ────────────────────────────────────────────
export interface RecommendationAction {
  type:
    | "adaptive_proposal"
    | "start_workout"
    | "log_nutrition"
    | "check_in"
    | "view_goal"
    | "navigate"
  label: string
  url?: string
  proposalId?: string
  payload?: Record<string, unknown>
}

// ─── Coaching Recommendation ──────────────────────────────────────
export interface CoachingRecommendation {
  id: string
  category: RecommendationCategory
  priority: RecommendationPriority
  title: string
  recommendation: string     // "What to do"
  rationale: string          // "Why this is recommended"
  evidence: SupportingEvidence[]
  confidence: ConfidenceLevel
  dataCompletenessPct: number // 0 to 100
  missingDataNotice?: string
  action?: RecommendationAction
  status: RecommendationStatus
  createdAt: string          // ISO Date string
  expiresAt?: string
  cooldownUntil?: string
  userFeedback?: "helpful" | "not_helpful" | "inaccurate"
}

// ─── Adaptive Programming Proposal ────────────────────────────────
export type AdaptiveProposalType =
  | "load_increase"
  | "load_hold"
  | "load_reduction"
  | "exercise_substitution"
  | "volume_adjustment"
  | "schedule_adjustment"

export type AdaptiveProposalStatus = "pending" | "accepted" | "rejected" | "reverted"

export interface AdaptiveProposal {
  id: string
  userId: string
  programId: string
  programName: string
  dayId: string
  dayName: string
  exerciseId: string
  exerciseName: string
  type: AdaptiveProposalType
  currentPlanSummary: string  // e.g. "Barbell Bench Press: 3x8 @ 80.0kg"
  proposedPlanSummary: string // e.g. "Barbell Bench Press: 3x8 @ 82.5kg (+2.5kg)"
  currentDetails: {
    weightKg?: number
    sets?: number
    reps?: string
    rpe?: number
  }
  proposedDetails: {
    weightKg?: number
    sets?: number
    reps?: string
    rpe?: number
    substitutedExerciseId?: string
    substitutedExerciseName?: string
  }
  rationale: string
  evidence: SupportingEvidence[]
  status: AdaptiveProposalStatus
  previousProgramSnapshot?: string // JSON serialized previous ProgramDay / ProgramExercise for 1-click rollback
  createdAt: string
  reviewedAt?: string
}

// ─── Weekly Coaching Review ───────────────────────────────────────
export interface WeeklyCoachingReview {
  id: string
  userId: string
  weekStartDate: string      // "YYYY-MM-DD"
  weekEndDate: string        // "YYYY-MM-DD"
  completedSessions: number
  plannedSessions: number
  adherenceRatePct: number
  totalVolumeKg: number
  volumeChangePct: number
  topAchievements: string[]
  recoverySummary: {
    averageReadiness: number
    averageSleepHours: number
    sorenessHotspots: string[]
  }
  nutritionSummary: {
    calorieAdherencePct: number
    proteinAdherencePct: number
    averageWaterLiters: number
  }
  keyInsights: string[]
  focusAreasNextWeek: string[]
  proposedProgramAdjustments?: AdaptiveProposal[]
  status: "draft" | "reviewed"
  createdAt: string
}

// ─── Coach Conversation ───────────────────────────────────────────
export interface CoachChatMessage {
  id: string
  sender: "user" | "coach"
  text: string
  timestamp: string
  category?: RecommendationCategory
  evidence?: SupportingEvidence[]
  suggestedQuestions?: string[]
  source: "deterministic" | "llm_enhanced"
}

// ─── Audit Events ─────────────────────────────────────────────────
export interface CoachAuditEvent {
  id: string
  timestamp: string
  eventType:
    | "recommendation_generated"
    | "recommendation_accepted"
    | "recommendation_dismissed"
    | "proposal_generated"
    | "proposal_accepted"
    | "proposal_rejected"
    | "proposal_reverted"
    | "review_generated"
  entityId: string
  details?: Record<string, unknown>
}
