import type { FoodItem, DailyNutritionLog, SavedMeal, NutritionTargets, SupplementLog } from "@/lib/types/nutrition.types"

const NUTRITION_STORE_KEY = "one-percent-nutrition-store"

export class NutritionRepository {
  /**
   * Retrieves stored local state from persistent storage safely.
   */
  private getLocalState(): Record<string, unknown> {
    if (typeof window === "undefined") return {}
    try {
      const raw = localStorage.getItem(NUTRITION_STORE_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return parsed.state || {}
    } catch {
      return {}
    }
  }

  public getDailyLog(dateStr: string): DailyNutritionLog | null {
    const state = this.getLocalState()
    const logs = (state.dailyLogs as DailyNutritionLog[]) || []
    return logs.find((l) => l.date === dateStr) || null
  }

  public getCustomFoods(): FoodItem[] {
    const state = this.getLocalState()
    return (state.customFoods as FoodItem[]) || []
  }

  public getSavedMeals(): SavedMeal[] {
    const state = this.getLocalState()
    return (state.savedMeals as SavedMeal[]) || []
  }

  public getTargets(): NutritionTargets {
    const state = this.getLocalState()
    return (
      (state.targets as NutritionTargets) || {
        calories: 2500,
        protein: 180,
        carbs: 275,
        fat: 70,
        fiber: 35,
        waterMl: 3500,
      }
    )
  }

  public getSupplementLogs(dateStr: string): SupplementLog[] {
    const state = this.getLocalState()
    const logs = (state.supplementLogs as SupplementLog[]) || []
    return logs.filter((l) => l.date === dateStr)
  }
}

export const nutritionRepository = new NutritionRepository()
