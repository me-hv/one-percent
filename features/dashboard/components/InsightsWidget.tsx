"use client"

import { useMemo } from "react"
import { Sparkles, Trophy, ArrowRight, Zap, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ROUTES } from "@/lib/constants/ROUTES"
import { useAuthStore } from "@/lib/store/auth.store"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { useBodyStore } from "@/features/body/store/body.store"
import { generateSmartInsights } from "@/features/analytics/services/insights.service"
import { getRecentPRs } from "@/features/training/services/pr.service"
import { cn } from "@/lib/utils/cn"

export function InsightsWidget() {
  const { user } = useAuthStore()
  const { data: dbHistory } = useWorkoutHistory(user?.uid ?? "")
  const { weightLogs, measurements, habitLogs } = useBodyStore()

  const history = useMemo(() => dbHistory || [], [dbHistory])

  // Generate live smart insights
  const insights = useMemo(() => {
    return generateSmartInsights(history, weightLogs, measurements, habitLogs).slice(0, 3)
  }, [history, weightLogs, measurements, habitLogs])

  // Get recently broken PRs
  const recentPRs = useMemo(() => {
    return getRecentPRs(history, 3)
  }, [history])

  return (
    <div className="card p-5 space-y-4 flex flex-col justify-between">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="card-label">Progress Intelligence</span>
        </div>
        <Link
          href={ROUTES.analytics.root}
          className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Smart Insights items */}
      <div className="space-y-2.5">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              "p-3 rounded-lg border text-xs space-y-1 transition-colors",
              insight.impact === "positive"
                ? "bg-accent/10 border-accent/25 text-primary"
                : insight.impact === "warning"
                ? "bg-warning/10 border-warning/25 text-primary"
                : "bg-bg-base/40 border-border-subtle text-primary"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs flex items-center gap-1.5">
                {insight.impact === "positive" ? (
                  <TrendingUp className="h-3.5 w-3.5 text-accent" />
                ) : insight.impact === "warning" ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-text-placeholder" />
                )}
                {insight.title}
              </span>
              {insight.metricValue && (
                <span className="font-mono font-bold text-[10px] text-accent px-1.5 py-0.5 rounded bg-accent/15 border border-accent/20">
                  {insight.metricValue}
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">{insight.description}</p>
          </div>
        ))}
      </div>

      {/* Recent PRs ticker */}
      {recentPRs.length > 0 && (
        <div className="pt-2 border-t border-border-subtle/60 space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">
            Recently Broken PRs
          </span>
          <div className="space-y-1.5">
            {recentPRs.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-accent-gold" />
                  {pr.exerciseName}
                </span>
                <span className="font-bold text-accent-gold">
                  {pr.value} {pr.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
