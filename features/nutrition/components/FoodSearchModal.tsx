"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Trash2, Edit2, Check, X, ShieldCheck, Flame } from "lucide-react"
import { SEEDED_FOOD_DATABASE } from "@/features/nutrition/data/food-database.seed"
import { useNutritionStore } from "@/features/nutrition/store/nutrition.store"
import type { FoodItem, MealType, FoodCategory, ServingUnit } from "@/lib/types/nutrition.types"
import { cn } from "@/lib/utils/cn"
import { toast } from "sonner"

interface FoodSearchModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDateStr: string
  defaultMealType?: MealType
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "protein", label: "Protein" },
  { id: "carbohydrates", label: "Carbs" },
  { id: "vegetables", label: "Vegetables" },
  { id: "fruit", label: "Fruit" },
  { id: "dairy", label: "Dairy" },
  { id: "healthy_fats", label: "Fats" },
  { id: "supplements", label: "Supplements" },
  { id: "custom", label: "My Custom" },
]

export function FoodSearchModal({
  isOpen,
  onClose,
  selectedDateStr,
  defaultMealType = "lunch",
}: FoodSearchModalProps) {
  const { customFoods, addLoggedFood, addCustomFood, deleteCustomFood } = useNutritionStore()

  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [targetMealType, setTargetMealType] = useState<MealType>(defaultMealType)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [quantity, setQuantity] = useState("1")
  const [showCreateCustom, setShowCreateCustom] = useState(false)

  // Custom food form state
  const [customName, setCustomName] = useState("")
  const [customCategory, setCustomCategory] = useState<FoodCategory>("protein")
  const [customCalories, setCustomCalories] = useState("150")
  const [customProtein, setCustomProtein] = useState("20")
  const [customCarbs, setCustomCarbs] = useState("10")
  const [customFat, setCustomFat] = useState("3")
  const [customServingSize, setCustomServingSize] = useState("100")
  const [customServingUnit, setCustomServingUnit] = useState<ServingUnit>("g")

  // Combine seeded DB and custom foods
  const allFoods = useMemo(() => {
    return [...customFoods, ...SEEDED_FOOD_DATABASE]
  }, [customFoods])

  // Filtered food list
  const filteredFoods = useMemo(() => {
    return allFoods.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return (
          item.name.toLowerCase().includes(q) ||
          (item.brand?.toLowerCase().includes(q) ?? false) ||
          item.category.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [allFoods, selectedCategory, query])

  if (!isOpen) return null

  const handleAddFoodToMeal = () => {
    if (!selectedFood) return
    const q = parseFloat(quantity) || 1
    addLoggedFood(selectedDateStr, selectedFood, q, targetMealType)
    toast.success(`Added ${selectedFood.name} to ${targetMealType.replace("_", " ")}`)
    setSelectedFood(null)
    setQuantity("1")
  }

  const handleCreateCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName.trim()) {
      toast.error("Please enter a food name")
      return
    }

    const created = addCustomFood({
      name: customName.trim(),
      category: customCategory,
      calories: parseFloat(customCalories) || 0,
      protein: parseFloat(customProtein) || 0,
      carbs: parseFloat(customCarbs) || 0,
      fat: parseFloat(customFat) || 0,
      servingSize: parseFloat(customServingSize) || 100,
      servingUnit: customServingUnit,
      verified: false,
    })

    toast.success(`Custom food "${created.name}" created!`)
    setShowCreateCustom(false)
    setCustomName("")
    setSelectedFood(created)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl card p-6 space-y-4 border border-accent/40 bg-bg-surface shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-accent" />
            <h3 className="text-base font-bold text-primary">Search Food Database</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input & Meal Type Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-placeholder" />
            <input
              type="text"
              placeholder="Search chicken, oats, rice, protein powder..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto font-mono text-xs">
            <span className="text-text-placeholder text-[10px] uppercase">Meal:</span>
            <select
              value={targetMealType}
              onChange={(e) => setTargetMealType(e.target.value as MealType)}
              className="h-9 px-3 rounded border border-border-default bg-bg-base text-primary focus:border-accent text-xs outline-none capitalize"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
              <option value="pre_workout">Pre-Workout</option>
              <option value="post_workout">Post-Workout</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex border-b border-border-subtle overflow-x-auto shrink-0 font-mono text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 transition-colors border-b-2 -mb-px shrink-0 text-[11px]",
                selectedCategory === cat.id ? "border-accent text-primary font-bold" : "border-transparent text-text-secondary hover:text-primary"
              )}
            >
              {cat.label}
            </button>
          ))}
          <button
            onClick={() => setShowCreateCustom(true)}
            className="ml-auto px-3 py-1 rounded bg-accent/15 text-accent hover:bg-accent/25 text-[11px] font-bold transition-colors shrink-0 flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Custom Food
          </button>
        </div>

        {/* Create Custom Food Form Modal */}
        {showCreateCustom && (
          <form onSubmit={handleCreateCustomSubmit} className="p-4 rounded border border-accent/40 bg-bg-base space-y-3 shrink-0 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="font-bold text-primary uppercase">Create Custom Food Item</span>
              <button type="button" onClick={() => setShowCreateCustom(false)} className="text-text-placeholder hover:text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Food Name (e.g. Home Protein Muffin)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="h-8 px-2 rounded border border-border-default bg-bg-surface text-primary outline-none font-sans"
              />
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as FoodCategory)}
                className="h-8 px-2 rounded border border-border-default bg-bg-surface text-primary outline-none"
              >
                <option value="protein">Protein</option>
                <option value="carbohydrates">Carbs</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruit">Fruit</option>
                <option value="dairy">Dairy</option>
                <option value="healthy_fats">Healthy Fats</option>
                <option value="supplements">Supplements</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div>
                <label className="text-text-placeholder block">Cal (kcal)</label>
                <input type="number" step="any" value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} className="w-full h-8 px-2 rounded border bg-bg-surface text-primary" />
              </div>
              <div>
                <label className="text-text-placeholder block">Protein (g)</label>
                <input type="number" step="any" value={customProtein} onChange={(e) => setCustomProtein(e.target.value)} className="w-full h-8 px-2 rounded border bg-bg-surface text-primary" />
              </div>
              <div>
                <label className="text-text-placeholder block">Carbs (g)</label>
                <input type="number" step="any" value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value)} className="w-full h-8 px-2 rounded border bg-bg-surface text-primary" />
              </div>
              <div>
                <label className="text-text-placeholder block">Fat (g)</label>
                <input type="number" step="any" value={customFat} onChange={(e) => setCustomFat(e.target.value)} className="w-full h-8 px-2 rounded border bg-bg-surface text-primary" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowCreateCustom(false)} className="px-3 h-7 rounded border text-text-secondary">Cancel</button>
              <button type="submit" className="px-3 h-7 rounded bg-accent text-bg-base font-bold">Save Custom Food</button>
            </div>
          </form>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {filteredFoods.map((item) => {
            const isSelected = selectedFood?.id === item.id
            return (
              <div
                key={item.id}
                onClick={() => setSelectedFood(item)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between font-mono text-xs",
                  isSelected
                    ? "border-accent bg-accent/10 text-primary"
                    : "border-border-subtle bg-bg-base/40 hover:border-border-default"
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary font-sans">{item.name}</span>
                    {item.isCustom && <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">Custom</span>}
                  </div>
                  <span className="text-[10px] text-text-placeholder block">
                    Serving: {item.servingSize}{item.servingUnit} ({item.servingName || "standard"})
                  </span>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="font-bold text-accent text-sm block">{item.calories} <span className="text-[9px] text-text-placeholder">kcal</span></span>
                    <span className="text-[10px] text-text-muted">
                      P: <strong>{item.protein}g</strong> · C: <strong>{item.carbs}g</strong> · F: <strong>{item.fat}g</strong>
                    </span>
                  </div>

                  {item.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCustomFood(item.id)
                      }}
                      className="p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Food Logging Controls */}
        {selectedFood && (
          <div className="p-4 rounded-xl border border-accent/40 bg-bg-surface space-y-3 shrink-0 font-mono text-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-text-placeholder uppercase block">Selected Food Item</span>
                <span className="font-bold text-primary text-sm font-sans">{selectedFood.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] text-text-placeholder">Servings:</label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-16 h-8 px-2 rounded border border-border-default bg-bg-base text-primary text-center font-bold"
                />
              </div>
            </div>

            {/* Calculated Macros Preview */}
            <div className="grid grid-cols-4 gap-2 text-center p-2 rounded bg-bg-base/60 border border-border-subtle">
              <div>
                <span className="text-[9px] text-text-placeholder block">Calories</span>
                <span className="font-bold text-accent">{Math.round(selectedFood.calories * (parseFloat(quantity) || 1))} kcal</span>
              </div>
              <div>
                <span className="text-[9px] text-text-placeholder block">Protein</span>
                <span className="font-bold text-primary">{Math.round(selectedFood.protein * (parseFloat(quantity) || 1) * 10) / 10}g</span>
              </div>
              <div>
                <span className="text-[9px] text-text-placeholder block">Carbs</span>
                <span className="font-bold text-primary">{Math.round(selectedFood.carbs * (parseFloat(quantity) || 1) * 10) / 10}g</span>
              </div>
              <div>
                <span className="text-[9px] text-text-placeholder block">Fat</span>
                <span className="font-bold text-primary">{Math.round(selectedFood.fat * (parseFloat(quantity) || 1) * 10) / 10}g</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-border-subtle">
              <button onClick={() => setSelectedFood(null)} className="h-8 px-3 rounded border text-text-secondary">Cancel</button>
              <button onClick={handleAddFoodToMeal} className="h-8 px-5 rounded bg-accent text-bg-base font-bold flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Add to {targetMealType.replace("_", " ")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
