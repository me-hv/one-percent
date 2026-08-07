import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type {
  DailyNutritionLog,
  LoggedFood,
  FoodItem,
  SavedMeal,
  NutritionTargets,
  MealType,
  SupplementLog,
  SupplementItem,
} from "@/lib/types/nutrition.types"
import { calculateLoggedFoodMacros, aggregateDailyTotals } from "@/features/nutrition/services/nutrition.service"
import { formatDateKey, subDays } from "@/lib/utils/date"

interface NutritionState {
  dailyLogs: DailyNutritionLog[]
  customFoods: FoodItem[]
  savedMeals: SavedMeal[]
  targets: NutritionTargets
  supplementLogs: SupplementLog[]
  customSupplements: SupplementItem[]

  // Store actions
  addLoggedFood: (dateStr: string, food: FoodItem, quantity: number, mealType: MealType) => void
  removeLoggedFood: (dateStr: string, logId: string) => void
  updateLoggedFoodQuantity: (dateStr: string, logId: string, quantity: number) => void
  addWater: (dateStr: string, amountMl: number) => void
  setWater: (dateStr: string, totalMl: number) => void
  toggleSupplementLog: (dateStr: string, supplementId: string) => void
  addCustomFood: (food: Omit<FoodItem, "id" | "isCustom">) => FoodItem
  deleteCustomFood: (id: string) => void
  updateTargets: (newTargets: Partial<NutritionTargets>) => void
  copyYesterdayMeals: (dateStr: string) => void
  saveMealAsTemplate: (name: string, foods: LoggedFood[]) => void
  getDailyLog: (dateStr: string) => DailyNutritionLog
}

const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2500,
  protein: 180,
  carbs: 275,
  fat: 70,
  fiber: 35,
  waterMl: 3500,
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      dailyLogs: [],
      customFoods: [],
      savedMeals: [],
      targets: DEFAULT_TARGETS,
      supplementLogs: [],
      customSupplements: [],

      getDailyLog: (dateStr: string) => {
        const { dailyLogs } = get()
        const existing = dailyLogs.find((l) => l.date === dateStr)
        if (existing) return existing

        return {
          id: `log-${dateStr}`,
          userId: "current-user",
          date: dateStr,
          foods: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          waterMl: 0,
        }
      },

      addLoggedFood: (dateStr, food, quantity, mealType) => {
        set((state) => {
          const logs = [...state.dailyLogs]
          let dailyLog = logs.find((l) => l.date === dateStr)

          if (!dailyLog) {
            dailyLog = {
              id: `log-${dateStr}`,
              userId: "current-user",
              date: dateStr,
              foods: [],
              totalCalories: 0,
              totalProtein: 0,
              totalCarbs: 0,
              totalFat: 0,
              totalFiber: 0,
              waterMl: 0,
            }
            logs.push(dailyLog)
          }

          const loggedFood: LoggedFood = {
            ...calculateLoggedFoodMacros(food, quantity),
            mealType,
            loggedAt: dateStr,
          }

          const updatedFoods = [...dailyLog.foods, loggedFood]
          const totals = aggregateDailyTotals(updatedFoods, dailyLog.waterMl)

          const updatedLog: DailyNutritionLog = {
            ...dailyLog,
            foods: updatedFoods,
            totalCalories: totals.calories,
            totalProtein: totals.protein,
            totalCarbs: totals.carbs,
            totalFat: totals.fat,
            totalFiber: totals.fiber,
            totalSugar: totals.sugar,
            totalSodium: totals.sodium,
            totalPotassium: totals.potassium,
            totalCalcium: totals.calcium,
            totalIron: totals.iron,
            totalVitaminD: totals.vitaminD,
          }

          return {
            dailyLogs: logs.map((l) => (l.date === dateStr ? updatedLog : l)),
          }
        })
      },

      removeLoggedFood: (dateStr, logId) => {
        set((state) => {
          const logs = [...state.dailyLogs]
          const dailyLog = logs.find((l) => l.date === dateStr)
          if (!dailyLog) return state

          const updatedFoods = dailyLog.foods.filter((f) => f.id !== logId)
          const totals = aggregateDailyTotals(updatedFoods, dailyLog.waterMl)

          const updatedLog: DailyNutritionLog = {
            ...dailyLog,
            foods: updatedFoods,
            totalCalories: totals.calories,
            totalProtein: totals.protein,
            totalCarbs: totals.carbs,
            totalFat: totals.fat,
            totalFiber: totals.fiber,
          }

          return {
            dailyLogs: logs.map((l) => (l.date === dateStr ? updatedLog : l)),
          }
        })
      },

      updateLoggedFoodQuantity: (dateStr, logId, quantity) => {
        set((state) => {
          const logs = [...state.dailyLogs]
          const dailyLog = logs.find((l) => l.date === dateStr)
          if (!dailyLog) return state

          const updatedFoods = dailyLog.foods.map((f) => {
            if (f.id !== logId || !f.food) return f
            return {
              ...calculateLoggedFoodMacros(f.food, quantity),
              id: f.id,
              mealType: f.mealType,
              loggedAt: f.loggedAt,
            }
          })

          const totals = aggregateDailyTotals(updatedFoods, dailyLog.waterMl)

          const updatedLog: DailyNutritionLog = {
            ...dailyLog,
            foods: updatedFoods,
            totalCalories: totals.calories,
            totalProtein: totals.protein,
            totalCarbs: totals.carbs,
            totalFat: totals.fat,
            totalFiber: totals.fiber,
          }

          return {
            dailyLogs: logs.map((l) => (l.date === dateStr ? updatedLog : l)),
          }
        })
      },

      addWater: (dateStr, amountMl) => {
        set((state) => {
          const logs = [...state.dailyLogs]
          let dailyLog = logs.find((l) => l.date === dateStr)

          if (!dailyLog) {
            dailyLog = {
              id: `log-${dateStr}`,
              userId: "current-user",
              date: dateStr,
              foods: [],
              totalCalories: 0,
              totalProtein: 0,
              totalCarbs: 0,
              totalFat: 0,
              totalFiber: 0,
              waterMl: Math.max(0, amountMl),
            }
            logs.push(dailyLog)
          } else {
            dailyLog = {
              ...dailyLog,
              waterMl: Math.max(0, dailyLog.waterMl + amountMl),
            }
          }

          return {
            dailyLogs: logs.map((l) => (l.date === dateStr ? dailyLog! : l)),
          }
        })
      },

      setWater: (dateStr, totalMl) => {
        set((state) => {
          const logs = [...state.dailyLogs]
          let dailyLog = logs.find((l) => l.date === dateStr)
          if (!dailyLog) {
            dailyLog = {
              id: `log-${dateStr}`,
              userId: "current-user",
              date: dateStr,
              foods: [],
              totalCalories: 0,
              totalProtein: 0,
              totalCarbs: 0,
              totalFat: 0,
              totalFiber: 0,
              waterMl: Math.max(0, totalMl),
            }
            logs.push(dailyLog)
          } else {
            dailyLog = { ...dailyLog, waterMl: Math.max(0, totalMl) }
          }
          return { dailyLogs: logs.map((l) => (l.date === dateStr ? dailyLog! : l)) }
        })
      },

      toggleSupplementLog: (dateStr, supplementId) => {
        set((state) => {
          const existing = state.supplementLogs.find((l) => l.date === dateStr && l.supplementId === supplementId)
          if (existing) {
            return {
              supplementLogs: state.supplementLogs.map((l) =>
                l.date === dateStr && l.supplementId === supplementId ? { ...l, taken: !l.taken } : l
              ),
            }
          } else {
            const newLog: SupplementLog = {
              id: `supp-log-${Date.now()}`,
              userId: "current-user",
              date: dateStr,
              supplementId,
              taken: true,
              takenAt: new Date().toISOString(),
            }
            return { supplementLogs: [...state.supplementLogs, newLog] }
          }
        })
      },

      addCustomFood: (food) => {
        const newFood: FoodItem = {
          ...food,
          id: `custom-food-${Date.now()}`,
          isCustom: true,
          verified: false,
        }
        set((state) => ({ customFoods: [newFood, ...state.customFoods] }))
        return newFood
      },

      deleteCustomFood: (id) => {
        set((state) => ({ customFoods: state.customFoods.filter((f) => f.id !== id) }))
      },

      updateTargets: (newTargets) => {
        set((state) => ({ targets: { ...state.targets, ...newTargets } }))
      },

      copyYesterdayMeals: (dateStr) => {
        const yesterdayStr = formatDateKey(subDays(new Date(dateStr), 1))
        const { dailyLogs } = get()
        const yesterdayLog = dailyLogs.find((l) => l.date === yesterdayStr)
        if (!yesterdayLog || yesterdayLog.foods.length === 0) return

        set((state) => {
          const logs = [...state.dailyLogs]
          let todayLog = logs.find((l) => l.date === dateStr)

          const copiedFoods: LoggedFood[] = yesterdayLog.foods.map((f) => ({
            ...f,
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            loggedAt: dateStr,
          }))

          if (!todayLog) {
            todayLog = {
              id: `log-${dateStr}`,
              userId: "current-user",
              date: dateStr,
              foods: copiedFoods,
              totalCalories: yesterdayLog.totalCalories,
              totalProtein: yesterdayLog.totalProtein,
              totalCarbs: yesterdayLog.totalCarbs,
              totalFat: yesterdayLog.totalFat,
              totalFiber: yesterdayLog.totalFiber,
              waterMl: 0,
            }
            logs.push(todayLog)
          } else {
            const updatedFoods = [...todayLog.foods, ...copiedFoods]
            const totals = aggregateDailyTotals(updatedFoods, todayLog.waterMl)
            todayLog = {
              ...todayLog,
              foods: updatedFoods,
              totalCalories: totals.calories,
              totalProtein: totals.protein,
              totalCarbs: totals.carbs,
              totalFat: totals.fat,
              totalFiber: totals.fiber,
            }
          }

          return { dailyLogs: logs.map((l) => (l.date === dateStr ? todayLog! : l)) }
        })
      },

      saveMealAsTemplate: (name, foods) => {
        const totals = aggregateDailyTotals(foods, 0)
        const newMeal: SavedMeal = {
          id: `meal-template-${Date.now()}`,
          userId: "current-user",
          name,
          foods: foods.map((f) => ({
            foodId: f.foodId,
            name: f.name,
            quantity: f.quantity,
            servingSize: f.servingSize,
            servingUnit: f.servingUnit,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
          })),
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          fiber: totals.fiber,
        }

        set((state) => ({ savedMeals: [newMeal, ...state.savedMeals] }))
      },
    }),
    {
      name: "one-percent-nutrition-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
