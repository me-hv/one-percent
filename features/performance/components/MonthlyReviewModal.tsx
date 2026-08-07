"use client"

import { useMemo } from "react"
import { Trophy, TrendingUp, Calendar, Zap, X } from "lucide-react"
import { generateMonthlyReview, type MonthlyReviewReport } from "@/features/performance/services/review.service"
import type { WorkoutSession } from "@/lib/types/training.types"
import type { WeightLog } from "@/lib/types/body.types"
import type { Goal } from "@/lib/types/goals.types"

interface MonthlyReviewModalProps {
  isOpen: boolean
  onClose: () => void
  sessions?: WorkoutSession[]
  weightLogs?: WeightLog[]
  goals?: Goal[]
}

export function MonthlyReviewModal({
  isOpen,
  onClose,
  sessions = [],
  weightLogs = [],
  goals = [],
}: MonthlyReviewModalProps) {
  const review: MonthlyReviewReport = useMemo(() => {
    return generateMonthlyReview(sessions, weightLogs, goals)
  }, [sessions, weightLogs, goals])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl card p-6 space-y-5 border border-accent-gold/40 bg-bg-surface shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary">Monthly Performance Review</h3>
              <span className="text-[10px] font-mono text-text-placeholder">{review.monthLabel}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Highlight Banner */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">Monthly Rating</span>
            <span className="text-3xl font-extrabold font-mono text-amber-400">{review.overallScore} <span className="text-xs text-text-placeholder">/ 100</span></span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold font-mono text-amber-400 uppercase tracking-wider block">Biggest Lift Gain</span>
            <span className="text-sm font-bold text-primary font-mono">{review.biggestImprovement}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-1">
            <span className="text-[9px] text-text-placeholder uppercase block">Most Improved Exercise</span>
            <span className="font-bold text-primary block">{review.mostImprovedExercise}</span>
          </div>
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-1">
            <span className="text-[9px] text-text-placeholder uppercase block">Average Volume / Workout</span>
            <span className="font-bold text-accent block">{review.averageVolumeKg.toLocaleString()} kg</span>
          </div>
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-1">
            <span className="text-[9px] text-text-placeholder uppercase block">Longest Workout Streak</span>
            <span className="font-bold text-accent block">{review.longestStreakDays} Days</span>
          </div>
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-1">
            <span className="text-[9px] text-text-placeholder uppercase block">Body Composition</span>
            <span className="font-bold text-primary block">{review.bodyChangesText}</span>
          </div>
        </div>

        {/* Week Comparison */}
        <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/30 space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-text-placeholder">Peak Week:</span>
            <span className="font-bold text-accent">{review.bestWeekLabel}</span>
          </div>
          <div className="flex justify-between border-t border-border-subtle/50 pt-2">
            <span className="text-text-placeholder">Deload / Lowest Week:</span>
            <span className="text-text-muted">{review.worstWeekLabel}</span>
          </div>
        </div>

        {/* Modal Action */}
        <div className="pt-2 border-t border-border-subtle flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded bg-accent text-bg-base font-bold text-xs hover:bg-accent-hover transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  )
}
