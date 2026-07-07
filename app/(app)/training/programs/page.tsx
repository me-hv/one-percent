"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Dumbbell,
  MoreHorizontal,
  Archive,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  Star,
  BookOpen,
  SlidersHorizontal,
  Zap,
} from "lucide-react"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { useWorkoutStore } from "@/lib/store/workout.store"
import { ROUTES } from "@/lib/constants/ROUTES"
import { cn } from "@/lib/utils/cn"
import { toast } from "sonner"
import type { TrainingProgram } from "@/lib/types/training.types"
import { ProgramFormModal } from "@/features/training/components/ProgramFormModal"

const PROGRAM_COLORS: Record<string, string> = {
  green:  "bg-green-500/15 border-green-500/30 text-green-400",
  blue:   "bg-blue-500/15 border-blue-500/30 text-blue-400",
  purple: "bg-purple-500/15 border-purple-500/30 text-purple-400",
  orange: "bg-orange-500/15 border-orange-500/30 text-orange-400",
  red:    "bg-red-500/15 border-red-500/30 text-red-400",
  yellow: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
  teal:   "bg-teal-500/15 border-teal-500/30 text-teal-400",
  default:"bg-bg-elevated border-border-subtle text-text-placeholder",
}

export default function ProgramsPage() {
  const router = useRouter()
  const { programs, deleteProgram, duplicateProgram, archiveProgram, restoreProgram, setActiveProgram } =
    useProgramsStore()
  const { activeSession } = useWorkoutStore()

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (filter === "active" && p.isArchived) return false
      if (filter === "archived" && !p.isArchived) return false
      if (search) {
        return (
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase())
        )
      }
      return true
    })
  }, [programs, filter, search])

  const activeProgram = programs.find((p) => p.isActive && !p.isArchived)

  const handleDuplicate = (p: TrainingProgram) => {
    const clone = duplicateProgram(p.id)
    if (clone) {
      toast.success(`Duplicated as "${clone.name}"`)
      router.push(ROUTES.training.program(clone.id))
    }
    setMenuOpenId(null)
  }

  const handleArchive = (p: TrainingProgram) => {
    archiveProgram(p.id)
    toast.success(`"${p.name}" archived`)
    setMenuOpenId(null)
  }

  const handleDelete = (p: TrainingProgram) => {
    deleteProgram(p.id)
    toast.success(`"${p.name}" deleted`)
    setMenuOpenId(null)
  }

  const handleSetActive = (p: TrainingProgram) => {
    setActiveProgram(p.id)
    toast.success(`"${p.name}" is now your active program`)
    setMenuOpenId(null)
  }

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Programs</h2>
          <p className="text-sm text-text-secondary mt-1">
            Build, organize and schedule your training programs.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-accent text-bg-base hover:bg-accent-hover font-bold text-xs transition-colors self-start sm:self-center"
        >
          <Plus className="h-3.5 w-3.5" /> New Program
        </button>
      </div>

      {/* Active Program Banner */}
      {activeProgram && (
        <div className="rounded-xl border border-accent/25 bg-bg-surface p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 border border-accent/25">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-accent uppercase block">
                Currently Active
              </span>
              <span className="text-sm font-semibold text-primary">{activeProgram.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              href={ROUTES.training.program(activeProgram.id)}
              className="inline-flex items-center gap-1 h-8 px-3 rounded border border-border-default hover:bg-bg-elevated text-primary text-xs font-medium transition-colors"
            >
              Edit <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-placeholder" />
          <input
            type="text"
            placeholder="Search programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded border border-border-default bg-bg-surface text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none transition-colors"
          />
        </div>
        <div className="flex rounded border border-border-default overflow-hidden">
          {(["all", "active", "archived"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 h-9 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "bg-bg-elevated text-primary"
                  : "text-text-secondary hover:text-primary hover:bg-bg-elevated/50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
            <BookOpen className="h-7 w-7 text-text-placeholder" />
          </div>
          <h3 className="text-base font-semibold text-primary">No programs yet</h3>
          <p className="text-sm text-text-secondary max-w-xs">
            Create your first training program to get structured and make consistent progress.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-accent text-bg-base hover:bg-accent-hover font-bold text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Create Program
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPrograms.map((program) => {
            const colorClass = PROGRAM_COLORS[program.color ?? "default"] ?? PROGRAM_COLORS["default"]
            const totalExercises = program.days.reduce((acc, d) => acc + d.exercises.length, 0)
            const workoutDays = program.days.filter((d) => !d.isRestDay).length

            return (
              <div
                key={program.id}
                className={cn(
                  "group relative rounded-xl border bg-bg-surface p-5 flex flex-col gap-4 hover:bg-bg-elevated/30 transition-colors duration-150",
                  program.isActive && !program.isArchived ? "border-accent/30" : "border-border-subtle",
                  program.isArchived && "opacity-60"
                )}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-bold", colorClass)}>
                      {program.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-sm font-semibold text-primary truncate">{program.name}</h3>
                      {program.description && (
                        <p className="text-xs text-text-secondary line-clamp-2 mt-0.5 leading-relaxed">
                          {program.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Context menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === program.id ? null : program.id)}
                      className="p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors"
                      aria-label="Program options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuOpenId === program.id && (
                      <div className="absolute right-0 top-7 z-20 w-44 rounded-lg border border-border-default bg-bg-surface shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => { router.push(ROUTES.training.program(program.id)); setMenuOpenId(null) }}
                          className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-bg-elevated flex items-center gap-2"
                        >
                          <Dumbbell className="h-3.5 w-3.5" /> Edit Program
                        </button>
                        {!program.isActive && !program.isArchived && (
                          <button
                            onClick={() => handleSetActive(program)}
                            className="w-full text-left px-3 py-2 text-xs text-accent hover:bg-bg-elevated flex items-center gap-2"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Set as Active
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicate(program)}
                          className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-bg-elevated flex items-center gap-2"
                        >
                          <Copy className="h-3.5 w-3.5" /> Duplicate
                        </button>
                        {program.isArchived ? (
                          <button
                            onClick={() => { restoreProgram(program.id); setMenuOpenId(null); toast.success("Program restored") }}
                            className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-bg-elevated flex items-center gap-2"
                          >
                            <Archive className="h-3.5 w-3.5" /> Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(program)}
                            className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-bg-elevated flex items-center gap-2"
                          >
                            <Archive className="h-3.5 w-3.5" /> Archive
                          </button>
                        )}
                        <div className="border-t border-border-subtle my-1" />
                        <button
                          onClick={() => handleDelete(program)}
                          className="w-full text-left px-3 py-2 text-xs text-negative hover:bg-negative-bg/20 flex items-center gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <span className="text-[10px] font-mono tracking-wider text-text-placeholder uppercase block">Days</span>
                    <span className="text-sm font-bold text-primary font-mono block mt-0.5">{workoutDays}</span>
                  </div>
                  <div className="text-center border-x border-border-subtle/60">
                    <span className="text-[10px] font-mono tracking-wider text-text-placeholder uppercase block">Exercises</span>
                    <span className="text-sm font-bold text-primary font-mono block mt-0.5">{totalExercises}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono tracking-wider text-text-placeholder uppercase block">Weeks</span>
                    <span className="text-sm font-bold text-primary font-mono block mt-0.5">
                      {program.durationWeeks ?? "∞"}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-border-subtle text-text-placeholder capitalize">
                    {program.difficulty}
                  </span>
                  {program.focus.slice(0, 2).map((f) => (
                    <span key={f} className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-border-subtle text-text-placeholder capitalize">
                      {f.replace("_", " ")}
                    </span>
                  ))}
                  {program.isActive && !program.isArchived && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent/30 bg-accent/10 text-accent">
                      Active
                    </span>
                  )}
                  {program.isArchived && (
                    <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-border-subtle text-text-placeholder">
                      Archived
                    </span>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={ROUTES.training.program(program.id)}
                  className="mt-auto inline-flex items-center justify-center gap-1 h-8 w-full rounded border border-border-default hover:bg-bg-elevated text-primary text-xs font-medium transition-colors"
                >
                  Open Program <ChevronRight className="h-3 w-3" />
                </Link>

                {/* Close menu on outside click */}
                {menuOpenId === program.id && (
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Program Modal */}
      <ProgramFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
