"use client"

import { X, Star, Dumbbell, Target, AlertTriangle, Lightbulb, Trophy } from "lucide-react"
import type { Exercise } from "@/lib/types/training.types"
import { useProgramsStore } from "../store/programs.store"
import { cn } from "@/lib/utils/cn"

interface ExerciseDetailModalProps {
  exercise: Exercise | null
  isOpen: boolean
  onClose: () => void
}

export function ExerciseDetailModal({ exercise, isOpen, onClose }: ExerciseDetailModalProps) {
  const { toggleFavoriteExercise, isFavoriteExercise } = useProgramsStore()

  if (!isOpen || !exercise) return null

  const isFav = isFavoriteExercise(exercise.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border-subtle bg-bg-surface p-6 shadow-2xl space-y-6">
        {/* Close & Favorite header actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-accent-gold/10 px-2.5 py-0.5 text-xs font-semibold text-accent-gold capitalize">
                {exercise.category}
              </span>
              {exercise.difficulty && (
                <span className="rounded-full bg-border-subtle/40 px-2.5 py-0.5 text-xs font-medium text-text-muted capitalize">
                  {exercise.difficulty}
                </span>
              )}
              {exercise.mechanics && (
                <span className="rounded-full bg-border-subtle/40 px-2.5 py-0.5 text-xs font-medium text-text-muted capitalize">
                  {exercise.mechanics}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">{exercise.name}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavoriteExercise(exercise.id)}
              className={cn(
                "rounded-lg p-2 transition-colors border border-border-subtle/60",
                isFav
                  ? "bg-accent-gold/10 text-accent-gold border-accent-gold/30"
                  : "bg-bg-base/40 text-text-muted hover:text-text-primary hover:bg-bg-base"
              )}
              title={isFav ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Star className={cn("h-5 w-5", isFav && "fill-accent-gold")} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-text-muted hover:text-text-primary hover:bg-bg-base transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Muscles & Equipment metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg border border-border-subtle/60 bg-bg-base/30">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-accent-cyan" /> Target Muscles
            </span>
            <div className="flex flex-wrap gap-1">
              {exercise.muscleGroups.map((m) => (
                <span key={m} className="rounded bg-accent-cyan/10 px-2 py-0.5 text-xs font-medium text-accent-cyan capitalize">
                  {m}
                </span>
              ))}
              {exercise.secondaryMuscles?.map((m) => (
                <span key={m} className="rounded bg-border-subtle/40 px-2 py-0.5 text-xs font-medium text-text-muted capitalize">
                  {m} (secondary)
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Dumbbell className="h-3.5 w-3.5 text-accent-gold" /> Equipment & Pattern
            </span>
            <div className="flex flex-wrap gap-1">
              {exercise.equipment.map((eq) => (
                <span key={eq} className="rounded bg-accent-gold/10 px-2 py-0.5 text-xs font-medium text-accent-gold capitalize">
                  {eq.replace("_", " ")}
                </span>
              ))}
              {exercise.movementPattern ? (
                <span className="rounded bg-border-subtle/40 px-2 py-0.5 text-xs font-medium text-text-muted capitalize">
                  {exercise.movementPattern}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Instructions */}
        {exercise.instructions && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              Execution Guide
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed bg-bg-base/20 p-3 rounded-lg border border-border-subtle/40 whitespace-pre-line">
              {exercise.instructions}
            </p>
          </div>
        )}

        {/* Pro Tips */}
        {exercise.tips && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-accent-cyan flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4" /> Pro Form Tips
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed bg-accent-cyan/5 p-3 rounded-lg border border-accent-cyan/20">
              {exercise.tips}
            </p>
          </div>
        )}

        {/* Common Mistakes */}
        {exercise.commonMistakes && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Common Mistakes
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed bg-rose-500/5 p-3 rounded-lg border border-rose-500/20">
              {exercise.commonMistakes}
            </p>
          </div>
        )}

        {/* PR placeholder reference */}
        <div className="p-3.5 rounded-lg border border-border-subtle/50 bg-bg-base/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-accent-gold/10 p-2 text-accent-gold">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary">Personal Best</div>
              <div className="text-[11px] text-text-muted">Tracked automatically during live workouts</div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-accent-gold">-- kg</span>
        </div>
      </div>
    </div>
  )
}
