"use client"

import { useState, useMemo } from "react"
import { Search, X, Star, Plus, Info } from "lucide-react"
import type { Exercise, Equipment } from "@/lib/types/training.types"
import type { MuscleGroup } from "@/lib/types/common.types"
import { cn } from "@/lib/utils/cn"
import { EXERCISE_LIBRARY } from "@/features/training/data/exercise-library.data"
import { useProgramsStore } from "../store/programs.store"
import { CustomExerciseModal } from "./CustomExerciseModal"
import { ExerciseDetailModal } from "./ExerciseDetailModal"

interface ExerciseSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
}

const MUSCLE_FILTER_OPTIONS: Array<{ label: string; value: MuscleGroup | "all" }> = [
  { label: "All Muscles", value: "all" },
  { label: "Chest", value: "chest" },
  { label: "Back", value: "back" },
  { label: "Shoulders", value: "shoulders" },
  { label: "Biceps", value: "biceps" },
  { label: "Triceps", value: "triceps" },
  { label: "Legs", value: "quads" },
  { label: "Abs / Core", value: "core" },
]

export function ExerciseSelector({ isOpen, onClose, onSelect }: ExerciseSelectorProps) {
  const { customExercises, favoriteExerciseIds, toggleFavoriteExercise } = useProgramsStore()

  const [search, setSearch] = useState("")
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "all">("all")
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | "all">("all")
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  // Sub-modals
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)

  // Combined library: Global + Custom
  const allExercises = useMemo(() => {
    return [...EXERCISE_LIBRARY, ...customExercises]
  }, [customExercises])

  // Filtered List
  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const q = search.toLowerCase()
      const matchSearch =
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroups.some((m: string) => m.toLowerCase().includes(q)) ||
        ex.aliases?.some((a: string) => a.toLowerCase().includes(q))

      const matchMuscle =
        selectedMuscle === "all" ||
        ex.muscleGroups.includes(selectedMuscle) ||
        ex.secondaryMuscles?.includes(selectedMuscle)

      const matchEquip = selectedEquipment === "all" || ex.equipment.includes(selectedEquipment)
      const matchFav = !onlyFavorites || favoriteExerciseIds.includes(ex.id)

      return matchSearch && matchMuscle && matchEquip && matchFav
    })
  }, [allExercises, search, selectedMuscle, selectedEquipment, onlyFavorites, favoriteExerciseIds])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="flex h-[85dvh] w-full max-w-xl flex-col rounded-xl border border-border-subtle bg-bg-surface shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle bg-bg-base/40 px-5 py-3.5">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
              Select Exercise
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="flex items-center gap-1 rounded-md bg-accent-gold/10 px-2.5 py-1 text-xs font-semibold text-accent-gold hover:bg-accent-gold/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Custom
              </button>
              <button
                onClick={onClose}
                className="rounded p-1 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="border-b border-border-subtle bg-bg-base/20 p-3 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-placeholder" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exercise by name or muscle..."
                className="w-full rounded-lg border border-border-subtle bg-bg-base/60 pl-9 pr-8 py-1.5 text-xs text-text-primary placeholder:text-text-placeholder focus:border-accent-gold focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-text-placeholder hover:text-text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Muscle Filter Pill Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={cn(
                  "flex items-center gap-1 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors border",
                  onlyFavorites
                    ? "bg-accent-gold/20 text-accent-gold border-accent-gold/40"
                    : "bg-bg-base/40 text-text-muted border-border-subtle/40 hover:text-text-primary"
                )}
              >
                <Star className={cn("h-3 w-3", onlyFavorites && "fill-accent-gold")} /> Favorites
              </button>
              {MUSCLE_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedMuscle(opt.value)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors border capitalize",
                    selectedMuscle === opt.value
                      ? "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/40 font-semibold"
                      : "bg-bg-base/40 text-text-muted border-border-subtle/40 hover:text-text-primary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-border-subtle/20">
            {filteredExercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <p className="text-xs text-text-muted">No exercises matched your search</p>
                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-accent-gold px-3.5 py-1.5 text-xs font-bold text-bg-base hover:bg-accent-gold-hover transition-colors"
                >
                  <Plus className="h-4 w-4" /> Create Custom Exercise
                </button>
              </div>
            ) : (
              filteredExercises.map((ex) => {
                const isFav = favoriteExerciseIds.includes(ex.id)
                return (
                  <div
                    key={ex.id}
                    onClick={() => {
                      onSelect(ex)
                      onClose()
                    }}
                    className="group flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-bg-base/60 cursor-pointer"
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary group-hover:text-accent-gold transition-colors">
                          {ex.name}
                        </span>
                        {ex.isCustom && (
                          <span className="rounded bg-accent-cyan/10 px-1.5 py-0.2 text-[10px] font-semibold text-accent-cyan uppercase">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ex.muscleGroups.map((m: string) => (
                          <span key={m} className="text-[10px] font-medium text-text-muted capitalize">
                            {m}
                          </span>
                        ))}
                        <span className="text-[10px] text-text-placeholder">•</span>
                        <span className="text-[10px] text-text-muted capitalize">
                          {ex.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetailExercise(ex)}
                        className="rounded p-1 text-text-placeholder hover:text-accent-cyan hover:bg-bg-base transition-colors"
                        title="View Exercise Details"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleFavoriteExercise(ex.id)}
                        className="rounded p-1 text-text-placeholder hover:text-accent-gold hover:bg-bg-base transition-colors"
                        title={isFav ? "Remove Favorite" : "Add Favorite"}
                      >
                        <Star className={cn("h-4 w-4", isFav && "fill-accent-gold text-accent-gold")} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Detail & Custom Creation Modals */}
      <ExerciseDetailModal
        exercise={detailExercise}
        isOpen={!!detailExercise}
        onClose={() => setDetailExercise(null)}
      />

      <CustomExerciseModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onCreated={(id) => {
          const created = customExercises.find((e) => e.id === id)
          if (created) {
            onSelect(created)
            onClose()
          }
        }}
      />
    </>
  )
}
