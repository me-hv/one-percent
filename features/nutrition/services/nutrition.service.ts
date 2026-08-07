import type { LoggedFood, DailyNutritionLog, NutritionTargets, FoodItem } from "@/lib/types/nutrition.types"

export interface CalculatedMealTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  potassium: number
  calcium: number
  iron: number
  vitaminD: number
}

/**
 * Calculates exact macros and micronutrients for a food log entry based on quantity.
 */
export function calculateLoggedFoodMacros(food: FoodItem, quantity: number): LoggedFood {
  const q = Math.max(0.1, quantity)
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    foodId: food.id,
    food,
    name: food.name,
    category: food.category,
    mealType: "snack", // default, caller overrides
    quantity: q,
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    calories: Math.round(food.calories * q),
    protein: Math.round(food.protein * q * 10) / 10,
    carbs: Math.round(food.carbs * q * 10) / 10,
    fat: Math.round(food.fat * q * 10) / 10,
    fiber: Math.round((food.fiber || 0) * q * 10) / 10,
    sugar: Math.round((food.sugar || 0) * q * 10) / 10,
    sodium: Math.round((food.sodium || 0) * q),
    potassium: Math.round((food.potassium || 0) * q),
    calcium: Math.round((food.calcium || 0) * q),
    iron: Math.round((food.iron || 0) * q * 10) / 10,
    vitaminD: Math.round((food.vitaminD || 0) * q * 10) / 10,
    loggedAt: new Date().toISOString(),
  }
}

/**
 * Aggregates daily nutrition log totals from array of logged foods.
 */
export function aggregateDailyTotals(foods: LoggedFood[], waterMl = 0): CalculatedMealTotals {
  return foods.reduce(
    (acc, f) => {
      acc.calories += f.calories || 0
      acc.protein += f.protein || 0
      acc.carbs += f.carbs || 0
      acc.fat += f.fat || 0
      acc.fiber += f.fiber || 0
      acc.sugar += f.sugar || 0
      acc.sodium += f.sodium || 0
      acc.potassium += f.potassium || 0
      acc.calcium += f.calcium || 0
      acc.iron += f.iron || 0
      acc.vitaminD += f.vitaminD || 0
      return acc
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      potassium: 0,
      calcium: 0,
      iron: 0,
      vitaminD: 0,
    }
  )
}

/**
 * Deterministically calculates a 0-100 Nutrition Score based on target adherence.
 * Factors: Protein Adherence (35%), Calorie Target Adherence (35%), Fiber Adherence (15%), Water Adherence (15%).
 */
export function calculateNutritionScore(
  log: DailyNutritionLog | null,
  targets: NutritionTargets,
  supplementAdherencePct = 100
): number {
  if (!log || log.foods.length === 0) return 0

  // Protein Score (0-35)
  const proteinRatio = Math.min(1.2, log.totalProtein / Math.max(1, targets.protein))
  const proteinScore = Math.min(35, Math.max(0, proteinRatio >= 0.9 && proteinRatio <= 1.1 ? 35 : proteinRatio * 30))

  // Calorie Score (0-35)
  const calorieDiffPct = Math.abs(log.totalCalories - targets.calories) / targets.calories
  const calorieScore = Math.max(0, 35 - calorieDiffPct * 35)

  // Fiber Score (0-15)
  const fiberRatio = Math.min(1.0, log.totalFiber / Math.max(1, targets.fiber))
  const fiberScore = fiberRatio * 15

  // Water Score (0-15)
  const waterRatio = Math.min(1.0, log.waterMl / Math.max(1, targets.waterMl))
  const waterScore = waterRatio * 15

  const baseScore = Math.round(proteinScore + calorieScore + fiberScore + waterScore)
  const finalScore = Math.round(baseScore * 0.9 + (supplementAdherencePct / 100) * 10)

  return Math.min(100, Math.max(0, finalScore))
}
