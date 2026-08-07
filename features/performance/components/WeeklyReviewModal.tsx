"use client"

import { useMemo } from "react"
import { Calendar, TrendingUp, ShieldCheck, Dumbbell, AlertTriangle, CheckCircle2, X } from "lucide-react"
import { generateWeeklyReview, type WeeklyReviewReport } from "@/features/performance/services/review.service"
import type { WorkoutSession } from "@/lib/types/training.types"
import type { WeightLog } from "@/lib/types/body.types"
import type { RecoveryScore } from "@/lib/types/recovery.types"
import type { Goal } from "@/lib/types/goals.types"
import { cn } from "@/lib/utils/cn"

interface WeeklyReviewModalProps {
  isOpen: boolean
  onClose: () => void
  sessions?: WorkoutSession[]
  weightLogs?: WeightLog[]
  recoveryScores?: RecoveryScore[]
  goals?: Goal[]
}

export function WeeklyReviewModal({
  isOpen,
  onClose,
  sessions = [],
  weightLogs = [],
  recoveryScores = [],
  goals = [],
}: WeeklyReviewModalProps) {
  const review: WeeklyReviewReport = useMemo(() => {
    return generateWeeklyReview(sessions, weightLogs, recoveryScores, goals)
  }, [sessions, weightLogs, recoveryScores, goals])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl card p-6 space-y-5 border border-accent/40 bg-bg-surface shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-accent/15 text-accent border border-accent/25">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary">Sunday Weekly Review Report</h3>
              <span className="text-[10px] font-mono text-text-placeholder">{review.weekLabel}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Score Banner */}
        <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">Weekly Performance Score</span>
            <span className="text-3xl font-extrabold font-mono text-primary">{review.overallScore} <span className="text-xs text-text-placeholder">/ 100</span></span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold font-mono text-accent uppercase tracking-wider block">Consistency: {review.consistencyPct}%</span>
            <span className="text-[10px] font-mono text-text-muted">{review.completedWorkouts} of {review.targetWorkouts} Workouts Completed</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-0.5">
            <span className="text-[9px] text-text-placeholder uppercase block">Volume Delta</span>
            <span className="text-base font-bold text-accent">{review.volumeChangePct >= 0 ? "+" : ""}{review.volumeChangePct}%</span>
          </div>

          <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-0.5">
            <span className="text-[9px] text-text-placeholder uppercase block">Bodyweight</span>
            <span className="text-base font-bold text-primary">{review.bodyweightChangeKg >= 0 ? "+" : ""}{review.bodyweightChangeKg} kg</span>
          </div>

          <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-0.5">
            <span className="text-[9px] text-text-placeholder uppercase block">Recovery Status</span>
            <span className="text-base font-bold text-accent">{review.recoveryStatus}</span>
          </div>
        </div>

        {/* Key Lift Progression */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider block">Key Lift Progress</span>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            {review.keyLiftProgress.map((lift) => (
              <div key={lift.exerciseName} className="p-2.5 rounded border border-border-subtle bg-bg-base/30 flex justify-between items-center">
                <span className="text-text-secondary truncate">{lift.exerciseName}</span>
                <span className="font-bold text-accent">+{lift.deltaKg}kg</span>
              </div>
            ))}
          </div>
        </div>

        {/* Missed Workouts Alert */}
        {review.missedWorkouts.length > 0 ? (
          <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 text-xs text-warning flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Missed Sessions: <strong>{review.missedWorkouts.join(", ")}</strong></span>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-accent/20 bg-accent/5 text-xs text-accent flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>100% Target Execution — Zero missed workouts this week!</span>
          </div>
        )}

        {/* Summary Notes */}
        <p className="text-xs text-text-secondary leading-relaxed bg-bg-base/50 p-3 rounded border border-border-subtle">
          {review.summaryText}
        </p>

        {/* Modal Action */}
        <div className="pt-2 border-t border-border-subtle flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded bg-accent text-bg-base font-bold text-xs hover:bg-accent-hover transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  )
}
