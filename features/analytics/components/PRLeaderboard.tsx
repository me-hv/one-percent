"use client"

import { useMemo, useState } from "react"
import { Trophy, Flame, Dumbbell, Search, ChevronRight } from "lucide-react"
import { getPRLeaderboard, getRecentPRs } from "@/features/training/services/pr.service"
import type { WorkoutSession } from "@/lib/types/training.types"
import { cn } from "@/lib/utils/cn"

interface PRLeaderboardProps {
  sessions: WorkoutSession[]
}

export function PRLeaderboard({ sessions }: PRLeaderboardProps) {
  const [search, setSearch] = useState("")

  const leaderboard = useMemo(() => {
    return getPRLeaderboard(sessions)
  }, [sessions])

  const filteredLeaderboard = useMemo(() => {
    if (!search.trim()) return leaderboard
    const q = search.toLowerCase()
    return leaderboard.filter(
      (b) =>
        b.exerciseName.toLowerCase().includes(q) ||
        b.muscleGroup.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    )
  }, [leaderboard, search])

  const recentPRs = useMemo(() => {
    return getRecentPRs(sessions, 5)
  }, [sessions])

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-placeholder" />
          <input
            type="text"
            placeholder="Search exercises for personal records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded border border-border-default bg-bg-surface text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none"
          />
        </div>
      </div>

      {/* Leaderboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLeaderboard.map((item, idx) => (
          <div
            key={item.exerciseId}
            className="card p-4 space-y-3 border border-border-subtle hover:border-accent-gold/40 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs border",
                    idx === 0
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                      : idx === 1
                      ? "bg-slate-300/15 border-slate-300/30 text-slate-300"
                      : idx === 2
                      ? "bg-amber-700/15 border-amber-700/30 text-amber-600"
                      : "bg-bg-elevated border-border-subtle text-text-muted"
                  )}
                >
                  #{idx + 1}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary">{item.exerciseName}</h4>
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider capitalize">
                    {item.muscleGroup} · {item.category}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-mono text-text-placeholder uppercase block">Est 1RM</span>
                <span className="text-base font-bold font-mono text-accent-gold">{item.estimated1RM} kg</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle/50 text-center font-mono">
              <div className="space-y-0.5">
                <span className="text-[9px] text-text-placeholder uppercase block">Max Weight</span>
                <span className="text-xs font-bold text-primary">{item.maxWeightKg} kg</span>
              </div>
              <div className="space-y-0.5 border-x border-border-subtle/50">
                <span className="text-[9px] text-text-placeholder uppercase block">Max Reps</span>
                <span className="text-xs font-bold text-primary">{item.maxReps}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-text-placeholder uppercase block">Max Set Vol</span>
                <span className="text-xs font-bold text-accent">{item.maxSetVolumeKg} kg</span>
              </div>
            </div>
          </div>
        ))}

        {filteredLeaderboard.length === 0 && (
          <div className="col-span-full card p-8 text-center text-xs text-text-placeholder">
            No personal records found for "{search}". Complete workouts to log new records.
          </div>
        )}
      </div>

      {/* Recent Milestones feed */}
      {recentPRs.length > 0 && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
            <Trophy className="h-4 w-4 text-accent-gold" />
            <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">
              Recently Broken Milestones
            </span>
          </div>

          <div className="space-y-2">
            {recentPRs.map((pr) => (
              <div key={pr.id} className="p-3 rounded-lg border border-border-subtle bg-bg-base/30 flex items-center justify-between text-xs font-mono">
                <div className="space-y-0.5">
                  <span className="font-semibold text-primary block">{pr.exerciseName}</span>
                  <span className="text-[10px] text-text-placeholder">
                    {pr.type === "1rm" ? "Estimated 1RM" : pr.type === "max_weight" ? "Max Weight Lifted" : "Set Volume PR"} · {pr.date}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-bold text-accent-gold text-sm block">
                    {pr.value} {pr.unit}
                  </span>
                  {pr.previousValue && (
                    <span className="text-[9px] text-text-placeholder">
                      Was {pr.previousValue} {pr.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
