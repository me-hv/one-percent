"use client"

import { useState, useMemo } from "react"
import { Shield, Dumbbell, Layers, Scale, Trophy, BookOpen, Flame, Lock, CheckCircle2 } from "lucide-react"
import { evaluateAchievements, type Achievement } from "@/features/achievements/services/achievements.service"
import type { WorkoutSession } from "@/lib/types/training.types"
import type { Goal } from "@/lib/types/goals.types"
import { cn } from "@/lib/utils/cn"

interface AchievementsGridProps {
  sessions?: WorkoutSession[]
  goals?: Goal[]
}

const CATEGORY_TABS = [
  { id: "all", label: "All Milestones" },
  { id: "sessions", label: "Sessions" },
  { id: "sets", label: "Sets" },
  { id: "volume", label: "Volume" },
  { id: "prs", label: "PRs" },
  { id: "programs", label: "Programs" },
  { id: "consistency", label: "Consistency" },
]

export function AchievementsGrid({ sessions = [], goals = [] }: AchievementsGridProps) {
  const [activeCategory, setActiveCategory] = useState("all")

  const achievements = useMemo(() => {
    return evaluateAchievements(sessions, goals)
  }, [sessions, goals])

  const filteredAchievements = useMemo(() => {
    if (activeCategory === "all") return achievements
    return achievements.filter((a) => a.category === activeCategory)
  }, [achievements, activeCategory])

  const unlockedCount = useMemo(() => achievements.filter((a) => a.unlocked).length, [achievements])

  const getIcon = (iconName: string, unlocked: boolean) => {
    const cls = cn("h-4 w-4", unlocked ? "text-primary" : "text-text-placeholder")
    switch (iconName) {
      case "Dumbbell": return <Dumbbell className={cls} />
      case "Layers": return <Layers className={cls} />
      case "Scale": return <Scale className={cls} />
      case "Trophy": return <Trophy className={cls} />
      case "BookOpen": return <BookOpen className={cls} />
      case "Flame": return <Flame className={cls} />
      default: return <Shield className={cls} />
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">
            Milestone Achievements
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-elevated border border-border-subtle text-text-muted">
            {unlockedCount} / {achievements.length} Unlocked
          </span>
        </div>

        {/* Category tabs */}
        <div className="flex border border-border-default rounded overflow-x-auto max-w-full">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "px-2.5 h-7 text-[10px] font-mono transition-colors shrink-0",
                activeCategory === tab.id
                  ? "bg-bg-elevated text-primary font-bold"
                  : "text-text-placeholder hover:text-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Monochrome GitHub-inspired Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredAchievements.map((item) => {
          const pct = Math.min(100, Math.round((item.progress / item.target) * 100))
          return (
            <div
              key={item.id}
              className={cn(
                "p-3.5 rounded-lg border space-y-2.5 transition-all relative",
                item.unlocked
                  ? "border-accent/40 bg-bg-surface text-primary"
                  : "border-border-subtle/50 bg-bg-base/20 opacity-70"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "h-8 w-8 rounded flex items-center justify-center border",
                      item.unlocked
                        ? "bg-bg-elevated border-accent/30"
                        : "bg-bg-base border-border-subtle"
                    )}
                  >
                    {getIcon(item.iconName, item.unlocked)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary">{item.title}</h4>
                    <span className="text-[9px] font-mono text-text-placeholder uppercase tracking-wider block">
                      {item.category}
                    </span>
                  </div>
                </div>

                {item.unlocked ? (
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-text-placeholder shrink-0" />
                )}
              </div>

              <p className="text-[11px] text-text-secondary leading-snug">{item.description}</p>

              {/* Progress counter & bar */}
              <div className="space-y-1 pt-1 border-t border-border-subtle/40 text-mono">
                <div className="flex justify-between text-[9px] text-text-placeholder">
                  <span>Progress</span>
                  <span className="font-bold text-primary">
                    {item.progress.toLocaleString()} / {item.target.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-base border border-border-subtle/50 overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      item.unlocked ? "bg-accent" : "bg-text-placeholder"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
