"use client"

import { useState } from "react"
import { Plus, Trash2, Copy, Save, Utensils, Zap, ChevronRight, Check } from "lucide-react"
import { useNutritionStore } from "@/features/nutrition/store/nutrition.store"
import type { MealType, LoggedFood } from "@/lib/types/nutrition.types"
import { cn } from "@/lib/utils/cn"
import { toast } from "sonner"

interface MealLoggerProps {
  selectedDateStr: string
  onOpenSearchModal: (mealType: MealType) => void
}

const MEAL_SLOTS: { type: MealType; label: string; icon: string }[] = [
  { type: "breakfast", label: "Breakfast", icon: "🍳" },
  { type: "lunch", label: "Lunch", icon: "🥗" },
  { type: "dinner", label: "Dinner", icon: "🥩" },
  { type: "snack", label: "Snack & Drinks", icon: "🍎" },
  { type: "pre_workout", label: "Pre-Workout Meal", icon: "⚡" },
  { type: "post_workout", label: "Post-Workout Recovery", icon: "💪" },
]

export function MealLogger({ selectedDateStr, onOpenSearchModal }: MealLoggerProps) {
  const { getDailyLog, removeLoggedFood, updateLoggedFoodQuantity, copyYesterdayMeals, saveMealAsTemplate } =
    useNutritionStore()

  const dailyLog = getDailyLog(selectedDateStr)
  const [templateName, setTemplateName] = useState("")
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)

  const handleCopyYesterday = () => {
    copyYesterdayMeals(selectedDateStr)
    toast.success("Copied yesterday's meal log!")
  }

  const handleSaveTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateName.trim()) {
      toast.error("Please enter a template name")
      return
    }
    if (dailyLog.foods.length === 0) {
      toast.error("No foods logged today to save as template")
      return
    }
    saveMealAsTemplate(templateName.trim(), dailyLog.foods)
    toast.success(`Saved meal template "${templateName}"!`)
    setShowSaveTemplateModal(false)
    setTemplateName("")
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-accent" />
          <span className="font-bold text-primary uppercase tracking-wider">Daily Meal Log</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyYesterday}
            className="h-8 px-3 rounded border border-border-default bg-bg-surface text-primary hover:border-accent text-[11px] transition-colors flex items-center gap-1.5"
          >
            <Copy className="h-3.5 w-3.5 text-accent" /> Copy Yesterday
          </button>
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="h-8 px-3 rounded border border-border-default bg-bg-surface text-primary hover:border-accent text-[11px] transition-colors flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5 text-amber-400" /> Save Template
          </button>
        </div>
      </div>

      {/* Save Template Dialog */}
      {showSaveTemplateModal && (
        <form onSubmit={handleSaveTemplateSubmit} className="p-4 rounded border border-amber-500/40 bg-bg-surface space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-amber-400">Save Today's Log as Meal Template</span>
            <button type="button" onClick={() => setShowSaveTemplateModal(false)} className="text-text-placeholder">Cancel</button>
          </div>
          <input
            type="text"
            required
            placeholder="Template Name (e.g. High Protein Bulk Day)"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full h-8 px-3 rounded border border-border-default bg-bg-base text-primary outline-none font-sans"
          />
          <button type="submit" className="h-8 px-4 rounded bg-amber-500 text-bg-base font-bold">
            Confirm Save Template
          </button>
        </form>
      )}

      {/* 6 Meal Slots Grid */}
      <div className="space-y-3">
        {MEAL_SLOTS.map((slot) => {
          const slotFoods = dailyLog.foods.filter((f) => f.mealType === slot.type)
          const slotCalories = slotFoods.reduce((acc, f) => acc + (f.calories || 0), 0)
          const slotProtein = slotFoods.reduce((acc, f) => acc + (f.protein || 0), 0)

          return (
            <div key={slot.type} className="card p-4 space-y-3 border border-border-subtle bg-bg-surface hover:border-border-default transition-all">
              {/* Slot Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{slot.icon}</span>
                  <h4 className="text-xs font-bold text-primary font-mono uppercase tracking-wider">{slot.label}</h4>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  {slotFoods.length > 0 && (
                    <span className="text-[11px] text-text-muted">
                      <strong className="text-accent">{slotCalories} kcal</strong> · P: <strong className="text-primary">{slotProtein.toFixed(1)}g</strong>
                    </span>
                  )}
                  <button
                    onClick={() => onOpenSearchModal(slot.type)}
                    className="h-7 px-2.5 rounded bg-accent/15 text-accent hover:bg-accent/25 text-[10px] font-bold transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Food
                  </button>
                </div>
              </div>

              {/* Slot Foods List */}
              {slotFoods.length > 0 ? (
                <div className="space-y-2 border-t border-border-subtle/50 pt-2 font-mono text-xs">
                  {slotFoods.map((item) => (
                    <div key={item.id} className="p-2.5 rounded border border-border-subtle bg-bg-base/40 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="font-bold text-primary font-sans block truncate">{item.name}</span>
                        <span className="text-[10px] text-text-placeholder block">
                          {item.quantity} × {item.servingSize}{item.servingUnit}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="font-bold text-accent text-xs block">{item.calories} <span className="text-[9px] text-text-placeholder">kcal</span></span>
                          <span className="text-[9px] text-text-muted">
                            P: <strong>{item.protein}g</strong> · C: <strong>{item.carbs}g</strong> · F: <strong>{item.fat}g</strong>
                          </span>
                        </div>

                        {/* Quantity Adjuster */}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={item.quantity}
                            onChange={(e) => updateLoggedFoodQuantity(selectedDateStr, item.id, parseFloat(e.target.value) || 0.1)}
                            className="w-12 h-7 px-1 rounded border border-border-default bg-bg-surface text-center font-bold text-[11px]"
                          />
                          <button
                            onClick={() => removeLoggedFood(selectedDateStr, item.id)}
                            className="p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-text-placeholder font-mono text-center py-2 border border-dashed border-border-subtle/60 rounded">
                  No foods logged for {slot.label}. Click "+ Add Food" to search.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
