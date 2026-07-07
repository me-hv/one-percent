"use client"

import { Utensils } from "lucide-react"

export function NutritionWidget() {
  const caloriesLogged = 1850
  const caloriesTarget = 2400
  const caloriesRemaining = caloriesTarget - caloriesLogged
  const percentage = Math.min((caloriesLogged / caloriesTarget) * 100, 100)

  const macros = [
    { name: "Protein", logged: 145, target: 180, unit: "g", color: "bg-accent" },
    { name: "Carbs", logged: 210, target: 260, unit: "g", color: "bg-info" },
    { name: "Fat", logged: 60, target: 80, unit: "g", color: "bg-warning" },
  ]

  return (
    <div className="card space-y-4">
      <div className="card-header">
        <span className="card-label">Nutrition today</span>
        <Utensils className="h-4 w-4 text-text-placeholder" />
      </div>

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
              {caloriesRemaining}
            </span>
            <span className="text-[10px] text-text-placeholder uppercase tracking-wider block">
              kcal remaining
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
      </div>
    </div>
  )
}
export default NutritionWidget
