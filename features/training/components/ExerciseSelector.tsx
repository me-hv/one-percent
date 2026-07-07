"use client"

import { useState, useMemo } from "react"
import { Search, X, Check, Star, Plus } from "lucide-react"
import type { Exercise, ExerciseCategory, Equipment } from "@/lib/types/training.types"
import type { MuscleGroup } from "@/lib/types/common.types"
import { cn } from "@/lib/utils/cn"
import { EXERCISE_LIBRARY } from "@/features/training/data/exercise-library.data"

interface ExerciseSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
}

// Use the shared exercise library — no duplicate static list needed
const GLOBAL_EXERCISES: Exercise[] = EXERCISE_LIBRARY

export function ExerciseSelector({ isOpen, onClose, onSelect }: ExerciseSelectorProps) {
  const [search, setSearch] = useState("")
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "all">("all")
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | "all">("all")
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["ex-1", "ex-2", "ex-3"]))

  // Custom Exercise Creation Sub-states
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>("barbell")
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>("chest")

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(favorites)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setFavorites(next)
  }

  // ─── Filter List Execution ───────────────────────────────────────
  const filteredExercises = useMemo(() => {
    return GLOBAL_EXERCISES.filter((ex) => {
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
      const matchMuscle = selectedMuscle === "all" || ex.muscleGroups.includes(selectedMuscle)
      const matchEquip = selectedEquipment === "all" || ex.equipment.includes(selectedEquipment)
      return matchSearch && matchMuscle && matchEquip
    })
  }, [search, selectedMuscle, selectedEquipment])

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName.trim()) return

    const newEx: Exercise = {
      id: `custom-${Math.random().toString(36).substring(2, 9)}`,
      name: customName,
      category: customCategory,
      muscleGroups: [customMuscle],
      equipment: ["none"],
      isCustom: true,
    }

    onSelect(newEx)
    setShowCustomForm(false)
    setCustomName("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/85 backdrop-blur-sm p-4">
      <div className="flex h-[80dvh] w-full max-w-lg flex-col rounded-xl border border-border-default bg-bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-bg-base/30 px-5 py-3.5">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">
            {showCustomForm ? "Create Custom Exercise" : "Select Exercise"}
          </h3>
          <button
            onClick={() => {
              setShowCustomForm(false)
              onClose()
            }}
            className="rounded p-1 hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showCustomForm ? (
          /* Custom Exercise Creation form */
          <form onSubmit={handleCreateCustom} className="flex-1 p-5 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">
                Exercise Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Incline Cable Fly"
                className="w-full h-10 px-3 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-sm outline-none"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">
                  Primary Muscle
                </label>
                <select
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value as MuscleGroup)}
                  className="w-full h-10 px-2 rounded border border-border-default bg-bg-base text-primary text-sm outline-none"
                >
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="quads">Quads</option>
                  <option value="hamstrings">Hamstrings</option>
                  <option value="glutes">Glutes</option>
                  <option value="biceps">Biceps</option>
                  <option value="triceps">Triceps</option>
                  <option value="core">Core</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">
                  Category Type
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as ExerciseCategory)}
                  className="w-full h-10 px-2 rounded border border-border-default bg-bg-base text-primary text-sm outline-none"
                >
                  <option value="barbell">Barbell</option>
                  <option value="dumbbell">Dumbbell</option>
                  <option value="machine">Machine</option>
                  <option value="cable">Cable</option>
                  <option value="bodyweight">Bodyweight</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="flex-1 h-10 rounded border border-border-default hover:bg-bg-elevated text-primary text-xs font-semibold"
              >
                Back to Library
              </button>
              <button
                type="submit"
                className="flex-1 h-10 rounded bg-accent text-bg-base hover:bg-accent-hover font-bold text-xs"
              >
                Create & Add
              </button>
            </div>
          </form>
        ) : (
          /* Standard Search Library content */
          <>
            {/* Search and Filters */}
            <div className="p-4 border-b border-border-subtle space-y-3 bg-bg-base/10">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-text-placeholder" />
                <input
                  type="text"
                  placeholder="Search exercise database..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none transition-all"
                />
              </div>

              {/* Selection Filter dials */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <select
                  value={selectedMuscle}
                  onChange={(e) => setSelectedMuscle(e.target.value as any)}
                  className="h-8 px-2 rounded border border-border-subtle bg-bg-base text-primary outline-none"
                >
                  <option value="all">All Muscles</option>
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="quads">Quads</option>
                  <option value="hamstrings">Hamstrings</option>
                  <option value="biceps">Biceps</option>
                  <option value="triceps">Triceps</option>
                  <option value="core">Core</option>
                </select>

                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value as any)}
                  className="h-8 px-2 rounded border border-border-subtle bg-bg-base text-primary outline-none"
                >
                  <option value="all">All Equipment</option>
                  <option value="barbell">Barbell</option>
                  <option value="dumbbell">Dumbbell</option>
                  <option value="cable">Cable</option>
                  <option value="pullup_bar">Bars / Pulley</option>
                  <option value="none">Bodyweight</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/40">
              {filteredExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <span className="text-xs text-text-placeholder">
                    No matching exercises in global library.
                  </span>
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-bg-elevated hover:bg-bg-base text-primary border border-border-default text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Custom Exercise
                  </button>
                </div>
              ) : (
                filteredExercises.map((ex) => {
                  const isFav = favorites.has(ex.id)

                  return (
                    <div
                      key={ex.id}
                      onClick={() => {
                        onSelect(ex)
                        onClose()
                      }}
                      className="flex items-center justify-between px-5 py-3 hover:bg-bg-elevated/20 cursor-pointer transition-colors"
                    >
                      <div className="text-left">
                        <span className="text-xs font-semibold text-primary block">
                          {ex.name}
                        </span>
                        <span className="text-[10px] text-text-placeholder capitalize font-mono mt-0.5 block">
                          {ex.category} · {ex.muscleGroups.join(", ")}
                        </span>
                      </div>

                      <button
                        onClick={(e) => toggleFavorite(ex.id, e)}
                        className={cn(
                          "p-1.5 rounded hover:bg-bg-elevated transition-colors",
                          isFav ? "text-warning" : "text-text-placeholder"
                        )}
                        title={isFav ? "Remove favorite" : "Add to favorites"}
                      >
                        <Star className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer custom addition action */}
            <div className="p-3 bg-bg-base/30 border-t border-border-subtle text-center">
              <button
                onClick={() => setShowCustomForm(true)}
                className="text-xs text-text-placeholder hover:text-accent font-semibold transition-colors"
              >
                + Create new custom movement
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
export default ExerciseSelector
