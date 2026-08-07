import type { Timestamp } from "firebase/firestore"

export type FoodCategory =
  | "protein"
  | "carbohydrates"
  | "vegetables"
  | "fruit"
  | "dairy"
  | "healthy_fats"
  | "fast_food"
  | "supplements"
  | "custom"

export type ServingUnit = "g" | "ml" | "serving" | "oz" | "lbs" | "piece" | "cup" | "tbsp" | "tsp"

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "pre_workout" | "post_workout"

// ─── Food Item ────────────────────────────────────────────────────
export interface FoodItem {
  id:          string
  userId?:     string           // Set if user created custom food
  name:        string
  brand?:      string
  barcode?:    string
  category:    FoodCategory

  // Macros per serving
  calories:    number           // kcal
  protein:     number           // grams
  carbs:       number           // grams
  fat:         number           // grams
  fiber?:      number           // grams
  sugar?:      number           // grams

  // Micronutrients per serving
  sodium?:     number           // mg
  potassium?:  number           // mg
  calcium?:    number           // mg
  iron?:       number           // mg
  vitaminD?:   number           // IU / mcg

  // Serving details
  servingSize: number           // e.g. 100, 1
  servingUnit: ServingUnit      // e.g. "g", "ml", "serving"
  servingName?: string          // e.g. "scoop", "slice", "piece"

  isCustom:    boolean
  verified:    boolean          // Verified in global DB
  isFavorite?: boolean
  usageCount?: number
  createdAt?:  Timestamp
  schemaVersion?: number
}

// ─── Food Log Entry ───────────────────────────────────────────────
export interface LoggedFood {
  id:          string
  foodId:      string
  food?:       FoodItem
  name:        string           // Snapshot of food name
  category?:   FoodCategory
  mealType:    MealType

  // Amount logged
  quantity:    number           // Multiplier (e.g. 1.5 servings)
  servingSize: number
  servingUnit: ServingUnit

  // Calculated macros based on quantity
  calories:    number
  protein:     number
  carbs:       number
  fat:         number
  fiber:       number
  sugar?:      number

  // Calculated micronutrients
  sodium?:     number
  potassium?:  number
  calcium?:    number
  iron?:       number
  vitaminD?:   number

  loggedAt:    string           // ISO string or YYYY-MM-DD
}

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
  totalSugar?:   number

  // Micronutrient totals
  totalSodium?:    number
  totalPotassium?: number
  totalCalcium?:   number
  totalIron?:      number
  totalVitaminD?:  number

  waterMl:       number          // Water intake in ml

  createdAt?:    Timestamp
  updatedAt?:    Timestamp
  schemaVersion?: number
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

  createdAt?:  Timestamp
  updatedAt?:  Timestamp
  schemaVersion?: number
}

export interface SavedMealFood {
  foodId:      string
  name:        string
  quantity:    number
  servingSize: number
  servingUnit: ServingUnit
  calories:    number
  protein:     number
  carbs:       number
  fat:         number
}

// ─── Nutrition Targets ────────────────────────────────────────────
export interface NutritionTargets {
  userId?:     string
  calories:    number
  protein:     number           // grams
  carbs:       number           // grams
  fat:         number           // grams
  fiber:       number           // grams
  waterMl:     number           // ml
  updatedAt?:  Timestamp
  schemaVersion?: number
}

// ─── Supplement Tracking Models ───────────────────────────────────
export interface SupplementItem {
  id:          string
  name:        string           // e.g. "Creatine Monohydrate", "Whey Protein"
  dosage:      string           // e.g. "5g", "1 scoop (30g)", "2000 IU"
  timing:      string           // e.g. "Morning", "Pre-Workout", "Post-Workout"
  isCustom?:   boolean
}

export interface SupplementLog {
  id:          string
  userId:      string
  date:        string           // "YYYY-MM-DD"
  supplementId: string
  taken:       boolean
  takenAt?:    string
}
