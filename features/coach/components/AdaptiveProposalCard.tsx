"use client"

import { useState } from "react"
import {
  ArrowRight,
  Check,
  X,
  RotateCcw,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sliders,
  Calendar,
  Layers,
} from "lucide-react"
import type { AdaptiveProposal, AdaptiveProposalType } from "../types/coach.types"
import { EvidenceModal } from "./EvidenceModal"
import { cn } from "@/lib/utils/cn"

interface AdaptiveProposalCardProps {
  proposal: AdaptiveProposal
  onAccept?: (proposal: AdaptiveProposal) => void
  onReject?: (proposalId: string) => void
  onRevert?: (proposal: AdaptiveProposal) => void
}

const TYPE_CONFIG: Record<
  AdaptiveProposalType,
  { label: string; icon: typeof TrendingUp; badgeClass: string }
> = {
  load_increase: {
    label: "Load Increase",
    icon: TrendingUp,
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  load_reduction: {
    label: "Load Deload",
    icon: TrendingDown,
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  load_hold: {
    label: "Load Consolidation",
    icon: Sliders,
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  exercise_substitution: {
    label: "Exercise Swap",
    icon: RefreshCw,
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  volume_adjustment: {
    label: "Volume Adjustment",
    icon: Layers,
    badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  },
  schedule_adjustment: {
    label: "Schedule Adjustment",
    icon: Calendar,
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
}

const STATUS_BADGES = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  accepted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  reverted: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
}

export function AdaptiveProposalCard({
  proposal,
  onAccept,
  onReject,
  onRevert,
}: AdaptiveProposalCardProps) {
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const typeConfig = TYPE_CONFIG[proposal.type] || TYPE_CONFIG.load_increase
  const TypeIcon = typeConfig.icon

  const handleAccept = async () => {
    if (!onAccept || isLoading) return
    setIsLoading(true)
    try {
      await onAccept(proposal)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!onReject || isLoading) return
    setIsLoading(true)
    try {
      await onReject(proposal.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevert = async () => {
    if (!onRevert || isLoading) return
    setIsLoading(true)
    try {
      await onRevert(proposal)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-5 space-y-4 hover:border-accent/30 transition-all shadow-sm">
        {/* Header: Type, Status, Target Exercise */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/60 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border",
                typeConfig.badgeClass
              )}
            >
              <TypeIcon className="h-3.5 w-3.5" />
              {typeConfig.label}
            </span>

            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border",
                STATUS_BADGES[proposal.status] || STATUS_BADGES.pending
              )}
            >
              {proposal.status}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-text-placeholder">
              {proposal.programName} • {proposal.dayName}
            </span>
          </div>
        </div>

        {/* Exercise name & Rationale */}
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-primary">{proposal.exerciseName}</h4>
          <p className="text-xs text-text-secondary leading-relaxed">{proposal.rationale}</p>
        </div>

        {/* Side-by-Side Comparison: Current vs Proposed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Current Plan */}
          <div className="rounded-lg border border-border-subtle bg-bg-base/70 p-3.5 space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">
              Current Prescription
            </span>
            <p className="text-xs font-semibold text-primary font-mono">
              {proposal.currentPlanSummary}
            </p>
            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border-subtle/40 text-[11px] text-text-secondary">
              <div>
                <span className="text-text-placeholder block text-[9px] uppercase">Weight</span>
                <span className="font-mono text-primary">
                  {proposal.currentDetails.weightKg != null
                    ? `${proposal.currentDetails.weightKg}kg`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-text-placeholder block text-[9px] uppercase">Sets × Reps</span>
                <span className="font-mono text-primary">
                  {proposal.currentDetails.sets || 3} × {proposal.currentDetails.reps || "8-10"}
                </span>
              </div>
              <div>
                <span className="text-text-placeholder block text-[9px] uppercase">Target RPE</span>
                <span className="font-mono text-primary">
                  {proposal.currentDetails.rpe != null ? `@${proposal.currentDetails.rpe}` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Proposed Adjustment */}
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-3.5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
                Proposed Adjustment
              </span>
              <span className="text-[10px] font-mono text-accent">Requires Approval</span>
            </div>
            <p className="text-xs font-semibold text-primary font-mono">
              {proposal.proposedPlanSummary}
            </p>
            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-accent/20 text-[11px] text-text-secondary">
              <div>
                <span className="text-text-placeholder block text-[9px] uppercase">Weight</span>
                <span className="font-mono text-accent font-semibold">
                  {proposal.proposedDetails.weightKg != null
                    ? `${proposal.proposedDetails.weightKg}kg`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-text-placeholder block text-[9px] uppercase">Sets × Reps</span>
                <span className="font-mono text-accent font-semibold">
                  {proposal.proposedDetails.sets || 3} × {proposal.proposedDetails.reps || "8-10"}
                </span>
              </div>
              <div>
                <span className="text-text-placeholder block text-[9px] uppercase">Target RPE</span>
                <span className="font-mono text-accent font-semibold">
                  {proposal.proposedDetails.rpe != null ? `@${proposal.proposedDetails.rpe}` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Evidence & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => setIsEvidenceOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-mono transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Why this adjustment?</span>
            <span className="text-text-placeholder">({proposal.evidence.length} signals)</span>
          </button>

          {/* Action buttons depending on status */}
          <div className="flex items-center gap-2">
            {proposal.status === "pending" && (
              <>
                {onReject && (
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-base text-text-secondary hover:text-primary text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Decline</span>
                  </button>
                )}
                {onAccept && (
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-bg-base font-medium text-xs hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Accept & Apply</span>
                  </button>
                )}
              </>
            )}

            {proposal.status === "accepted" && onRevert && proposal.previousProgramSnapshot && (
              <button
                type="button"
                onClick={handleRevert}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Revert Adjustment (1-Click Rollback)</span>
              </button>
            )}

            {proposal.status === "rejected" && (
              <span className="text-xs text-text-placeholder italic">
                Declined • Active program preserved
              </span>
            )}

            {proposal.status === "reverted" && (
              <span className="text-xs text-text-placeholder italic">
                Reverted • Original load restored
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Verifiable Evidence Modal */}
      <EvidenceModal
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        title={`Adjustment for ${proposal.exerciseName}`}
        evidence={proposal.evidence}
      />
    </>
  )
}
