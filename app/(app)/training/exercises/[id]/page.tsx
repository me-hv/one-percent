"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Star, Dumbbell, BookOpen, Lightbulb, AlertTriangle } from "lucide-react"
import { findExerciseById } from "@/features/training/data/exercise-library.data"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { ROUTES } from "@/lib/constants/ROUTES"
import { cn } from "@/lib/utils/cn"

interface Props {
  params: Promise<{ id: string }>
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: "bg-red-500/15 text-red-400 border-red-500/25",
  back: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  lats: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  shoulders: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  biceps: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  triceps: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  core: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  quads: "bg-green-500/15 text-green-400 border-green-500/25",
  hamstrings: "bg-teal-500/15 text-teal-400 border-teal-500/25",
  glutes: "bg-pink-500/15 text-pink-400 border-pink-500/25",
  calves: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  traps: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  forearms: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  cardio: "bg-red-500/15 text-red-500 border-red-500/25",
}

export default function ExerciseDetailPage({ params }: Props) {
  const { id } = use(params)
  const { favoriteExerciseIds, toggleFavoriteExercise } = useProgramsStore()

  // Try library first; fallback to not-found state
  const exercise = findExerciseById(id)
  const isFav = favoriteExerciseIds.includes(id)

  if (!exercise) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <h3 className="text-lg font-semibold text-primary">Exercise not found</h3>
        <Link href={ROUTES.training.exercises} className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-accent text-bg-base font-bold text-xs">
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </Link>
      </div>
    )
  }

  const primaryMuscleColor = MUSCLE_COLORS[exercise.muscleGroups[0] ?? ""] ?? "bg-bg-elevated text-text-placeholder border-border-subtle"

  return (
    <div className="page-container space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href={ROUTES.training.exercises} className="p-2 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-text-placeholder">
                {exercise.category.replace("_", " ")} · {exercise.mechanics ?? ""}
              </span>
            </div>
            <h2 className="page-title">{exercise.name}</h2>
            {exercise.aliases && exercise.aliases.length > 0 && (
              <p className="text-xs text-text-placeholder mt-1">
                Also known as: {exercise.aliases.join(", ")}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => toggleFavoriteExercise(id)}
          className={cn(
            "p-2 rounded border transition-colors flex-shrink-0 mt-1",
            isFav
              ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
              : "border-border-subtle text-text-placeholder hover:text-yellow-400 hover:border-yellow-500/30"
          )}
        >
          <Star className={cn("h-4 w-4", isFav && "fill-current")} />
        </button>
      </div>

      {/* Muscle Groups */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-5 space-y-4">
        <h3 className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Muscles Targeted</h3>

        <div className="space-y-3">
          <div>
            <span className="text-[9px] font-mono text-text-placeholder uppercase tracking-wider mb-1.5 block">Primary</span>
            <div className="flex flex-wrap gap-2">
              {exercise.muscleGroups.map((m) => (
                <span
                  key={m}
                  className={cn("px-2.5 py-1 rounded-md border text-xs font-medium capitalize", MUSCLE_COLORS[m] ?? "bg-bg-elevated text-text-placeholder border-border-subtle")}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
            <div>
              <span className="text-[9px] font-mono text-text-placeholder uppercase tracking-wider mb-1.5 block">Secondary</span>
              <div className="flex flex-wrap gap-2">
                {exercise.secondaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="px-2.5 py-1 rounded-md border border-border-subtle text-xs text-text-secondary capitalize"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border-subtle/50">
          <div>
            <span className="text-[9px] font-mono text-text-placeholder uppercase tracking-wider block mb-1">Movement</span>
            <span className="text-xs text-primary capitalize">{exercise.movementPattern ?? "—"}</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-text-placeholder uppercase tracking-wider block mb-1">Level</span>
            <span className="text-xs text-primary capitalize">{exercise.difficulty ?? "—"}</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-text-placeholder uppercase tracking-wider block mb-1">Equipment</span>
            <span className="text-xs text-primary capitalize">{exercise.equipment.join(", ").replace(/_/g, " ")}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {exercise.instructions && (
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-text-placeholder" />
            <h3 className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">How To Perform</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{exercise.instructions}</p>
        </div>
      )}

      {/* Tips */}
      {exercise.tips && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            <h3 className="text-[10px] font-mono tracking-widest text-accent uppercase">Pro Tips</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{exercise.tips}</p>
        </div>
      )}

      {/* Common Mistakes */}
      {exercise.commonMistakes && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-[10px] font-mono tracking-widest text-warning uppercase">Common Mistakes</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{exercise.commonMistakes}</p>
        </div>
      )}

      {/* Tags */}
      {exercise.tags && exercise.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {exercise.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border border-border-subtle text-text-placeholder"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
