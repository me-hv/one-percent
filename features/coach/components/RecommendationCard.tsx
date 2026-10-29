"use client"

import { useState } from "react"
import {
  TrendingUp,
  Heart,
  Flame,
  Apple,
  Target,
  Calendar,
  AlertCircle,
  HelpCircle,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  ShieldAlert,
} from "lucide-react"
import type { CoachingRecommendation, RecommendationAction } from "../types/coach.types"
import { EvidenceModal } from "./EvidenceModal"
import { cn } from "@/lib/utils/cn"

interface RecommendationCardProps {
  recommendation: CoachingRecommendation
  onDismiss?: (id: string) => void
  onComplete?: (id: string) => void
  onFeedback?: (id: string, feedback: "helpful" | "not_helpful" | "inaccurate") => void
  onActionClick?: (action: RecommendationAction) => void
}

const DEFAULT_CAT = {
  label: "Progression",
  icon: TrendingUp,
  badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: typeof TrendingUp; badgeClass: string }
> = {
  progression: {
    label: "Progression",
    icon: TrendingUp,
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  recovery: {
    label: "Recovery",
    icon: Heart,
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  consistency: {
    label: "Consistency",
    icon: Flame,
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  nutrition: {
    label: "Nutrition",
    icon: Apple,
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  goal_alignment: {
    label: "Goal Alignment",
    icon: Target,
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  },
  program_adherence: {
    label: "Program",
    icon: Calendar,
    badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  },
  data_quality: {
    label: "Data Quality",
    icon: AlertCircle,
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
}

const PRIORITY_BADGES: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  low: "bg-slate-500/15 text-slate-300 border-slate-500/30",
}

const CONFIDENCE_BADGES: Record<string, string> = {
  high: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-slate-400 bg-slate-500/10 border-slate-500/20",
}

export function RecommendationCard({
  recommendation,
  onDismiss,
  onComplete,
  onFeedback,
  onActionClick,
}: RecommendationCardProps) {
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false)

  const cat = CATEGORY_CONFIG[recommendation.category] ?? DEFAULT_CAT
  const CategoryIcon = cat.icon
  const isCompleted = recommendation.status === "completed"

  return (
    <>
      <div
        className={cn(
          "rounded-xl border bg-bg-surface p-5 space-y-4 transition-all relative shadow-sm",
          isCompleted
            ? "border-accent/40 bg-accent/5 opacity-80"
            : "border-border-subtle hover:border-accent/30"
        )}
      >
        {/* Top Bar: Category, Priority, Confidence & Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border",
                cat.badgeClass
              )}
            >
              <CategoryIcon className="h-3.5 w-3.5" />
              {cat.label}
            </span>

            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border",
                PRIORITY_BADGES[recommendation.priority] || PRIORITY_BADGES.medium
              )}
            >
              {recommendation.priority}
            </span>

            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono tracking-wider capitalize border",
                CONFIDENCE_BADGES[recommendation.confidence]
              )}
            >
              {recommendation.confidence} Confidence
            </span>
          </div>

          {/* Quick controls: Mark Complete & Dismiss */}
          <div className="flex items-center gap-1">
            {onComplete && !isCompleted && (
              <button
                onClick={() => onComplete(recommendation.id)}
                title="Mark Completed"
                aria-label="Mark completed"
                className="p-1.5 rounded-lg text-text-placeholder hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(recommendation.id)}
                title="Dismiss"
                aria-label="Dismiss recommendation"
                className="p-1.5 rounded-lg text-text-placeholder hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h4 className="text-base font-semibold text-primary">{recommendation.title}</h4>
          <p className="text-sm font-medium text-primary/95 leading-relaxed bg-bg-base/60 p-3 rounded-lg border border-border-subtle/50">
            {recommendation.recommendation}
          </p>
          <p className="text-xs text-text-secondary leading-relaxed pt-1">
            {recommendation.rationale}
          </p>
        </div>

        {/* Missing Data Warning if applicable */}
        {recommendation.missingDataNotice && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-300/90">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{recommendation.missingDataNotice}</span>
          </div>
        )}

        {/* Footer: Evidence trigger, Action, and Feedback */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle">
          {/* Evidence pill */}
          <button
            type="button"
            onClick={() => setIsEvidenceOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-mono transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Why am I seeing this?</span>
            <span className="text-text-placeholder">({recommendation.evidence.length} signals)</span>
          </button>

          {/* Action Button & Feedback */}
          <div className="flex items-center gap-3">
            {/* Feedback buttons */}
            {onFeedback && (
              <div className="flex items-center gap-1 text-text-placeholder">
                <button
                  type="button"
                  onClick={() => onFeedback(recommendation.id, "helpful")}
                  aria-label="Helpful"
                  className={cn(
                    "p-1 rounded hover:text-accent transition-colors",
                    recommendation.userFeedback === "helpful" && "text-accent bg-accent/10"
                  )}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(recommendation.id, "not_helpful")}
                  aria-label="Not helpful"
                  className={cn(
                    "p-1 rounded hover:text-red-400 transition-colors",
                    recommendation.userFeedback === "not_helpful" && "text-red-400 bg-red-500/10"
                  )}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Action button */}
            {recommendation.action && onActionClick && (
              <button
                type="button"
                onClick={() => onActionClick(recommendation.action!)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-base font-medium text-xs hover:bg-accent/90 transition-colors shadow-sm"
              >
                <span>{recommendation.action.label}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Verifiable Evidence Modal */}
      <EvidenceModal
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        title={recommendation.title}
        evidence={recommendation.evidence}
        dataCompletenessPct={recommendation.dataCompletenessPct}
      />
    </>
  )
}
