import { useCallback } from "react"
import { useCoachStore } from "../store/coach.store"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { coachRepository } from "../repositories/coach.repository"
import {
  applyAdaptiveProposal,
  revertAdaptiveProposal,
  createAdaptiveProposal,
  type CreateProposalParams,
} from "../services/adaptive-programming.service"
import type { AdaptiveProposal } from "../types/coach.types"
import { toast } from "sonner"

export function useAdaptiveProgramming(userId: string) {
  const { proposals, addProposal, updateProposalStatus } = useCoachStore()
  const { updateExerciseInDay, replaceExerciseInDay } = useProgramsStore()

  /**
   * Generates a new adaptive proposal and stores it in the coach store
   */
  const proposeAdjustment = useCallback(
    (params: CreateProposalParams): AdaptiveProposal => {
      const proposal = createAdaptiveProposal(params)
      addProposal(proposal)
      if (userId) {
        coachRepository.saveProposal(userId, proposal).catch((e) => {
          console.warn("[AdaptiveProgramming] Failed to sync proposal to Firestore:", e)
        })
      }
      return proposal
    },
    [userId, addProposal]
  )

  /**
   * Accepts and applies a proposal directly to the athlete's active program
   */
  const acceptProposal = useCallback(
    async (proposal: AdaptiveProposal) => {
      try {
        const updated = applyAdaptiveProposal(proposal, {
          updateExerciseInDay,
          replaceExerciseInDay,
        })

        updateProposalStatus(proposal.id, "accepted")

        if (userId) {
          await coachRepository.saveProposal(userId, updated)
        }

        toast.success(`Program updated: ${updated.exerciseName}`, {
          description: updated.proposedPlanSummary,
        })
      } catch (err: any) {
        console.error("[AdaptiveProgramming] Error accepting proposal:", err)
        toast.error("Failed to apply program adjustment")
      }
    },
    [userId, updateExerciseInDay, replaceExerciseInDay, updateProposalStatus]
  )

  /**
   * Rejects a proposal without modifying the program
   */
  const rejectProposal = useCallback(
    async (proposalId: string) => {
      updateProposalStatus(proposalId, "rejected")
      if (userId) {
        const p = proposals.find((item) => item.id === proposalId)
        if (p) {
          coachRepository.saveProposal(userId, { ...p, status: "rejected" }).catch((e) => {
            console.warn("[AdaptiveProgramming] Failed to sync rejection:", e)
          })
        }
      }
      toast.info("Adjustment declined. Active program unchanged.")
    },
    [userId, proposals, updateProposalStatus]
  )

  /**
   * Reverts a previously accepted proposal back to its original state
   */
  const revertProposal = useCallback(
    async (proposal: AdaptiveProposal) => {
      try {
        const reverted = revertAdaptiveProposal(proposal, {
          updateExerciseInDay,
        })

        updateProposalStatus(proposal.id, "reverted")

        if (userId) {
          await coachRepository.saveProposal(userId, reverted)
        }

        toast.success(`Reverted adjustment for ${reverted.exerciseName}`, {
          description: "Original target load restored.",
        })
      } catch (err: any) {
        console.error("[AdaptiveProgramming] Error reverting proposal:", err)
        toast.error("Failed to revert adjustment")
      }
    },
    [userId, updateExerciseInDay, updateProposalStatus]
  )

  return {
    proposals,
    proposeAdjustment,
    acceptProposal,
    rejectProposal,
    revertProposal,
  }
}
