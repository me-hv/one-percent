"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Utensils, Calendar, Target, Flame, Droplet, Pill, ChevronLeft, ChevronRight, Search, TrendingUp, PieChart, CheckCircle2 } from "lucide-react"
import { useNutritionStore } from "@/features/nutrition/store/nutrition.store"
import { calculateNutritionScore } from "@/features/nutrition/services/nutrition.service"
import { MealLogger } from "@/features/nutrition/components/MealLogger"
import { WaterTrackerCard } from "@/features/nutrition/components/WaterTrackerCard"
import { SupplementTrackerCard } from "@/features/nutrition/components/SupplementTrackerCard"
import type { MealType } from "@/lib/types/nutrition.types"
import { formatDateKey, formatDateShort, subDays, addDays } from "@/lib/utils/date"
import { cn } from "@/lib/utils/cn"

const FoodSearchModal = dynamic(
  () => import("@/features/nutrition/components/FoodSearchModal").then((m) => m.FoodSearchModal),
  { ssr: false }
)

const TREND_PERIODS = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "1yr", label: "1 Year" },
  { id: "all", label: "All Time" },
]

export default function NutritionPage() {
  const { getDailyLog, targets, supplementLogs } = useNutritionStore()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const selectedDateStr = formatDateKey(selectedDate)

  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchMealType, setSearchMealType] = useState<MealType>("lunch")
  const [trendPeriod, setTrendPeriod] = useState("7d")

  const dailyLog = getDailyLog(selectedDateStr)

  // Calculate Supplement adherence for today
  const todaySupplements = supplementLogs.filter((l) => l.date === selectedDateStr && l.taken)
  const suppAdherencePct = Math.min(100, Math.round((todaySupplements.length / 7) * 100))

  // Deterministic 0-100 Nutrition Score
  const nutritionScore = useMemo(() => {
    return calculateNutritionScore(dailyLog, targets, suppAdherencePct)
  }, [dailyLog, targets, suppAdherencePct])

  // Macro Distribution percentages
  const macroDist = useMemo(() => {
    const totalGrams = (dailyLog.totalProtein || 0) + (dailyLog.totalCarbs || 0) + (dailyLog.totalFat || 0)
    if (totalGrams === 0) return { proteinPct: 35, carbsPct: 45, fatPct: 20 }
    return {
      proteinPct: Math.round(((dailyLog.totalProtein || 0) / totalGrams) * 100),
      carbsPct: Math.round(((dailyLog.totalCarbs || 0) / totalGrams) * 100),
      fatPct: Math.round(((dailyLog.totalFat || 0) / totalGrams) * 100),
    }
  }, [dailyLog])

  const handleOpenSearch = (mealType: MealType = "lunch") => {
    setSearchMealType(mealType)
    setShowSearchModal(true)
  }

  return (
    <div className="page-container space-y-6 max-w-5xl mx-auto">
      {/* Header & Date Navigator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="page-title">Nutrition & Health OS</h2>
          <p className="text-sm text-text-secondary mt-1">
            Macro tracking, meal logging, hydration, supplement schedule, and deterministic nutrition intelligence.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setSelectedDate((d) => subDays(d, 1))}
            className="p-2 rounded border border-border-default bg-bg-surface text-text-secondary hover:text-primary hover:border-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="px-3 py-1.5 rounded border border-border-default bg-bg-surface text-primary font-bold text-center min-w-[130px]">
            {formatDateShort(selectedDate)}
          </div>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            className="p-2 rounded border border-border-default bg-bg-surface text-text-secondary hover:text-primary hover:border-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-2.5 py-1.5 rounded bg-accent/15 text-accent hover:bg-accent/25 font-bold transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Top Banner: Nutrition Score & Macro Target Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 0-100 Nutrition Score Widget */}
        <div className="lg:col-span-4 card p-5 border border-accent/40 bg-bg-surface space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase text-text-placeholder tracking-wider">Nutrition Score</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent font-bold">Deterministic</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-primary">{nutritionScore}</span>
            <span className="text-xs text-text-placeholder">/ 100</span>
          </div>

          {/* Score status bar */}
          <div className="h-2 w-full rounded-full bg-bg-base border border-border-subtle overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent/70 to-accent" style={{ width: `${nutritionScore}%` }} />
          </div>

          <div className="text-[11px] text-text-secondary leading-snug pt-1 font-sans">
            {nutritionScore >= 85
              ? "Optimal macro distribution and high protein consistency today."
              : nutritionScore >= 60
              ? "Good target alignment. Increase hydration and protein intake to optimize."
              : "Log meals and reach your protein goal to elevate performance."}
          </div>
        </div>

        {/* Daily Macro Progress Grid */}
        <div className="lg:col-span-8 card p-5 border border-border-subtle bg-bg-surface space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-border-subtle pb-2">
            <span className="font-bold text-primary uppercase tracking-wider text-xs">Daily Macro Summary</span>
            <button
              onClick={() => handleOpenSearch("lunch")}
              className="h-7 px-3 rounded bg-accent text-bg-base font-bold text-[11px] hover:bg-accent-hover transition-colors flex items-center gap-1"
            >
              <Search className="h-3.5 w-3.5" /> Search Food DB
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Calories */}
            <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-1">
              <span className="text-[9px] text-text-placeholder uppercase block">Calories</span>
              <span className="text-base font-bold text-accent block">{dailyLog.totalCalories} <span className="text-[9px] text-text-placeholder">/ {targets.calories}</span></span>
              <div className="h-1.5 w-full rounded-full bg-bg-base overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.round((dailyLog.totalCalories / targets.calories) * 100))}%` }} />
              </div>
            </div>

            {/* Protein */}
            <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-1">
              <span className="text-[9px] text-text-placeholder uppercase block">Protein</span>
              <span className="text-base font-bold text-primary block">{dailyLog.totalProtein.toFixed(1)}g <span className="text-[9px] text-text-placeholder">/ {targets.protein}g</span></span>
              <div className="h-1.5 w-full rounded-full bg-bg-base overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.round((dailyLog.totalProtein / targets.protein) * 100))}%` }} />
              </div>
            </div>

            {/* Carbs */}
            <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-1">
              <span className="text-[9px] text-text-placeholder uppercase block">Carbohydrates</span>
              <span className="text-base font-bold text-primary block">{dailyLog.totalCarbs.toFixed(1)}g <span className="text-[9px] text-text-placeholder">/ {targets.carbs}g</span></span>
              <div className="h-1.5 w-full rounded-full bg-bg-base overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.round((dailyLog.totalCarbs / targets.carbs) * 100))}%` }} />
              </div>
            </div>

            {/* Fat */}
            <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/40 space-y-1">
              <span className="text-[9px] text-text-placeholder uppercase block">Fats</span>
              <span className="text-base font-bold text-primary block">{dailyLog.totalFat.toFixed(1)}g <span className="text-[9px] text-text-placeholder">/ {targets.fat}g</span></span>
              <div className="h-1.5 w-full rounded-full bg-bg-base overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.round((dailyLog.totalFat / targets.fat) * 100))}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Meal Logging Section */}
      <MealLogger selectedDateStr={selectedDateStr} onOpenSearchModal={handleOpenSearch} />

      {/* Water & Supplement Dual Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WaterTrackerCard selectedDateStr={selectedDateStr} />
        <SupplementTrackerCard selectedDateStr={selectedDateStr} />
      </div>

      {/* Search Modal */}
      <FoodSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        selectedDateStr={selectedDateStr}
        defaultMealType={searchMealType}
      />
    </div>
  )
}
