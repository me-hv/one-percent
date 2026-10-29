import { useEffect, useMemo } from "react"
import { useCoachStore } from "../store/coach.store"
import { generateCoachingRecommendations, calculateDataCompleteness } from "../services/coach-engine.service"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { useRecoveryStore } from "@/features/recovery/store/recovery.store"
import { useNutritionStore } from "@/features/nutrition/store/nutrition.store"
import { useGoalsStore } from "@/features/goals/store/goals.store"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { useAuthStore } from "@/lib/store/auth.store"

export function useCoachRecommendations() {
  const { user } = useAuthStore()
  const { programs } = useProgramsStore()
  const { entries: recoveryEntries } = useRecoveryStore()
  const { dailyLogs: nutritionLogs, targets: nutritionTargets } = useNutritionStore()
  const { goals } = useGoalsStore()
  const { data: sessions = [] } = useWorkoutHistory(user?.uid || "")

  const {
    recommendations,
    setRecommendations,
    dismissRecommendation,
    completeRecommendation,
    setFeedback,
    dismissedRecommendationIds,
  } = useCoachStore()

  const activeProgram = useMemo(
    () => programs.find((p) => p.isActive && !p.isArchived) || null,
    [programs]
  )

  const completeness = useMemo(
    () =>
      calculateDataCompleteness({
        userId: user?.uid || "",
        sessions,
        activeProgram,
        recoveryEntries,
        nutritionLogs,
        nutritionTargets,
        goals,
      }),
    [user?.uid, sessions, activeProgram, recoveryEntries, nutritionLogs, nutritionTargets, goals]
  )

  useEffect(() => {
    const generated = generateCoachingRecommendations({
      userId: user?.uid || "",
      sessions,
      activeProgram,
      recoveryEntries,
      nutritionLogs,
      nutritionTargets,
      goals,
      dismissedIds: dismissedRecommendationIds,
    })

    setRecommendations(generated)
  }, [
    user?.uid,
    sessions,
    activeProgram,
    recoveryEntries,
    nutritionLogs,
    nutritionTargets,
    goals,
    dismissedRecommendationIds,
    setRecommendations,
  ])

  return {
    recommendations,
    completeness,
    activeProgram,
    dismissRecommendation,
    completeRecommendation,
    setFeedback,
  }
}
