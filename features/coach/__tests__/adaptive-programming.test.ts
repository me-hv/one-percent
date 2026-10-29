import { describe, it, expect, vi } from "vitest"
import {
  createAdaptiveProposal,
  applyAdaptiveProposal,
  revertAdaptiveProposal,
  type CreateProposalParams,
} from "../services/adaptive-programming.service"
import type { TrainingProgram, ProgramDay, ProgramExercise } from "@/lib/types/training.types"

describe("adaptive-programming.service", () => {
  const mockExercise: ProgramExercise = {
    id: "ex-101",
    exerciseId: "squat",
    targetSets: 3,
    targetReps: "5",
    targetWeight: 120,
    targetRPE: 8,
    orderIndex: 0,
    restSeconds: 180,
    exercise: {
      id: "squat",
      name: "Barbell Back Squat",
      category: "barbell",
      equipment: ["barbell"],
      mechanics: "compound",
      muscleGroups: ["quads"],
      secondaryMuscles: ["glutes", "hamstrings"],
      isCustom: false,
    },
  }

  const mockDay: ProgramDay = {
    id: "day-leg",
    name: "Leg Day",
    orderIndex: 0,
    isRestDay: false,
    exercises: [mockExercise],
  }

  const mockProgram: TrainingProgram = {
    id: "prog-test",
    userId: "user-1",
    name: "Strength Block A",
    daysPerWeek: 3,
    difficulty: "intermediate",
    focus: ["strength"],
    isTemplate: false,
    isActive: true,
    isArchived: false,
    days: [mockDay],
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
  }

  it("creates an adaptive proposal with serialized previous snapshot for rollback", () => {
    const params: CreateProposalParams = {
      userId: "user-1",
      program: mockProgram,
      day: mockDay,
      exercise: mockExercise,
      type: "load_increase",
      proposedWeightKg: 125,
      proposedSets: 3,
      proposedReps: "5",
      proposedRpe: 8,
      rationale: "Target reps completed with clean form for 2 consecutive workouts.",
      evidence: [
        {
          metric: "Completed Reps",
          observedValue: "5, 5, 5",
          baselineOrTarget: "5 reps",
          timeframe: "Last 2 sessions",
          interpretation: "All sets completed within target RPE.",
        },
      ],
    }

    const proposal = createAdaptiveProposal(params)

    expect(proposal.id).toBeDefined()
    expect(proposal.status).toBe("pending")
    expect(proposal.exerciseName).toBe("Barbell Back Squat")
    expect(proposal.currentDetails.weightKg).toBe(120)
    expect(proposal.proposedDetails.weightKg).toBe(125)
    expect(proposal.proposedPlanSummary).toContain("125kg (+5.0kg)")
    expect(proposal.previousProgramSnapshot).toBeDefined()

    // Validate snapshot contents
    const snapshot = JSON.parse(proposal.previousProgramSnapshot!)
    expect(snapshot.originalExercise.targetWeight).toBe(120)
  })

  it("applies an adaptive proposal and updates the active program via callbacks", () => {
    const proposal = createAdaptiveProposal({
      userId: "user-1",
      program: mockProgram,
      day: mockDay,
      exercise: mockExercise,
      type: "load_increase",
      proposedWeightKg: 125,
      proposedSets: 3,
      proposedReps: "5",
      rationale: "Overload progression",
      evidence: [],
    })

    const updateExerciseInDay = vi.fn()

    const applied = applyAdaptiveProposal(proposal, { updateExerciseInDay })

    expect(applied.status).toBe("accepted")
    expect(applied.reviewedAt).toBeDefined()
    expect(updateExerciseInDay).toHaveBeenCalledTimes(1)
    expect(updateExerciseInDay).toHaveBeenCalledWith(
      "prog-test",
      "day-leg",
      "ex-101",
      expect.objectContaining({
        targetWeight: 125,
      })
    )
  })

  it("throws an error when trying to apply a proposal that is not in pending status", () => {
    const proposal = createAdaptiveProposal({
      userId: "user-1",
      program: mockProgram,
      day: mockDay,
      exercise: mockExercise,
      type: "load_increase",
      proposedWeightKg: 125,
      rationale: "Overload",
      evidence: [],
    })

    proposal.status = "accepted"

    expect(() =>
      applyAdaptiveProposal(proposal, { updateExerciseInDay: vi.fn() })
    ).toThrowError(/Cannot apply proposal in status: accepted/)
  })

  it("reverts an accepted proposal back to original weight, sets, and reps using the snapshot", () => {
    const proposal = createAdaptiveProposal({
      userId: "user-1",
      program: mockProgram,
      day: mockDay,
      exercise: mockExercise,
      type: "load_increase",
      proposedWeightKg: 125,
      rationale: "Overload",
      evidence: [],
    })

    const updateExerciseInDay = vi.fn()

    const accepted = applyAdaptiveProposal(proposal, { updateExerciseInDay })
    updateExerciseInDay.mockClear()

    const reverted = revertAdaptiveProposal(accepted, { updateExerciseInDay })

    expect(reverted.status).toBe("reverted")
    expect(updateExerciseInDay).toHaveBeenCalledTimes(1)
    expect(updateExerciseInDay).toHaveBeenCalledWith(
      "prog-test",
      "day-leg",
      "ex-101",
      expect.objectContaining({
        targetWeight: 120, // Original weight restored
        targetSets: 3,
        targetReps: "5",
      })
    )
  })

  it("reverts an exercise substitution back to the original exercise ID", () => {
    const proposal = createAdaptiveProposal({
      userId: "user-1",
      program: mockProgram,
      day: mockDay,
      exercise: mockExercise, // original was "squat"
      type: "exercise_substitution",
      substitutedExerciseId: "leg-press",
      substitutedExerciseName: "Leg Press",
      rationale: "Knee soreness flare-up",
      evidence: [],
    })

    const updateExerciseInDay = vi.fn()
    const replaceExerciseInDay = vi.fn()

    const accepted = applyAdaptiveProposal(proposal, { updateExerciseInDay, replaceExerciseInDay })
    expect(replaceExerciseInDay).toHaveBeenCalledWith("prog-test", "day-leg", "ex-101", "leg-press")

    replaceExerciseInDay.mockClear()
    updateExerciseInDay.mockClear()

    const reverted = revertAdaptiveProposal(accepted, { updateExerciseInDay, replaceExerciseInDay })
    expect(reverted.status).toBe("reverted")
    expect(replaceExerciseInDay).toHaveBeenCalledWith("prog-test", "day-leg", "ex-101", "squat")
  })

  it("Scenario 2: preserves unrelated exercises when reverting an accepted proposal", () => {
    const unrelatedExercise: ProgramExercise = {
      id: "ex-unrelated-2",
      exerciseId: "bench-press",
      targetSets: 3,
      targetReps: "8",
      targetWeight: 80,
      orderIndex: 1,
      restSeconds: 120,
    }

    const proposal = createAdaptiveProposal({
      userId: "user-1",
      program: mockProgram,
      day: mockDay,
      exercise: mockExercise, // target is ex-101
      type: "load_increase",
      proposedWeightKg: 125,
      rationale: "Overload",
      evidence: [],
    })

    const updateExerciseInDay = vi.fn()
    const accepted = applyAdaptiveProposal(proposal, { updateExerciseInDay })
    updateExerciseInDay.mockClear()

    revertAdaptiveProposal(accepted, { updateExerciseInDay })

    // Verify update was ONLY called for the target exercise, never for unrelated exercise
    expect(updateExerciseInDay).toHaveBeenCalledWith(
      "prog-test",
      "day-leg",
      "ex-101",
      expect.anything()
    )
    expect(updateExerciseInDay).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "ex-unrelated-2",
      expect.anything()
    )
  })

  it("Scenario 3: detects conflict and refuses rollback if affected exercise was modified after acceptance", () => {
    const proposal = createAdaptiveProposal({
      userId: "user-1",
      program: mockProgram,
      day: mockDay,
      exercise: mockExercise, // 120kg
      type: "load_increase",
      proposedWeightKg: 125,
      rationale: "Overload",
      evidence: [],
    })

    const updateExerciseInDay = vi.fn()
    const accepted = applyAdaptiveProposal(proposal, { updateExerciseInDay })

    // User subsequently modified the exercise manually to 130kg and 4 sets
    const modifiedExercise: ProgramExercise = {
      ...mockExercise,
      targetWeight: 130, // modified after proposal was accepted (expected 125)
      targetSets: 4,
    }

    // Should throw conflict error without force
    expect(() =>
      revertAdaptiveProposal(
        accepted,
        { updateExerciseInDay },
        { currentExercise: modifiedExercise, force: false }
      )
    ).toThrowError(/Conflict detected: Exercise was modified after proposal acceptance/)

    // With force: true, reversion succeeds
    updateExerciseInDay.mockClear()
    const forceReverted = revertAdaptiveProposal(
      accepted,
      { updateExerciseInDay },
      { currentExercise: modifiedExercise, force: true }
    )
    expect(forceReverted.status).toBe("reverted")
    expect(updateExerciseInDay).toHaveBeenCalledWith(
      "prog-test",
      "day-leg",
      "ex-101",
      expect.objectContaining({ targetWeight: 120 })
    )
  })

  it("Scenario 6: prevents applying or reverting the same proposal twice", () => {
    const proposal = createAdaptiveProposal({
      userId: "user-1",
      program: mockProgram,
      day: mockDay,
      exercise: mockExercise,
      type: "load_increase",
      proposedWeightKg: 125,
      rationale: "Overload",
      evidence: [],
    })

    const updateExerciseInDay = vi.fn()
    const accepted = applyAdaptiveProposal(proposal, { updateExerciseInDay })

    // Second apply must fail
    expect(() => applyAdaptiveProposal(accepted, { updateExerciseInDay })).toThrowError(
      /Cannot apply proposal in status: accepted/
    )

    const reverted = revertAdaptiveProposal(accepted, { updateExerciseInDay })
    expect(reverted.status).toBe("reverted")

    // Second revert must fail
    expect(() => revertAdaptiveProposal(reverted, { updateExerciseInDay })).toThrowError(
      /Can only revert accepted proposals. Current status: reverted/
    )
  })
})
