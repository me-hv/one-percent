"use client"

import { useState, useMemo } from "react"
import { ShieldCheck, TrendingUp, ChevronRight, Activity, Zap, CheckCircle2, AlertCircle } from "lucide-react"
import { calculatePerformanceScore } from "@/features/performance/services/performance.service"
import type { WorkoutSession } from "@/lib/types/training.types"
import type { Goal } from "@/lib/types/goals.types"
import type { RecoveryScore, ReadinessLog } from "@/lib/types/recovery.types"
import type { Habit, HabitLog } from "@/lib/types/habits.types"
import { cn } from "@/lib/utils/cn"

interface PerformanceScoreWidgetProps {
  sessions?: WorkoutSession[]
  goals?: Goal[]
  recoveryScores?: RecoveryScore[]
  readinessLogs?: ReadinessLog[]
  habits?: Habit[]
  habitLogs?: HabitLog[]
}

export function PerformanceScoreWidget({
  sessions = [],
  goals = [],
  recoveryScores = [],
  readinessLogs = [],
  habits = [],
  habitLogs = [],
}: PerformanceScoreWidgetProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  const perf = useMemo(() => {
    return calculatePerformanceScore(sessions, goals, recoveryScores, readinessLogs, habits, habitLogs)
  }, [sessions, goals, recoveryScores, readinessLogs, habits, habitLogs])

  return (
    <>
      <div className="card p-5 space-y-4 border border-border-subtle bg-bg-surface hover:border-accent/30 transition-colors">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">
              Performance Score
            </span>
          </div>
          <button
            onClick={() => setShowBreakdown(true)}
            className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1"
          >
            Factor Breakdown <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-mono text-primary">{perf.totalScore}</span>
              <span className="text-xs font-mono text-text-placeholder">/ 100</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-accent font-mono uppercase tracking-wider">
                {perf.levelLabel}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +{perf.weeklyTrendDelta} pts
              </span>
            </div>
          </div>

          {/* Minimalist Gauge Bar */}
          <div className="w-28 space-y-1 text-right">
            <div className="h-3 w-full rounded-full bg-bg-base border border-border-subtle overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent/60 via-accent to-accent-gold transition-all duration-500"
                style={{ width: `${perf.totalScore}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-text-placeholder uppercase block">
              7 Weighted Factors
            </span>
          </div>
        </div>

        {/* Quick factors preview bar */}
        <div className="grid grid-cols-7 gap-1 pt-1">
          {perf.factors.map((f) => (
            <div
              key={f.id}
              title={`${f.name}: ${f.score}/100`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                f.status === "excellent"
                  ? "bg-accent"
                  : f.status === "good"
                  ? "bg-blue-400"
                  : f.status === "fair"
                  ? "bg-amber-400"
                  : "bg-warning"
              )}
            />
          ))}
        </div>
      </div>

      {/* Factor Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg card p-6 space-y-5 border border-accent/30 bg-bg-surface shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <div>
                  <h3 className="text-sm font-bold text-primary">Performance Score Breakdown</h3>
                  <span className="text-[10px] font-mono text-text-placeholder">
                    0-100 Deterministic Calculation Engine
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowBreakdown(false)}
                className="text-xs text-text-placeholder hover:text-primary font-mono px-2 py-1 rounded bg-bg-elevated"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {perf.factors.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{f.name}</span>
                      <span className="text-[10px] font-mono text-text-placeholder">
                        ({Math.round(f.weight * 100)}% Weight)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-accent">{f.score} / 100</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold border",
                          f.status === "excellent"
                            ? "bg-accent/15 border-accent/30 text-accent"
                            : f.status === "good"
                            ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                            : f.status === "fair"
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                            : "bg-red-500/15 border-red-500/30 text-red-400"
                        )}
                      >
                        {f.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary">{f.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border-subtle flex justify-between items-center text-xs font-mono text-text-muted">
              <span>Overall Score: <strong className="text-primary">{perf.totalScore} / 100</strong></span>
              <span className="text-accent">{perf.levelLabel}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
