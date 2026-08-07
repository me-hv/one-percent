"use client"

import { use, useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Star, Dumbbell, BookOpen, Lightbulb, AlertTriangle, Trophy, TrendingUp, Clock } from "lucide-react"
import { findExerciseById } from "@/features/training/data/exercise-library.data"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { useAuthStore } from "@/lib/store/auth.store"
import { getExercisePRs } from "@/features/training/services/pr.service"
import { calculateE1RM } from "@/lib/utils/analytics.utils"
import { formatDateShort, formatDateCompact } from "@/lib/utils/date"
import { ROUTES } from "@/lib/constants/ROUTES"
import { cn } from "@/lib/utils/cn"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

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
  const { user } = useAuthStore()
  const { favoriteExerciseIds, toggleFavoriteExercise, customExercises } = useProgramsStore()
  const { data: dbHistory } = useWorkoutHistory(user?.uid ?? "")

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const exercise = useMemo(() => {
    return findExerciseById(id) || customExercises.find((e) => e.id === id) || null
  }, [id, customExercises])

  const isFav = favoriteExerciseIds.includes(id)
  const history = useMemo(() => dbHistory || [], [dbHistory])

  // Get Personal Records for this exercise
  const prs = useMemo(() => {
    return getExercisePRs(history, id)
  }, [history, id])

  // Historical set log progression data
  const historyProgression = useMemo(() => {
    const points: { dateStr: string; e1rm: number; maxWeight: number }[] = []
    
    const sorted = [...history]
      .filter((s) => s.status === "completed")
      .sort((a, b) => {
        const dA = a.completedAt?.toDate?.() ? a.completedAt.toDate().getTime() : 0
        const dB = b.completedAt?.toDate?.() ? b.completedAt.toDate().getTime() : 0
        return dA - dB
      })

    sorted.forEach((session) => {
      session.exercises?.forEach((se) => {
        if (se.exerciseId === id) {
          let maxW = 0
          let maxE1RM = 0
          se.sets?.forEach((st) => {
            if (!st.completed || st.isWarmup) return
            const w = st.weight || 0
            const r = st.reps || 0
            if (w > maxW) maxW = w
            const e1rm = calculateE1RM(w, r)
            if (e1rm > maxE1RM) maxE1RM = e1rm
          })

          if (maxW > 0) {
            const date = session.completedAt?.toDate?.() ? session.completedAt.toDate() : new Date()
            points.push({
              dateStr: formatDateCompact(date),
              e1rm: maxE1RM,
              maxWeight: maxW,
            })
          }
        }
      })
    })

    return points
  }, [history, id])

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

  return (
    <div className="page-container space-y-6 max-w-3xl mx-auto">
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

      {/* PR Leaderboard Cards */}
      {prs && (
        <div className="card p-5 space-y-3 border-accent-gold/30 bg-accent-gold/5">
          <div className="flex items-center gap-2 border-b border-accent-gold/20 pb-2">
            <Trophy className="h-4 w-4 text-accent-gold" />
            <span className="text-xs font-semibold text-accent-gold uppercase font-mono tracking-wider">
              All-Time Personal Bests
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="p-2 rounded bg-bg-base/40 border border-border-subtle space-y-0.5">
              <span className="text-[9px] text-text-placeholder uppercase block">Est 1RM</span>
              <span className="text-base font-bold text-accent-gold">{prs.estimated1RM} kg</span>
            </div>
            <div className="p-2 rounded bg-bg-base/40 border border-border-subtle space-y-0.5">
              <span className="text-[9px] text-text-placeholder uppercase block">Max Weight</span>
              <span className="text-base font-bold text-primary">{prs.maxWeightKg} kg</span>
            </div>
            <div className="p-2 rounded bg-bg-base/40 border border-border-subtle space-y-0.5">
              <span className="text-[9px] text-text-placeholder uppercase block">Max Reps</span>
              <span className="text-base font-bold text-primary">{prs.maxReps}</span>
            </div>
            <div className="p-2 rounded bg-bg-base/40 border border-border-subtle space-y-0.5">
              <span className="text-[9px] text-text-placeholder uppercase block">Best Set Vol</span>
              <span className="text-base font-bold text-accent">{prs.maxSetVolumeKg} kg</span>
            </div>
          </div>
        </div>
      )}

      {/* Strength Progression Chart */}
      {historyProgression.length > 0 && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Estimated 1RM Progression
            </span>
          </div>

          <div className="h-48 w-full">
            {!mounted ? (
              <div className="h-full w-full animate-pulse bg-bg-elevated/10 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyProgression} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="e1rmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EAB308" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1F1F1F" strokeDasharray="3 3" />
                  <XAxis dataKey="dateStr" stroke="#737373" fontSize={9} tickLine={false} />
                  <YAxis stroke="#737373" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#171717", borderColor: "#262626", borderRadius: "8px" }}
                    labelStyle={{ color: "#737373", fontSize: "10px", fontFamily: "monospace" }}
                    itemStyle={{ color: "#E5E5E5", fontSize: "11px" }}
                  />
                  <Area type="monotone" dataKey="e1rm" name="Est 1RM (kg)" stroke="#EAB308" strokeWidth={2} fillOpacity={1} fill="url(#e1rmGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

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

      {/* Pro Form Tips */}
      {exercise.tips && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            <h3 className="text-[10px] font-mono tracking-widest text-accent uppercase">Pro Form Tips</h3>
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
    </div>
  )
}
