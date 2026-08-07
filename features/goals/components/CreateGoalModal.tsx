"use client"

import { useState } from "react"
import { Target, X, Plus } from "lucide-react"
import { useGoalsStore } from "@/features/goals/store/goals.store"
import type { GoalCategory, GoalPriority, AutoUpdateKey } from "@/lib/types/goals.types"
import { toast } from "sonner"

interface CreateGoalModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateGoalModal({ isOpen, onClose }: CreateGoalModalProps) {
  const { addGoal } = useGoalsStore()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<GoalCategory>("strength")
  const [priority, setPriority] = useState<GoalPriority>("high")
  const [startValue, setStartValue] = useState("80")
  const [targetValue, setTargetValue] = useState("100")
  const [currentValue, setCurrentValue] = useState("80")
  const [unit, setUnit] = useState("kg")
  const [autoUpdateKey, setAutoUpdateKey] = useState<AutoUpdateKey>("bench_press")
  const [deadlineStr, setDeadlineStr] = useState("")

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Please enter a goal title")
      return
    }

    const startVal = parseFloat(startValue) || 0
    const targetVal = parseFloat(targetValue) || 0
    const currentVal = parseFloat(currentValue) || startVal

    addGoal({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      type: "numeric",
      startValue: startVal,
      targetValue: targetVal,
      currentValue: currentVal,
      unit: unit.trim() || "kg",
      autoUpdateKey,
      deadlineStr: deadlineStr || undefined,
      status: "active",
    })

    toast.success(`Goal "${title}" created successfully!`)
    onClose()
    setTitle("")
    setDescription("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg card p-6 space-y-5 border border-accent/40 bg-bg-surface shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            <h3 className="text-base font-bold text-primary">Create Long-Term Goal</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-[10px] text-text-placeholder uppercase font-bold">Goal Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Bench Press 100kg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-text-placeholder uppercase font-bold">Description</label>
            <input
              type="text"
              placeholder="Target 1RM lockout or lean bulk target..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-text-placeholder uppercase font-bold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary focus:border-accent text-xs outline-none"
              >
                <option value="strength">Strength</option>
                <option value="body_comp">Body Composition</option>
                <option value="consistency">Consistency</option>
                <option value="nutrition">Nutrition</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-text-placeholder uppercase font-bold">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary focus:border-accent text-xs outline-none"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] text-text-placeholder uppercase">Start</label>
              <input
                type="number"
                step="any"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                className="w-full h-9 px-2 rounded border border-border-default bg-bg-base text-primary focus:border-accent text-xs outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-text-placeholder uppercase">Current</label>
              <input
                type="number"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full h-9 px-2 rounded border border-border-default bg-bg-base text-primary focus:border-accent text-xs outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-text-placeholder uppercase">Target</label>
              <input
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full h-9 px-2 rounded border border-border-default bg-bg-base text-primary focus:border-accent text-xs outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-text-placeholder uppercase">Unit</label>
              <input
                type="text"
                placeholder="kg"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-9 px-2 rounded border border-border-default bg-bg-base text-primary focus:border-accent text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-text-placeholder uppercase font-bold">Auto Sync Metric</label>
              <select
                value={autoUpdateKey}
                onChange={(e) => setAutoUpdateKey(e.target.value as AutoUpdateKey)}
                className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary focus:border-accent text-xs outline-none"
              >
                <option value="bench_press">Bench Press 1RM</option>
                <option value="squat">Squat 1RM</option>
                <option value="deadlift">Deadlift 1RM</option>
                <option value="ohp">Overhead Press 1RM</option>
                <option value="pull_up">Pull-Up Max Reps</option>
                <option value="body_weight">Body Weight (kg)</option>
                <option value="body_fat">Body Fat %</option>
                <option value="workout_streak">Workout Streak (Days)</option>
                <option value="weekly_sessions">Weekly Workouts</option>
                <option value="monthly_sessions">Monthly Workouts</option>
                <option value="program_completion">Program Weeks</option>
                <option value="custom">Manual Update</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-text-placeholder uppercase font-bold">Deadline Date</label>
              <input
                type="date"
                value={deadlineStr}
                onChange={(e) => setDeadlineStr(e.target.value)}
                className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary focus:border-accent text-xs outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-border-subtle flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded border border-border-subtle text-text-secondary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded bg-accent text-bg-base font-bold flex items-center gap-1.5 hover:bg-accent-hover transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
