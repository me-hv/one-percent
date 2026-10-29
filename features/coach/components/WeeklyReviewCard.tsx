"use client"

import {
  Calendar,
  Trophy,
  Activity,
  Heart,
  Apple,
  TrendingUp,
  TrendingDown,
  Compass,
  CheckCircle2,
} from "lucide-react"
import type { WeeklyCoachingReview } from "../types/coach.types"
import { cn } from "@/lib/utils/cn"

interface WeeklyReviewCardProps {
  review: WeeklyCoachingReview
}

export function WeeklyReviewCard({ review }: WeeklyReviewCardProps) {
  const isVolumePositive = review.volumeChangePct >= 0

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
              Weekly Debrief
            </span>
            <span className="text-xs text-text-placeholder font-mono">
              {review.weekStartDate} → {review.weekEndDate}
            </span>
          </div>
          <h3 className="text-lg font-bold text-primary">Performance & Adaptation Audit</h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-mono font-medium border",
              review.adherenceRatePct >= 80
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            )}
          >
            {review.adherenceRatePct}% Program Adherence
          </span>
        </div>
      </div>

      {/* Grid of 4 Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Sessions */}
        <div className="rounded-lg border border-border-subtle bg-bg-base/70 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-placeholder">
            <span className="text-[10px] font-mono uppercase tracking-wider">Sessions</span>
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <div className="text-lg font-bold font-mono text-primary">
            {review.completedSessions} <span className="text-xs text-text-placeholder font-normal">/ {review.plannedSessions}</span>
          </div>
          <p className="text-[11px] text-text-secondary">Planned frequency</p>
        </div>

        {/* Volume & Trajectory */}
        <div className="rounded-lg border border-border-subtle bg-bg-base/70 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-placeholder">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Volume</span>
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div className="text-lg font-bold font-mono text-primary flex items-baseline gap-1.5">
            <span>{(review.totalVolumeKg / 1000).toFixed(1)}k kg</span>
            <span
              className={cn(
                "text-xs font-mono inline-flex items-center",
                isVolumePositive ? "text-emerald-400" : "text-amber-400"
              )}
            >
              {isVolumePositive ? (
                <TrendingUp className="h-3 w-3 mr-0.5 inline" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-0.5 inline" />
              )}
              {Math.abs(review.volumeChangePct)}%
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">Vs prior week</p>
        </div>

        {/* Recovery Score */}
        <div className="rounded-lg border border-border-subtle bg-bg-base/70 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-placeholder">
            <span className="text-[10px] font-mono uppercase tracking-wider">Avg Readiness</span>
            <Heart className="h-3.5 w-3.5" />
          </div>
          <div className="text-lg font-bold font-mono text-primary">
            {review.recoverySummary.averageReadiness}
            <span className="text-xs text-text-placeholder font-normal">/100</span>
          </div>
          <p className="text-[11px] text-text-secondary">
            {review.recoverySummary.averageSleepHours > 0
              ? `${review.recoverySummary.averageSleepHours.toFixed(1)}h avg sleep`
              : "No sleep logs"}
          </p>
        </div>

        {/* Nutrition Consistency */}
        <div className="rounded-lg border border-border-subtle bg-bg-base/70 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-placeholder">
            <span className="text-[10px] font-mono uppercase tracking-wider">Protein Hit</span>
            <Apple className="h-3.5 w-3.5" />
          </div>
          <div className="text-lg font-bold font-mono text-primary">
            {review.nutritionSummary.proteinAdherencePct}%
          </div>
          <p className="text-[11px] text-text-secondary">
            {review.nutritionSummary.calorieAdherencePct}% calorie adherence
          </p>
        </div>
      </div>

      {/* Top Achievements & Highlights */}
      {review.topAchievements.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-mono tracking-widest text-text-placeholder uppercase flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-accent" />
            <span>Top Achievements</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {review.topAchievements.map((ach, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border-subtle bg-bg-base/50 text-xs text-primary font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                <span>{ach}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      {review.keyInsights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-mono tracking-widest text-text-placeholder uppercase">
            Data Insights & Trends
          </h4>
          <ul className="space-y-2">
            {review.keyInsights.map((insight, idx) => (
              <li
                key={idx}
                className="text-xs text-text-secondary bg-bg-base/40 p-3 rounded-lg border border-border-subtle/50 leading-relaxed"
              >
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Week Focus Areas */}
      {review.focusAreasNextWeek.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <h4 className="text-xs font-mono tracking-widest text-accent uppercase flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5" />
            <span>Prescribed Focus for Next Week</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {review.focusAreasNextWeek.map((focus, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-lg border border-accent/30 bg-accent/10 text-primary text-xs font-medium"
              >
                {focus}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
