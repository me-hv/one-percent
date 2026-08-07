/**
 * Analytics Store for One Percent Progress Intelligence Engine.
 * Manages UI filter states: timeframes (7d, 30d, 90d, 1y, all), PR filters,
 * selected exercise targets, and active analytics views.
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { MuscleGroup } from "@/lib/types/common.types"
import type { PRType } from "@/lib/types/training.types"

export type AnalyticsTimeframe = "7d" | "30d" | "90d" | "1y" | "all"

export interface AnalyticsState {
  timeframe: AnalyticsTimeframe
  selectedMuscle: MuscleGroup | "all"
  selectedExerciseId: string | null
  prFilter: "all" | PRType
  activeTab: "overview" | "volume" | "prs" | "calendar" | "insights"

  // Actions
  setTimeframe: (timeframe: AnalyticsTimeframe) => void
  setSelectedMuscle: (muscle: MuscleGroup | "all") => void
  setSelectedExerciseId: (id: string | null) => void
  setPRFilter: (filter: "all" | PRType) => void
  setActiveTab: (tab: "overview" | "volume" | "prs" | "calendar" | "insights") => void
  resetFilters: () => void
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      timeframe: "30d",
      selectedMuscle: "all",
      selectedExerciseId: null,
      prFilter: "all",
      activeTab: "overview",

      setTimeframe: (timeframe) => set({ timeframe }),
      setSelectedMuscle: (selectedMuscle) => set({ selectedMuscle }),
      setSelectedExerciseId: (selectedExerciseId) => set({ selectedExerciseId }),
      setPRFilter: (prFilter) => set({ prFilter }),
      setActiveTab: (activeTab) => set({ activeTab }),
      resetFilters: () =>
        set({
          timeframe: "30d",
          selectedMuscle: "all",
          selectedExerciseId: null,
          prFilter: "all",
          activeTab: "overview",
        }),
    }),
    {
      name: "one-percent-analytics-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
