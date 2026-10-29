"use client"

import { useMemo } from "react"
import { Activity, Dumbbell, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react"
import type { MuscleRecoveryStatus } from "@/lib/types/recovery.types"
import { WELLNESS_SCALE_LABELS } from "@/lib/types/recovery.types"
import { cn } from "@/lib/utils/cn"

interface MuscleRecoveryMapCardProps {
  muscleStatuses: MuscleRecoveryStatus[]
}

const MUSCLE_DISPLAY_NAMES: Record<string, string> = {
  chest: "Chest",
  back: "Back / Lats",
  shoulders: "Shoulders",
  quads: "Quadriceps",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  biceps: "Biceps",
  triceps: "Triceps",
  calves: "Calves",
  core: "Core / Abs",
}

export function MuscleRecoveryMapCard({ muscleStatuses }: MuscleRecoveryMapCardProps) {
  return (
    <div className="card p-5 border border-border-default bg-bg-surface space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <div>
            <h4 className="text-sm font-bold text-primary">Muscle Recovery & Soreness Status</h4>
            <span className="text-[10px] text-text-placeholder font-mono">
              Correlating recent workout exposure with reported DOMS
            </span>
          </div>
        </div>

        <span className="text-[10px] text-text-placeholder font-mono hidden sm:inline">
          Estimates for planning (Not medical advice)
        </span>
      </div>

      {/* Grid of Muscle Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
        {muscleStatuses.map((m) => {
          const isStrained = m.recoveryEstimate === "strained"
          const isFresh = m.recoveryEstimate === "fresh"
          const isRecovering = m.recoveryEstimate === "recovering"

          const badgeClass = isStrained
            ? "border-rose-500/40 bg-rose-500/15 text-rose-400"
            : isFresh
            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
            : isRecovering
            ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-400"
            : "border-border-subtle bg-bg-base/40 text-text-placeholder"

          return (
            <div
              key={m.muscle}
              className={cn(
                "p-3 rounded-lg border flex flex-col justify-between space-y-2 transition-all",
                isStrained
                  ? "border-rose-500/30 bg-rose-500/5"
                  : isFresh
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border-subtle bg-bg-base/20 hover:border-border-default"
              )}
            >
              <div className="flex items-start justify-between gap-1.5">
                <span className="font-sans font-bold text-primary text-xs">
                  {MUSCLE_DISPLAY_NAMES[m.muscle] || m.muscle}
                </span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border shrink-0",
                    badgeClass
                  )}
                >
                  {m.recoveryEstimate}
                </span>
              </div>

              {/* Training stats */}
              <div className="space-y-1 text-[11px] border-t border-border-subtle/50 pt-2">
                <div className="flex justify-between text-text-muted">
                  <span>Last trained:</span>
                  <span className="text-primary font-bold">
                    {m.daysSinceTrained != null
                      ? m.daysSinceTrained === 0
                        ? "Today"
                        : `${m.daysSinceTrained}d ago`
                      : "None recorded"}
                  </span>
                </div>

                <div className="flex justify-between text-text-muted">
                  <span>7d volume:</span>
                  <span className="text-accent font-bold">
                    {m.totalVolume7d > 0 ? `${m.totalVolume7d.toLocaleString()}kg` : "0kg"}
                  </span>
                </div>

                <div className="flex justify-between text-text-muted">
                  <span>Soreness:</span>
                  <span
                    className={cn(
                      "font-bold",
                      m.currentSoreness >= 3
                        ? "text-rose-400"
                        : m.currentSoreness > 0
                        ? "text-amber-400"
                        : "text-text-placeholder"
                    )}
                  >
                    {m.currentSoreness}/5 ({WELLNESS_SCALE_LABELS.soreness[m.currentSoreness]})
                  </span>
                </div>
              </div>

              {/* Practical note */}
              <p className="text-[10px] text-text-placeholder font-sans leading-tight border-t border-border-subtle/40 pt-1.5">
                {m.notes}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
