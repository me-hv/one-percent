"use client"

import { useState } from "react"
import { X, Plus, Dumbbell } from "lucide-react"
import type { ExerciseCategory, Equipment, MovementPattern } from "@/lib/types/training.types"
import type { MuscleGroup } from "@/lib/types/common.types"
import { useProgramsStore } from "../store/programs.store"

interface CustomExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (exerciseId: string) => void
}

const CATEGORIES: ExerciseCategory[] = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "resistance_band",
  "cardio",
  "plyometric",
  "stretching",
]

const MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "calves",
  "glutes",
  "core",
  "forearms",
  "traps",
]

const EQUIPMENT: Equipment[] = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "kettlebell",
  "resistance_band",
  "pullup_bar",
  "dip_bar",
  "bench",
  "none",
]

const PATTERNS: MovementPattern[] = [
  "push",
  "pull",
  "squat",
  "hinge",
  "lunge",
  "carry",
  "rotation",
  "isolation",
]

export function CustomExerciseModal({ isOpen, onClose, onCreated }: CustomExerciseModalProps) {
  const { addCustomExercise } = useProgramsStore()

  const [name, setName] = useState("")
  const [category, setCategory] = useState<ExerciseCategory>("dumbbell")
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>("chest")
  const [equipmentItem, setEquipmentItem] = useState<Equipment>("dumbbell")
  const [movementPattern, setMovementPattern] = useState<MovementPattern>("push")
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate")
  const [instructions, setInstructions] = useState("")
  const [tips, setTips] = useState("")

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newEx = addCustomExercise({
      name: name.trim(),
      category,
      muscleGroups: [primaryMuscle],
      equipment: [equipmentItem],
      movementPattern,
      difficulty,
      instructions: instructions.trim() || undefined,
      tips: tips.trim() || undefined,
    })

    if (onCreated) {
      onCreated(newEx.id)
    }

    // Reset & Close
    setName("")
    setInstructions("")
    setTips("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border-subtle bg-bg-surface p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent-gold/10 p-2 text-accent-gold">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Create Custom Exercise</h2>
              <p className="text-xs text-text-muted">Add a new movement to your personal library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:text-text-primary hover:bg-bg-base transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-primary">Exercise Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Incline Cable Fly"
              className="mt-1 w-full rounded-lg border border-border-subtle bg-bg-base/60 px-3 py-2 text-xs text-text-primary placeholder:text-text-placeholder focus:border-accent-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-primary">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                className="mt-1 w-full rounded-lg border border-border-subtle bg-bg-base/60 px-3 py-2 text-xs text-text-primary focus:border-accent-gold focus:outline-none capitalize"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary">Primary Muscle</label>
              <select
                value={primaryMuscle}
                onChange={(e) => setPrimaryMuscle(e.target.value as MuscleGroup)}
                className="mt-1 w-full rounded-lg border border-border-subtle bg-bg-base/60 px-3 py-2 text-xs text-text-primary focus:border-accent-gold focus:outline-none capitalize"
              >
                {MUSCLES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-primary">Equipment</label>
              <select
                value={equipmentItem}
                onChange={(e) => setEquipmentItem(e.target.value as Equipment)}
                className="mt-1 w-full rounded-lg border border-border-subtle bg-bg-base/60 px-3 py-2 text-xs text-text-primary focus:border-accent-gold focus:outline-none capitalize"
              >
                {EQUIPMENT.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary">Movement Pattern</label>
              <select
                value={movementPattern}
                onChange={(e) => setMovementPattern(e.target.value as MovementPattern)}
                className="mt-1 w-full rounded-lg border border-border-subtle bg-bg-base/60 px-3 py-2 text-xs text-text-primary focus:border-accent-gold focus:outline-none capitalize"
              >
                {PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-primary">Instructions</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Step-by-step execution details..."
              className="mt-1 w-full rounded-lg border border-border-subtle bg-bg-base/60 px-3 py-2 text-xs text-text-primary placeholder:text-text-placeholder focus:border-accent-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-primary">Pro Form Tips</label>
            <input
              type="text"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder="Key cues for optimal muscle activation..."
              className="mt-1 w-full rounded-lg border border-border-subtle bg-bg-base/60 px-3 py-2 text-xs text-text-primary placeholder:text-text-placeholder focus:border-accent-gold focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-subtle px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-bg-base transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-accent-gold px-4 py-2 text-xs font-bold text-bg-base hover:bg-accent-gold-hover transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Save Exercise
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
