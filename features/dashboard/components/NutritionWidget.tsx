"use client"

import { useState } from "react"
import { Utensils, Plus, Minus } from "lucide-react"
import { useBodyStore } from "@/features/body/store/body.store"
import { toast } from "sonner"

export function NutritionWidget() {
  const { nutrition, logNutrition } = useBodyStore()
  const [showLogModal, setShowLogModal] = useState(false)
  
  // Modal quick input states
  const [calInput, setCalInput] = useState(nutrition.caloriesLogged.toString())
  const [proteinInput, setProteinInput] = useState(nutrition.proteinLogged.toString())
  const [carbsInput, setCarbsInput] = useState(nutrition.carbsLogged.toString())
  const [fatInput, setFatInput] = useState(nutrition.fatLogged.toString())

  const caloriesLogged = nutrition.caloriesLogged
  const caloriesTarget = nutrition.caloriesTarget
  const caloriesRemaining = caloriesTarget - caloriesLogged
  const percentage = Math.min((caloriesLogged / caloriesTarget) * 100, 100)

  const macros = [
    { name: "Protein", logged: nutrition.proteinLogged, target: nutrition.proteinTarget, unit: "g", color: "bg-accent" },
    { name: "Carbs", logged: nutrition.carbsLogged, target: nutrition.carbsTarget, unit: "g", color: "bg-info" },
    { name: "Fat", logged: nutrition.fatLogged, target: nutrition.fatTarget, unit: "g", color: "bg-warning" },
  ]

  const handleQuickLog = (kcal: number) => {
    const nextCal = Math.max(0, caloriesLogged + kcal)
    logNutrition(nextCal, nutrition.proteinLogged, nutrition.carbsLogged, nutrition.fatLogged)
    toast.success(`Logged ${kcal > 0 ? `+${kcal}` : kcal} kcal`)
  }

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const cal = parseInt(calInput) || 0
    const prot = parseInt(proteinInput) || 0
    const carb = parseInt(carbsInput) || 0
    const fat = parseInt(fatInput) || 0

    logNutrition(cal, prot, carb, fat)
    toast.success("Nutrition updated")
    setShowLogModal(false)
  }

  return (
    <div className="card space-y-4">
      <div className="card-header">
        <span className="card-label">Nutrition today</span>
        <button
          onClick={() => {
            setCalInput(nutrition.caloriesLogged.toString())
            setProteinInput(nutrition.proteinLogged.toString())
            setCarbsInput(nutrition.carbsLogged.toString())
            setFatInput(nutrition.fatLogged.toString())
            setShowLogModal(!showLogModal)
          }}
          className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1"
        >
          <Utensils className="h-3.5 w-3.5" /> Adjust
        </button>
      </div>

      {showLogModal ? (
        <form onSubmit={handleSubmitCustom} className="space-y-3 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-text-placeholder uppercase">Calories</label>
              <input type="number" value={calInput} onChange={(e) => setCalInput(e.target.value)} className="w-full h-8 px-2 rounded border border-border-default bg-bg-base text-primary text-xs outline-none" />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-text-placeholder uppercase">Protein (g)</label>
              <input type="number" value={proteinInput} onChange={(e) => setProteinInput(e.target.value)} className="w-full h-8 px-2 rounded border border-border-default bg-bg-base text-primary text-xs outline-none" />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-text-placeholder uppercase">Carbs (g)</label>
              <input type="number" value={carbsInput} onChange={(e) => setCarbsInput(e.target.value)} className="w-full h-8 px-2 rounded border border-border-default bg-bg-base text-primary text-xs outline-none" />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] font-mono text-text-placeholder uppercase">Fat (g)</label>
              <input type="number" value={fatInput} onChange={(e) => setFatInput(e.target.value)} className="w-full h-8 px-2 rounded border border-border-default bg-bg-base text-primary text-xs outline-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowLogModal(false)} className="h-7 px-3 rounded border border-border-default text-primary text-[10px] hover:bg-bg-elevated">Cancel</button>
            <button type="submit" className="h-7 px-3 rounded bg-accent text-bg-base hover:bg-accent-hover font-bold text-[10px]">Save</button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Calories Display */}
          <div className="flex justify-between items-baseline">
            <div className="space-y-1">
              <span className="font-mono text-3xl font-bold text-primary tracking-tight">
                {caloriesLogged}
              </span>
              <span className="text-xs text-text-secondary ml-1.5">/ {caloriesTarget} kcal</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-semibold text-primary block">
                {caloriesRemaining >= 0 ? caloriesRemaining : 0}
              </span>
              <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
                {caloriesRemaining >= 0 ? "kcal remaining" : "kcal surplus"}
              </span>
            </div>
          </div>

          {/* Calories Progress Bar */}
          <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Macros Breakdown */}
          <div className="space-y-3 pt-1">
            {macros.map((m) => {
              const pct = Math.min((m.logged / m.target) * 100, 100)

              return (
                <div key={m.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-primary">{m.name}</span>
                    <span className="font-mono text-text-secondary">
                      {m.logged} / {m.target}
                      {m.unit}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.color} transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Adjust Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => handleQuickLog(100)}
              className="flex-1 h-7 rounded border border-border-default hover:bg-bg-elevated text-primary font-mono text-[10px] font-semibold transition-all"
            >
              +100 kcal
            </button>
            <button
              onClick={() => handleQuickLog(250)}
              className="flex-1 h-7 rounded border border-border-default hover:bg-bg-elevated text-primary font-mono text-[10px] font-semibold transition-all"
            >
              +250 kcal
            </button>
            <button
              onClick={() => handleQuickLog(-100)}
              className="h-7 w-7 rounded border border-border-default hover:bg-bg-elevated text-text-placeholder hover:text-primary flex items-center justify-center transition-all"
              title="Remove 100 kcal"
            >
              <Minus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
export default NutritionWidget
