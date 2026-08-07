"use client"

import { useState, useMemo, useEffect } from "react"
import { Target, Plus, Shield, Calendar, Trophy, Zap, Search, CheckCircle2 } from "lucide-react"
import { useGoalsStore } from "@/features/goals/store/goals.store"
import { useBodyStore } from "@/features/body/store/body.store"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { useAuthStore } from "@/lib/store/auth.store"
import { GoalCard } from "@/features/goals/components/GoalCard"
import { CreateGoalModal } from "@/features/goals/components/CreateGoalModal"
import { AchievementsGrid } from "@/features/achievements/components/AchievementsGrid"
import { WeeklyReviewModal } from "@/features/performance/components/WeeklyReviewModal"
import { MonthlyReviewModal } from "@/features/performance/components/MonthlyReviewModal"
import type { GoalCategory, GoalStatus } from "@/lib/types/goals.types"
import { cn } from "@/lib/utils/cn"

const CATEGORY_FILTERS = [
  { id: "all", label: "All Goals" },
  { id: "strength", label: "Strength" },
  { id: "body_comp", label: "Body Comp" },
  { id: "consistency", label: "Consistency" },
  { id: "nutrition", label: "Nutrition" },
  { id: "custom", label: "Custom" },
]

export default function GoalsPage() {
  const { user } = useAuthStore()
  const { data: history } = useWorkoutHistory(user?.uid ?? "")
  const { weightLogs, measurements, habitLogs, recoveryScores } = useBodyStore()
  const {
    goals,
    categoryFilter,
    statusFilter,
    searchQuery,
    milestoneNotifications,
    setCategoryFilter,
    setStatusFilter,
    setSearchQuery,
    syncLiveData,
  } = useGoalsStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)
  const [showMonthlyModal, setShowMonthlyModal] = useState(false)

  // Auto-sync goals with live metrics on mount
  useEffect(() => {
    syncLiveData(history, weightLogs, measurements, habitLogs)
  }, [history, weightLogs, measurements, habitLogs, syncLiveData])

  // Filtered goals list
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      // Category filter
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false
      // Status filter
      if (statusFilter === "active" && g.status === "completed") return false
      if (statusFilter === "completed" && g.status !== "completed") return false
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return g.title.toLowerCase().includes(q) || (g.description?.toLowerCase().includes(q) ?? false)
      }
      return true
    })
  }, [goals, categoryFilter, statusFilter, searchQuery])

  const activeCount = useMemo(() => goals.filter((g) => g.status === "active").length, [goals])
  const completedCount = useMemo(() => goals.filter((g) => g.status === "completed").length, [goals])

  return (
    <div className="page-container space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="page-title">Goals & Performance Engine</h2>
          <p className="text-sm text-text-secondary mt-1">
            Long-term strength targets, auto-synced body composition, performance scores, and GitHub-style milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowWeeklyModal(true)}
            className="h-9 px-3 rounded border border-border-default bg-bg-surface text-primary hover:border-accent text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5 text-accent" /> Weekly Review
          </button>
          <button
            onClick={() => setShowMonthlyModal(true)}
            className="h-9 px-3 rounded border border-border-default bg-bg-surface text-primary hover:border-amber-500/40 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" /> Monthly Review
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-9 px-4 rounded bg-accent text-bg-base font-bold text-xs hover:bg-accent-hover transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Goal
          </button>
        </div>
      </div>

      {/* Milestone Callout Notifications Ticker */}
      {milestoneNotifications.length > 0 && (
        <div className="space-y-2">
          {milestoneNotifications.map((note, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-accent/30 bg-accent/10 text-xs font-mono text-accent flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 shrink-0 animate-pulse" />
                <span>{note}</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider">Milestone Alert</span>
            </div>
          ))}
        </div>
      )}

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-placeholder" />
          <input
            type="text"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded border border-border-default bg-bg-surface text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Active / Completed tab status */}
          <div className="flex rounded border border-border-default overflow-hidden">
            <button
              onClick={() => setStatusFilter("active")}
              className={cn(
                "px-3 h-8 text-[11px] font-mono transition-colors",
                statusFilter === "active" ? "bg-bg-elevated text-primary font-bold" : "text-text-secondary"
              )}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={cn(
                "px-3 h-8 text-[11px] font-mono transition-colors",
                statusFilter === "completed" ? "bg-bg-elevated text-primary font-bold" : "text-text-secondary"
              )}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex border-b border-border-subtle overflow-x-auto">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id as any)}
            className={cn(
              "px-4 py-2 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px shrink-0",
              categoryFilter === cat.id
                ? "border-accent text-primary"
                : "border-transparent text-text-secondary hover:text-primary"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}

        {filteredGoals.length === 0 && (
          <div className="col-span-full card p-8 text-center text-xs text-text-placeholder space-y-2">
            <Target className="h-8 w-8 mx-auto text-border-subtle" />
            <p>No goals found for this filter. Create a new goal to start tracking progress!</p>
          </div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="pt-6 border-t border-border-subtle">
        <AchievementsGrid sessions={history} goals={goals} />
      </div>

      {/* Modals */}
      <CreateGoalModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <WeeklyReviewModal
        isOpen={showWeeklyModal}
        onClose={() => setShowWeeklyModal(false)}
        sessions={history}
        weightLogs={weightLogs}
        recoveryScores={recoveryScores}
        goals={goals}
      />
      <MonthlyReviewModal
        isOpen={showMonthlyModal}
        onClose={() => setShowMonthlyModal(false)}
        sessions={history}
        weightLogs={weightLogs}
        goals={goals}
      />
    </div>
  )
}
