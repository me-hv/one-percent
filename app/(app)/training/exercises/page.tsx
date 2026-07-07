"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  SlidersHorizontal,
  Star,
  ChevronRight,
  Dumbbell,
  Plus,
  X,
  Filter,
} from "lucide-react"
import {
  EXERCISE_LIBRARY,
  searchExercises,
  filterExercises,
} from "@/features/training/data/exercise-library.data"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { ROUTES } from "@/lib/constants/ROUTES"
import { cn } from "@/lib/utils/cn"
import type { MuscleGroup } from "@/lib/types/common.types"
import type { Equipment, ExerciseCategory } from "@/lib/types/training.types"

const MUSCLE_GROUPS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "lats", label: "Lats" },
  { value: "shoulders", label: "Shoulders" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "core", label: "Core" },
  { value: "quads", label: "Quads" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "glutes", label: "Glutes" },
  { value: "calves", label: "Calves" },
  { value: "traps", label: "Traps" },
  { value: "forearms", label: "Forearms" },
  { value: "cardio", label: "Cardio" },
]

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "All Equipment" },
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "cable", label: "Cable" },
  { value: "machine", label: "Machine" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "cardio", label: "Cardio" },
]

const DIFFICULTIES = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

const MUSCLE_COLORS: Record<string, string> = {
  chest: "text-red-400",
  back: "text-blue-400",
  lats: "text-blue-400",
  shoulders: "text-purple-400",
  biceps: "text-amber-400",
  triceps: "text-orange-400",
  core: "text-yellow-400",
  quads: "text-green-400",
  hamstrings: "text-teal-400",
  glutes: "text-pink-400",
  calves: "text-cyan-400",
  traps: "text-indigo-400",
  forearms: "text-orange-300",
  cardio: "text-red-500",
}

export default function ExercisesPage() {
  const { favoriteExerciseIds, toggleFavoriteExercise } = useProgramsStore()

  const [query, setQuery] = useState("")
  const [muscle, setMuscle] = useState("all")
  const [category, setCategory] = useState("all")
  const [difficulty, setDifficulty] = useState("all")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const results = useMemo(() => {
    let ex = query ? searchExercises(query) : EXERCISE_LIBRARY
    ex = filterExercises(ex, { muscle, equipment: category, difficulty })
    if (showFavoritesOnly) ex = ex.filter((e) => favoriteExerciseIds.includes(e.id))
    return ex
  }, [query, muscle, category, difficulty, showFavoritesOnly, favoriteExerciseIds])

  const activeFilterCount = [
    muscle !== "all",
    category !== "all",
    difficulty !== "all",
  ].filter(Boolean).length

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="page-title">Exercise Library</h2>
          <p className="text-sm text-text-secondary mt-1">
            {EXERCISE_LIBRARY.length} exercises · tap to view details and history
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-placeholder" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded border border-border-default bg-bg-surface text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none transition-colors"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-2 text-text-placeholder hover:text-primary">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "h-9 px-3 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors",
            showFilters || activeFilterCount > 0
              ? "border-accent text-accent bg-accent/10"
              : "border-border-default text-text-secondary hover:text-primary hover:bg-bg-elevated"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-accent text-bg-base rounded-full w-4 h-4 text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={cn(
            "h-9 px-3 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors",
            showFavoritesOnly
              ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
              : "border-border-default text-text-secondary hover:text-primary hover:bg-bg-elevated"
          )}
        >
          <Star className={cn("h-3.5 w-3.5", showFavoritesOnly && "fill-current")} />
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Muscle */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Muscle Group</span>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMuscle(m.value)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium border transition-colors",
                    muscle === m.value
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border-subtle text-text-placeholder hover:border-border-default hover:text-primary"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment / Category */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Equipment</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium border transition-colors",
                    category === c.value
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border-subtle text-text-placeholder hover:border-border-default hover:text-primary"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Level</span>
            <div className="flex gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium border transition-colors",
                    difficulty === d.value
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border-subtle text-text-placeholder hover:border-border-default hover:text-primary"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => { setMuscle("all"); setCategory("all"); setDifficulty("all") }}
              className="text-[10px] font-mono text-text-placeholder hover:text-primary underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Muscle group quick-filter pills (horizontal scroll) */}
      {!showFilters && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMuscle(m.value)}
              className={cn(
                "flex-shrink-0 px-3 h-7 rounded-full border text-[10px] font-medium transition-colors",
                muscle === m.value
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border-subtle text-text-placeholder hover:border-border-default hover:text-primary"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div>
        <p className="text-[10px] font-mono tracking-wider text-text-placeholder uppercase mb-3">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </p>

        {results.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Dumbbell className="h-8 w-8 text-text-placeholder mx-auto" />
            <p className="text-sm text-text-secondary">No exercises match your search.</p>
            <button
              onClick={() => { setQuery(""); setMuscle("all"); setCategory("all"); setDifficulty("all") }}
              className="text-xs text-accent hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {results.map((exercise) => {
              const isFav = favoriteExerciseIds.includes(exercise.id)
              const primaryMuscle = exercise.muscleGroups[0] ?? "core"
              const muscleColor = MUSCLE_COLORS[primaryMuscle] ?? "text-text-placeholder"

              return (
                <div key={exercise.id} className="group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-border-subtle hover:bg-bg-surface transition-all duration-100">
                  <Link
                    href={ROUTES.training.exercise(exercise.id)}
                    className="flex-1 flex items-center gap-3 overflow-hidden min-w-0"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-bg-elevated border border-border-subtle">
                      <Dumbbell className={cn("h-4 w-4", muscleColor)} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary truncate">{exercise.name}</span>
                        {exercise.mechanics === "compound" && (
                          <span className="text-[8px] font-mono uppercase tracking-wider text-text-placeholder border border-border-subtle px-1 py-0.5 rounded flex-shrink-0">
                            Compound
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-text-placeholder">
                        <span className={cn("capitalize", muscleColor)}>{primaryMuscle}</span>
                        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                          <span className="capitalize">&middot; {exercise.secondaryMuscles.slice(0, 2).join(", ")}</span>
                        )}
                        <span className="ml-auto capitalize">{exercise.category.replace("_", " ")}</span>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => toggleFavoriteExercise(exercise.id)}
                    className={cn(
                      "p-1.5 rounded transition-colors flex-shrink-0",
                      isFav ? "text-yellow-400" : "text-text-placeholder opacity-0 group-hover:opacity-100 hover:text-yellow-400"
                    )}
                  >
                    <Star className={cn("h-4 w-4", isFav && "fill-current")} />
                  </button>

                  <Link href={ROUTES.training.exercise(exercise.id)} className="p-1.5 rounded text-text-placeholder opacity-0 group-hover:opacity-100 hover:text-primary transition-all flex-shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
