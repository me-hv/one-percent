"use client"

import { useState } from "react"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { ROUTES } from "@/lib/constants/ROUTES"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { TrainingProgram, ProgramFocus } from "@/lib/types/training.types"
import { cn } from "@/lib/utils/cn"
import { X } from "lucide-react"

const COLORS = ["green", "blue", "purple", "orange", "red", "yellow", "teal"]

const COLOR_PREVIEWS: Record<string, string> = {
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  teal: "bg-teal-500",
}

const FOCUS_OPTIONS: ProgramFocus[] = [
  "strength", "hypertrophy", "power", "endurance", "weight_loss", "general_fitness",
]

interface Props {
  isOpen: boolean
  onClose: () => void
  program?: TrainingProgram  // If provided: edit mode
}

export function ProgramFormModal({ isOpen, onClose, program }: Props) {
  const router = useRouter()
  const { createProgram, updateProgram } = useProgramsStore()
  const isEdit = !!program

  const [name, setName] = useState(program?.name ?? "")
  const [description, setDescription] = useState(program?.description ?? "")
  const [goal, setGoal] = useState(program?.goal ?? "")
  const [difficulty, setDifficulty] = useState<TrainingProgram["difficulty"]>(program?.difficulty ?? "intermediate")
  const [durationWeeks, setDurationWeeks] = useState<string>(program?.durationWeeks?.toString() ?? "")
  const [daysPerWeek, setDaysPerWeek] = useState(program?.daysPerWeek ?? 3)
  const [focus, setFocus] = useState<ProgramFocus[]>(program?.focus ?? [])
  const [color, setColor] = useState(program?.color ?? "green")
  const [notes, setNotes] = useState(program?.notes ?? "")
  const [isActive, setIsActive] = useState(program?.isActive ?? false)

  const toggleFocus = (f: ProgramFocus) => {
    setFocus((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error("Program name is required"); return }
    if (focus.length === 0) { toast.error("Select at least one focus area"); return }

    if (isEdit && program) {
      updateProgram(program.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        goal: goal.trim() || undefined,
        difficulty,
        durationWeeks: durationWeeks ? parseInt(durationWeeks) : undefined,
        daysPerWeek,
        focus,
        color,
        notes: notes.trim() || undefined,
        isActive,
      })
      toast.success("Program updated")
    } else {
      const created = createProgram({
        name: name.trim(),
        description: description.trim() || undefined,
        goal: goal.trim() || undefined,
        difficulty,
        durationWeeks: durationWeeks ? parseInt(durationWeeks) : undefined,
        daysPerWeek,
        focus,
        days: [],
        color,
        notes: notes.trim() || undefined,
        isTemplate: false,
        isActive,
      })
      toast.success("Program created!")
      router.push(ROUTES.training.program(created.id))
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/85 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-lg flex-col rounded-xl border border-border-default bg-bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5 flex-shrink-0">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">
            {isEdit ? "Edit Program" : "New Program"}
          </h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. One Percent Strength Block"
              className="w-full h-10 px-3 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-sm outline-none"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of the program..."
              className="w-full h-16 p-2 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none resize-none"
            />
          </div>

          {/* Goal */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Primary Goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Add 20kg to squat in 12 weeks"
              className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none"
            />
          </div>

          {/* Difficulty + Duration row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as TrainingProgram["difficulty"])}
                className="w-full h-9 px-2 rounded border border-border-default bg-bg-base text-primary text-sm outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Duration (weeks)</label>
              <input
                type="number"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                placeholder="Leave blank = ongoing"
                min={1}
                max={52}
                className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-sm outline-none"
              />
            </div>
          </div>

          {/* Days per week */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">
              Days Per Week: {daysPerWeek}
            </label>
            <input
              type="range"
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
              min={1}
              max={7}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-placeholder">
              {[1,2,3,4,5,6,7].map((n) => <span key={n}>{n}</span>)}
            </div>
          </div>

          {/* Focus Areas */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Focus Areas *</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFocus(f)}
                  className={cn(
                    "px-2.5 py-1 rounded border text-[10px] font-mono uppercase tracking-wider capitalize transition-colors",
                    focus.includes(f)
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border-subtle text-text-placeholder hover:border-border-default"
                  )}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all",
                    COLOR_PREVIEWS[c],
                    color === c && "ring-2 ring-offset-2 ring-offset-bg-base ring-white/60 scale-110"
                  )}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional program notes..."
              className="w-full h-14 p-2 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none resize-none"
            />
          </div>

          {/* Set as active */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only"
              />
              <div className={cn("h-5 w-9 rounded-full transition-colors", isActive ? "bg-accent" : "bg-bg-elevated border border-border-default")}>
                <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", isActive ? "translate-x-4" : "translate-x-0.5")} />
              </div>
            </div>
            <span className="text-xs text-text-secondary">Set as active program</span>
          </label>
        </form>

        {/* Footer */}
        <div className="border-t border-border-subtle p-4 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 rounded border border-border-default hover:bg-bg-elevated text-primary text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 h-9 rounded bg-accent text-bg-base hover:bg-accent-hover font-bold text-xs transition-colors"
          >
            {isEdit ? "Save Changes" : "Create Program"}
          </button>
        </div>
      </div>
    </div>
  )
}
