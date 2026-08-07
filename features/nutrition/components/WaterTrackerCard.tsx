"use client"

import { useState } from "react"
import { Droplet, Plus, Flame, CheckCircle2 } from "lucide-react"
import { useNutritionStore } from "@/features/nutrition/store/nutrition.store"
import { cn } from "@/lib/utils/cn"
import { toast } from "sonner"

interface WaterTrackerCardProps {
  selectedDateStr: string
}

const QUICK_WATER_AMOUNTS = [
  { label: "+250ml", ml: 250 },
  { label: "+500ml", ml: 500 },
  { label: "+750ml", ml: 750 },
  { label: "+1,000ml", ml: 1000 },
]

export function WaterTrackerCard({ selectedDateStr }: WaterTrackerCardProps) {
  const { getDailyLog, addWater, targets } = useNutritionStore()
  const dailyLog = getDailyLog(selectedDateStr)
  const currentMl = dailyLog.waterMl || 0
  const targetMl = targets.waterMl || 3500

  const [customMl, setCustomMl] = useState("")

  const pct = Math.min(100, Math.round((currentMl / targetMl) * 100))
  const isGoalAchieved = currentMl >= targetMl

  const handleQuickAdd = (amount: number) => {
    addWater(selectedDateStr, amount)
    toast.success(`Logged +${amount}ml water`)
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseInt(customMl, 10)
    if (isNaN(val) || val <= 0) return
    addWater(selectedDateStr, val)
    toast.success(`Logged +${val}ml water`)
    setCustomMl("")
  }

  return (
    <div className="card p-5 space-y-4 border border-cyan-500/30 bg-bg-surface hover:border-cyan-500/50 transition-all font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
            <Droplet className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary font-sans">Hydration & Water Tracker</h3>
            <span className="text-[10px] text-text-placeholder">Daily Target: {(targetMl / 1000).toFixed(1)}L</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-extrabold text-cyan-400 font-mono block">
            {(currentMl / 1000).toFixed(2)}L <span className="text-xs text-text-placeholder">/ {(targetMl / 1000).toFixed(1)}L</span>
          </span>
          <span className="text-[10px] text-text-muted font-bold">{pct}% Target Met</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2.5 w-full rounded-full bg-bg-base border border-border-subtle overflow-hidden p-0.5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isGoalAchieved ? "bg-cyan-400" : "bg-gradient-to-r from-cyan-600 to-cyan-400"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-text-placeholder">
          <span>0 L</span>
          {isGoalAchieved ? (
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Target Achieved!
            </span>
          ) : (
            <span>Remaining: {((targetMl - currentMl) / 1000).toFixed(2)}L</span>
          )}
          <span>{(targetMl / 1000).toFixed(1)} L</span>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_WATER_AMOUNTS.map((item) => (
          <button
            key={item.ml}
            onClick={() => handleQuickAdd(item.ml)}
            className="h-8 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-bold hover:bg-cyan-500/20 text-xs transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="h-3 w-3" /> {item.label}
          </button>
        ))}
      </div>

      {/* Custom Log Input */}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1 border-t border-border-subtle">
        <input
          type="number"
          placeholder="Custom ml (e.g. 350)"
          value={customMl}
          onChange={(e) => setCustomMl(e.target.value)}
          className="flex-1 h-8 px-2 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder text-xs outline-none"
        />
        <button type="submit" className="h-8 px-3 rounded bg-cyan-500 text-bg-base font-bold text-xs hover:bg-cyan-400 transition-colors">
          Add ml
        </button>
      </form>
    </div>
  )
}
