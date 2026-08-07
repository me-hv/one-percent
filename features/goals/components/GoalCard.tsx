"use client"

import { useState } from "react"
import { Target, CheckCircle2, AlertTriangle, Trash2, Edit2, Zap, ArrowRight, Flame } from "lucide-react"
import type { Goal } from "@/lib/types/goals.types"
import { useGoalsStore } from "@/features/goals/store/goals.store"
import { cn } from "@/lib/utils/cn"

interface GoalCardProps {
  goal: Goal
  onEdit?: (goal: Goal) => void
}

const PRIORITY_BADGES = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-slate-500/15 text-slate-300 border-slate-500/30",
}

const CATEGORY_LABELS = {
  strength: "Strength",
  body_comp: "Body Comp",
  consistency: "Consistency",
  nutrition: "Nutrition",
  custom: "Custom",
  training: "Strength",
  bodyweight: "Body Weight",
  body_measurement: "Measurements",
  recovery: "Recovery",
  habit: "Habits",
  other: "Custom",
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const { deleteGoal, updateGoal } = useGoalsStore()
  const isCompleted = goal.status === "completed" || goal.progressPct >= 100

  const toggleStatus = () => {
    if (goal.status === "completed") {
      updateGoal(goal.id, { status: "active", progressPct: Math.min(goal.progressPct, 95) })
    } else {
      updateGoal(goal.id, { status: "completed", progressPct: 100 })
    }
  }

  // Milestone callout logic
  const remaining = goal.startValue != null && goal.targetValue != null && goal.currentValue != null
    ? Math.abs(goal.targetValue - goal.currentValue)
    : 0

  return (
    <div
      className={cn(
        "card p-5 space-y-4 border transition-all relative",
        isCompleted
          ? "border-accent/40 bg-accent/5 opacity-90"
          : "border-border-subtle hover:border-accent/30 bg-bg-surface"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border font-bold",
                PRIORITY_BADGES[goal.priority] || PRIORITY_BADGES.medium
              )}
            >
              {goal.priority} priority
            </span>

            <span className="text-[10px] font-mono text-text-placeholder uppercase">
              {CATEGORY_LABELS[goal.category] || goal.category}
            </span>
          </div>

          <h3 className="text-base font-bold text-primary">{goal.title}</h3>
          {goal.description && <p className="text-xs text-text-secondary">{goal.description}</p>}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(goal)}
              className="p-1.5 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors"
              title="Edit Goal"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => deleteGoal(goal.id)}
            className="p-1.5 rounded hover:bg-bg-elevated text-text-placeholder hover:text-red-400 transition-colors"
            title="Delete Goal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Value Slider Bar */}
      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">
            Current: <strong className="text-primary">{goal.currentValue ?? 0} {goal.unit ?? ""}</strong>
          </span>
          <span className="text-text-placeholder">
            Target: <strong className="text-accent">{goal.targetValue ?? 0} {goal.unit ?? ""}</strong>
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-bg-base border border-border-subtle overflow-hidden p-0.5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isCompleted ? "bg-accent" : "bg-gradient-to-r from-accent/70 to-accent"
            )}
            style={{ width: `${goal.progressPct}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-text-placeholder">
          <span>Start: {goal.startValue ?? 0} {goal.unit ?? ""}</span>
          <span className="font-bold text-accent">{goal.progressPct}% Completed</span>
        </div>
      </div>

      {/* Milestone Callout Notification Banner */}
      {!isCompleted && remaining > 0 && remaining <= 5 && (
        <div className="p-2.5 rounded border border-accent/30 bg-accent/10 text-xs font-mono text-accent flex items-center gap-2">
          <Zap className="h-4 w-4 shrink-0 animate-pulse" />
          <span>Almost there! Only <strong>{remaining.toFixed(1)}{goal.unit ?? ""}</strong> left to hit your goal.</span>
        </div>
      )}

      {/* Footer controls */}
      <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
        <button
          onClick={toggleStatus}
          className={cn(
            "text-xs font-mono px-3 py-1 rounded border transition-colors flex items-center gap-1.5 font-bold",
            isCompleted
              ? "bg-accent/15 border-accent/30 text-accent"
              : "bg-bg-elevated border-border-subtle text-text-secondary hover:text-primary"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {isCompleted ? "Completed Goal" : "Mark Completed"}
        </button>

        {goal.deadlineStr && (
          <span className="text-[10px] font-mono text-text-placeholder">
            Deadline: {goal.deadlineStr}
          </span>
        )}
      </div>
    </div>
  )
}
