import type { Timestamp } from "firebase/firestore"

// ─── Food Item ────────────────────────────────────────────────────
export interface FoodItem {
  id:          string
  userId?:     string           // Set if user created this food
  name:        string
  brand?:      string
  barcode?:    string

  // Macros per serving
  calories:    number           // kcal
  protein:     number           // grams
  carbs:       number           // grams
  fat:         number           // grams
  fiber?:      number           // grams

  // Serving details
  servingSize: number           // e.g. 100, 1
  servingUnit: ServingUnit      // e.g. "g", "ml", "serving", "oz"
  servingName?: string          // e.g. "scoop", "slice", "piece"

  isCustom:    boolean
  verified:    boolean          // Verified in global DB
  createdAt:   Timestamp
}

export type ServingUnit = "g" | "ml" | "serving" | "oz" | "lbs" | "piece"

// ─── Food Log Entry ───────────────────────────────────────────────
export interface LoggedFood {
  id:          string
  foodId:      string
  food?:       FoodItem         // Populated on read
  name:        string           // Snapshot of food name at log time
  mealType:    MealType

  // Amount logged
  quantity:    number           // Number of servings or units
  servingSize: number           // e.g. 100
  servingUnit: ServingUnit

  // Calculated macros based on quantity
  calories:    number
  protein:     number
  carbs:       number
  fat:         number
  fiber:       number

  loggedAt:    Timestamp
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

// ─── Daily Nutrition Log ──────────────────────────────────────────
export interface DailyNutritionLog {
  id:          string
  userId:      string
  date:        string           // "YYYY-MM-DD"
  foods:       LoggedFood[]

  // Totals computed
  totalCalories: number
  totalProtein:  number
  totalCarbs:    number
  totalFat:      number
  totalFiber:    number
  waterMl:       number          // Water intake in ml

  createdAt:   Timestamp
  updatedAt:   Timestamp
}

// ─── Saved Meal (Recipe / Template) ────────────────────────────────
export interface SavedMeal {
  id:          string
  userId:      string
  name:        string
  description?: string
  foods:       SavedMealFood[]

  // Totals
  calories:    number
  protein:     number
  carbs:       number
  fat:         number
  fiber:       number

  createdAt:   Timestamp
  updatedAt:   Timestamp
}

export interface SavedMealFood {
  foodId:      string
  name:        string
  quantity:    number
  servingSize: number
  servingUnit: ServingUnit
}

// ─── Nutrition Targets ────────────────────────────────────────────
export interface NutritionTargets {
  userId:      string
  calories:    number
  protein:     number           // grams
  carbs:       number           // grams
  fat:         number           // grams
  fiber:       number           // grams
  waterMl:     number
  updatedAt:   Timestamp
}
