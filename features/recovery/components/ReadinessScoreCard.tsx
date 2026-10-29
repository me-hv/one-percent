"use client"

import { useMemo } from "react"
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Plus,
  Info,
} from "lucide-react"
import type { ReadinessCalculationResult } from "@/lib/types/recovery.types"
import { cn } from "@/lib/utils/cn"

interface ReadinessScoreCardProps {
  readiness: ReadinessCalculationResult
  onOpenCheckIn: () => void
  hasTodayCheckIn: boolean
}

export function ReadinessScoreCard({
  readiness,
  onOpenCheckIn,
  hasTodayCheckIn,
}: ReadinessScoreCardProps) {
  const { score, category, factors, completenessPct, isSufficientData, summaryMessage } =
    readiness

  // Semantic category colors
  const categoryColor = useMemo(() => {
    if (!isSufficientData || score == null) return "text-text-placeholder border-border-subtle"
    if (score >= 80) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
    if (score >= 60) return "text-amber-400 border-amber-500/40 bg-amber-500/10"
    return "text-rose-400 border-rose-500/40 bg-rose-500/10"
  }, [score, isSufficientData])

  const categoryBadge = useMemo(() => {
    if (!isSufficientData || score == null) return "bg-bg-elevated text-text-placeholder"
    if (score >= 80) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    if (score >= 60) return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    return "bg-rose-500/20 text-rose-400 border-rose-500/30"
  }, [score, isSufficientData])

  return (
    <div className="card p-5 border border-border-default bg-bg-surface space-y-5 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
              Deterministic Readiness Engine
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded border font-mono font-bold bg-bg-base border-border-subtle text-text-placeholder">
              {completenessPct}% Data Completeness
            </span>
          </div>
          <h3 className="text-lg font-bold text-primary mt-1">Daily Training Readiness</h3>
        </div>

        <button
          onClick={onOpenCheckIn}
          className="h-8 px-3 rounded bg-accent text-bg-base font-bold text-xs hover:bg-accent-hover transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          {hasTodayCheckIn ? "Edit Today's Check-In" : "Log Recovery Check-In"}
        </button>
      </div>

      {/* Main Score Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Big Score Display */}
        <div className="md:col-span-5 flex items-center gap-4 p-4 rounded-xl border bg-bg-base/40 border-border-subtle">
          <div
            className={cn(
              "w-20 h-20 rounded-2xl flex flex-col items-center justify-center border font-mono shrink-0",
              categoryColor
            )}
          >
            {score != null ? (
              <>
                <span className="text-3xl font-extrabold leading-none">{score}</span>
                <span className="text-[10px] opacity-75 mt-0.5">/100</span>
              </>
            ) : (
              <span className="text-xs font-bold text-text-placeholder">N/A</span>
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <span
              className={cn(
                "inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase border",
                categoryBadge
              )}
            >
              {category}
            </span>
            <p className="text-xs text-text-secondary leading-snug line-clamp-3">
              {summaryMessage}
            </p>
          </div>
        </div>

        {/* Factors Progress Bars */}
        <div className="md:col-span-7 space-y-2 font-mono text-xs">
          <span className="text-[10px] uppercase text-text-placeholder tracking-wider block mb-1">
            Factor Weights & Breakdown (Normalized to 100%)
          </span>

          <div className="space-y-1.5">
            {factors.map((factor) => {
              const weightPct = Math.round(factor.weight * 100)
              return (
                <div
                  key={factor.factorId}
                  className={cn(
                    "p-2 rounded border flex items-center justify-between gap-3 text-xs",
                    factor.isAvailable
                      ? "border-border-subtle bg-bg-base/20"
                      : "border-dashed border-border-subtle/50 opacity-60 bg-transparent"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {factor.isAvailable ? (
                      factor.score >= 80 ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : factor.score >= 60 ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      )
                    ) : (
                      <HelpCircle className="h-3.5 w-3.5 text-text-placeholder shrink-0" />
                    )}
                    <span className="font-sans font-medium text-primary text-xs truncate">
                      {factor.name}
                    </span>
                    <span className="text-[10px] text-text-placeholder hidden sm:inline">
                      ({factor.description})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    {factor.isAvailable ? (
                      <>
                        <span className="text-[11px] text-text-muted">
                          wt: <strong>{weightPct}%</strong>
                        </span>
                        <span className="font-bold text-accent text-xs">
                          {factor.score}{" "}
                          <span className="text-[9px] text-text-placeholder">pts</span>
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-text-placeholder italic">
                        Not Logged
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Transparent Disclaimer */}
      <div className="p-2.5 rounded border border-border-subtle bg-bg-base/30 text-[11px] text-text-placeholder flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-text-secondary mt-0.5 shrink-0" />
        <span>
          Readiness is a deterministic planning aid derived from self-reported wellness, sleep, and
          optional biometrics. It does not provide medical evaluation, diagnostic claims, or guarantees
          of training safety.
        </span>
      </div>
    </div>
  )
}
