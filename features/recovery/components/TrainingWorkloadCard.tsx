"use client"

import { useMemo } from "react"
import { Dumbbell, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Info } from "lucide-react"
import type { TrainingLoadSummary } from "@/lib/types/recovery.types"
import { cn } from "@/lib/utils/cn"

interface TrainingWorkloadCardProps {
  summary: TrainingLoadSummary
}

export function TrainingWorkloadCard({ summary }: TrainingWorkloadCardProps) {
  const {
    workoutsCount7d,
    workoutsCount28d,
    totalVolume7d,
    totalVolumePrev7d,
    volumeChangePct,
    avgWeeklyVolume4w,
    acwr,
    acwrStatus,
    accumulatedFatigueIndicator,
    accumulatedFatigueReason,
  } = summary

  const fatigueBadge = useMemo(() => {
    switch (accumulatedFatigueIndicator) {
      case "high":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30"
      case "elevated":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "moderate":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    }
  }, [accumulatedFatigueIndicator])

  const acwrBadge = useMemo(() => {
    switch (acwrStatus) {
      case "optimal":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "overreaching":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "caution":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30"
      default:
        return "bg-bg-elevated text-text-placeholder"
    }
  }, [acwrStatus])

  return (
    <div className="card p-5 border border-border-default bg-bg-surface space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-accent" />
          <h4 className="text-sm font-bold text-primary">Training Load & Workload Ratio</h4>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-text-placeholder text-[10px] uppercase">Accumulated Strain:</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
              fatigueBadge
            )}
          >
            {accumulatedFatigueIndicator}
          </span>
        </div>
      </div>

      {/* Grid of Workload Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
        {/* Acute Volume (7d) */}
        <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/30 space-y-1">
          <span className="text-[10px] uppercase text-text-placeholder block">
            Acute Volume (7d)
          </span>
          <span className="text-base font-bold text-accent block">
            {totalVolume7d.toLocaleString()} <span className="text-[10px]">kg</span>
          </span>
          <span className="text-[10px] text-text-muted block">
            {workoutsCount7d} sessions completed
          </span>
        </div>

        {/* Previous 7d Volume */}
        <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/30 space-y-1">
          <span className="text-[10px] uppercase text-text-placeholder block">
            Prior Week (7–14d)
          </span>
          <span className="text-base font-bold text-primary block">
            {totalVolumePrev7d.toLocaleString()} <span className="text-[10px]">kg</span>
          </span>
          <div className="flex items-center gap-1 text-[10px]">
            {volumeChangePct != null ? (
              volumeChangePct >= 0 ? (
                <span className="text-emerald-400 flex items-center font-bold">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> +{volumeChangePct}%
                </span>
              ) : (
                <span className="text-rose-400 flex items-center font-bold">
                  <TrendingDown className="h-3 w-3 mr-0.5" /> {volumeChangePct}%
                </span>
              )
            ) : (
              <span className="text-text-placeholder">Baseline week</span>
            )}
          </div>
        </div>

        {/* Chronic 4w Baseline */}
        <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/30 space-y-1">
          <span className="text-[10px] uppercase text-text-placeholder block">
            Chronic 4-Week Avg
          </span>
          <span className="text-base font-bold text-primary block">
            {avgWeeklyVolume4w.toLocaleString()} <span className="text-[10px]">kg/wk</span>
          </span>
          <span className="text-[10px] text-text-muted block">
            {workoutsCount28d} sessions in 28d
          </span>
        </div>

        {/* ACWR Ratio */}
        <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/30 space-y-1">
          <span className="text-[10px] uppercase text-text-placeholder block">
            Workload Ratio (ACWR)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-accent block">
              {acwr != null ? `${acwr}x` : "N/A"}
            </span>
            {acwrStatus && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border",
                  acwrBadge
                )}
              >
                {acwrStatus}
              </span>
            )}
          </div>
          <span className="text-[10px] text-text-placeholder block">
            Target window: 0.80–1.30x
          </span>
        </div>
      </div>

      {/* Explanatory Context & Limitation */}
      <div className="space-y-1.5 p-3 rounded-lg border border-border-subtle bg-bg-base/20 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          <span>Workload Context: {accumulatedFatigueReason}</span>
        </div>
        <p className="text-[10px] text-text-placeholder font-sans leading-relaxed">
          The Acute:Chronic Workload Ratio (ACWR) measures acute 7-day load against your 28-day chronic
          baseline to describe volume progression. It is not an injury predictor and should be viewed in
          conjunction with reported soreness and sleep.
        </p>
      </div>
    </div>
  )
}
