/**
 * Adaptive Programming Service
 *
 * Provides a controlled, transparent mechanism to propose adjustments to an athlete's
 * active training program based on physiological readiness, workload, and performance.
 *
 * CRITICAL RULE: Never silently mutate an active workout or training program.
 * Changes require explicit user review and approval, and can be reverted at any time.
 */

import type {
  AdaptiveProposal,
  AdaptiveProposalType,
  SupportingEvidence,
} from "../types/coach.types"
import type { TrainingProgram, ProgramDay, ProgramExercise } from "@/lib/types/training.types"

export interface CreateProposalParams {
  userId: string
  program: TrainingProgram
  day: ProgramDay
  exercise: ProgramExercise
  type: AdaptiveProposalType
  proposedWeightKg?: number
  proposedSets?: number
  proposedReps?: string
  proposedRpe?: number
  substitutedExerciseId?: string
  substitutedExerciseName?: string
  rationale: string
  evidence: SupportingEvidence[]
}

/**
 * Creates a structured proposal for program adaptation.
 */
export function createAdaptiveProposal(params: CreateProposalParams): AdaptiveProposal {
  const { program, day, exercise, type } = params
  const currentWeight = exercise.targetWeight ?? 0
  const currentSets = exercise.targetSets
  const currentReps = exercise.targetReps

  let currentPlanSummary = `${exercise.exercise?.name || "Exercise"}: ${currentSets}x${currentReps}`
  if (currentWeight > 0) currentPlanSummary += ` @ ${currentWeight}kg`

  let proposedPlanSummary = ""
  if (type === "load_increase") {
    const diff = (params.proposedWeightKg ?? currentWeight) - currentWeight
    proposedPlanSummary = `${exercise.exercise?.name || "Exercise"}: ${params.proposedSets ?? currentSets}x${params.proposedReps ?? currentReps} @ ${params.proposedWeightKg}kg (+${diff.toFixed(1)}kg)`
  } else if (type === "load_reduction") {
    const diff = currentWeight - (params.proposedWeightKg ?? currentWeight)
    proposedPlanSummary = `${exercise.exercise?.name || "Exercise"}: ${params.proposedSets ?? currentSets}x${params.proposedReps ?? currentReps} @ ${params.proposedWeightKg}kg (-${diff.toFixed(1)}kg)`
  } else if (type === "exercise_substitution") {
    proposedPlanSummary = `Substitute with ${params.substitutedExerciseName || "Alternative"}: ${currentSets}x${currentReps}`
  } else {
    proposedPlanSummary = `${exercise.exercise?.name || "Exercise"}: ${params.proposedSets ?? currentSets}x${params.proposedReps ?? currentReps} @ ${params.proposedWeightKg ?? currentWeight}kg`
  }

  // Capture snapshot of target exercise before any modifications for 1-click rollback
  const snapshot = JSON.stringify({
    programId: program.id,
    dayId: day.id,
    exerciseId: exercise.id,
    originalExercise: exercise,
  })

  return {
    id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    programId: program.id,
    programName: program.name,
    dayId: day.id,
    dayName: day.name,
    exerciseId: exercise.id,
    exerciseName: exercise.exercise?.name || "Exercise",
    type,
    currentPlanSummary,
    proposedPlanSummary,
    currentDetails: {
      weightKg: currentWeight,
      sets: currentSets,
      reps: currentReps,
      rpe: exercise.targetRPE,
    },
    proposedDetails: {
      weightKg: params.proposedWeightKg,
      sets: params.proposedSets,
      reps: params.proposedReps,
      rpe: params.proposedRpe,
      substitutedExerciseId: params.substitutedExerciseId,
      substitutedExerciseName: params.substitutedExerciseName,
    },
    rationale: params.rationale,
    evidence: params.evidence,
    status: "pending",
    previousProgramSnapshot: snapshot,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Applies an approved proposal to the active training program.
 */
export function applyAdaptiveProposal(
  proposal: AdaptiveProposal,
  actions: {
    updateExerciseInDay: (
      programId: string,
      dayId: string,
      exerciseId: string,
      updates: Partial<ProgramExercise>
    ) => void
    replaceExerciseInDay?: (
      programId: string,
      dayId: string,
      exerciseId: string,
      newExerciseId: string
    ) => void
  }
): AdaptiveProposal {
  if (proposal.status !== "pending") {
    throw new Error(`Cannot apply proposal in status: ${proposal.status}`)
  }

  // Exercise substitution
  if (
    proposal.type === "exercise_substitution" &&
    proposal.proposedDetails.substitutedExerciseId &&
    actions.replaceExerciseInDay
  ) {
    actions.replaceExerciseInDay(
      proposal.programId,
      proposal.dayId,
      proposal.exerciseId,
      proposal.proposedDetails.substitutedExerciseId
    )
  } else {
    // Load, sets, or reps adjustment
    const updates: Partial<ProgramExercise> = {}
    if (proposal.proposedDetails.weightKg !== undefined) {
      updates.targetWeight = proposal.proposedDetails.weightKg
    }
    if (proposal.proposedDetails.sets !== undefined) {
      updates.targetSets = proposal.proposedDetails.sets
    }
    if (proposal.proposedDetails.reps !== undefined) {
      updates.targetReps = proposal.proposedDetails.reps
    }
    if (proposal.proposedDetails.rpe !== undefined) {
      updates.targetRPE = proposal.proposedDetails.rpe
    }

    actions.updateExerciseInDay(proposal.programId, proposal.dayId, proposal.exerciseId, updates)
  }

  return {
    ...proposal,
    status: "accepted",
    reviewedAt: new Date().toISOString(),
  }
}

export interface RevertProposalActions {
  updateExerciseInDay: (
    programId: string,
    dayId: string,
    exerciseId: string,
    updates: Partial<ProgramExercise>
  ) => void
  replaceExerciseInDay?: (
    programId: string,
    dayId: string,
    exerciseId: string,
    newExerciseId: string
  ) => void
}

export interface RevertProposalOptions {
  /** If provided, checks if the exercise was modified after proposal acceptance */
  currentExercise?: ProgramExercise
  /** If true, forces reversion even if subsequent edits were detected */
  force?: boolean
}

/**
 * Reverts a previously accepted proposal back to its original state using the stored snapshot.
 * Detects conflicts if the affected exercise was modified after the proposal was accepted.
 */
export function revertAdaptiveProposal(
  proposal: AdaptiveProposal,
  actions: RevertProposalActions,
  options?: RevertProposalOptions
): AdaptiveProposal {
  if (proposal.status !== "accepted") {
    throw new Error(`Can only revert accepted proposals. Current status: ${proposal.status}`)
  }

  if (!proposal.previousProgramSnapshot) {
    throw new Error("No previous program snapshot available to revert.")
  }

  // Conflict detection: verify if the affected exercise has changed since proposal acceptance
  if (options?.currentExercise && !options.force) {
    const cur = options.currentExercise
    const proposed = proposal.proposedDetails

    let hasConflict = false
    const conflicts: string[] = []

    if (proposal.type === "exercise_substitution") {
      if (proposed.substitutedExerciseId && cur.exerciseId !== proposed.substitutedExerciseId) {
        hasConflict = true
        conflicts.push(`Exercise was substituted again to ${cur.exerciseId}`)
      }
    } else {
      if (proposed.weightKg !== undefined && cur.targetWeight !== proposed.weightKg) {
        hasConflict = true
        conflicts.push(`Weight changed to ${cur.targetWeight}kg (expected ${proposed.weightKg}kg)`)
      }
      if (proposed.sets !== undefined && cur.targetSets !== proposed.sets) {
        hasConflict = true
        conflicts.push(`Sets changed to ${cur.targetSets} (expected ${proposed.sets})`)
      }
      if (proposed.reps !== undefined && cur.targetReps !== proposed.reps) {
        hasConflict = true
        conflicts.push(`Reps changed to ${cur.targetReps} (expected ${proposed.reps})`)
      }
    }

    if (hasConflict) {
      throw new Error(
        `Conflict detected: Exercise was modified after proposal acceptance (${conflicts.join(
          ", "
        )}). Reverting would overwrite subsequent changes. Pass force: true to override.`
      )
    }
  }

  const parsed = JSON.parse(proposal.previousProgramSnapshot)
  const orig: ProgramExercise = parsed.originalExercise

  if (proposal.type === "exercise_substitution" && actions.replaceExerciseInDay && orig.exerciseId) {
    actions.replaceExerciseInDay(
      proposal.programId,
      proposal.dayId,
      proposal.exerciseId,
      orig.exerciseId
    )
  }

  actions.updateExerciseInDay(proposal.programId, proposal.dayId, proposal.exerciseId, {
    targetWeight: orig.targetWeight,
    targetSets: orig.targetSets,
    targetReps: orig.targetReps,
    targetRPE: orig.targetRPE,
  })

  return {
    ...proposal,
    status: "reverted",
    reviewedAt: new Date().toISOString(),
  }
}
