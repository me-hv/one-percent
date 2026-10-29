"use client"

import { useMemo } from "react"
import { Sparkles, CheckCircle2, AlertTriangle, Info, Clock } from "lucide-react"
import type { RecoveryInsight } from "@/lib/types/recovery.types"
import { cn } from "@/lib/utils/cn"

interface RecoveryInsightsListProps {
  insights: RecoveryInsight[]
}

export function RecoveryInsightsList({ insights }: RecoveryInsightsListProps) {
  if (insights.length === 0) {
    return null
  }

  return (
    <div className="card p-5 border border-border-default bg-bg-surface space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h4 className="text-sm font-bold text-primary">Deterministic Recovery Insights</h4>
        </div>
        <span className="text-[10px] text-text-placeholder font-mono">
          Derived purely from your logged history
        </span>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const isCaution = insight.level === "caution"
          const isPositive = insight.level === "positive"

          const icon = isCaution ? (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : isPositive ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="h-4 w-4 text-text-placeholder shrink-0" />
          )

          const containerClass = isCaution
            ? "border-rose-500/30 bg-rose-500/5"
            : isPositive
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-border-subtle bg-bg-base/30"

          return (
            <div
              key={insight.id}
              className={cn("p-3.5 rounded-lg border flex items-start gap-3", containerClass)}
            >
              <div className="mt-0.5">{icon}</div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs font-bold text-primary">{insight.title}</h5>
                  <span className="text-[10px] font-mono text-text-placeholder flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {insight.observationPeriod}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  {insight.message}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
