"use client"

import { X, Award, Clock, Flame, BarChart2, CheckCircle2, ChevronRight } from "lucide-react"
import type { WorkoutSession } from "@/lib/types/training.types"
import { formatDuration, formatVolume } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"

interface WorkoutSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  session: WorkoutSession | null
}

export function WorkoutSummaryModal({ isOpen, onClose, session }: WorkoutSummaryModalProps) {
  if (!isOpen || !session) return null

  // Calculate session properties
  const volume = session.totalVolume || 0
  const setsCount = session.totalSets || 0
  const repsCount = session.totalReps || 0
  const durationSec = session.durationSeconds || 0
  const prsCount = session.prsAchieved?.length || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/85 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-md flex-col rounded-xl border border-border-default bg-bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header decoration */}
        <div className="relative overflow-hidden bg-bg-base/40 border-b border-border-subtle/50 px-6 py-5 text-center">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/5 blur-3xl animate-pulse" />
          
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 border border-accent/25 text-accent mb-3">
            <Award className="h-5 w-5" />
          </div>

          <h3 className="text-base font-semibold text-primary">
            Workout Completed!
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            "Get 1% better every day." You did exactly that.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-border-subtle bg-bg-base/20 p-3 text-left">
              <span className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase flex items-center gap-1">
                <Clock className="h-3 w-3 text-text-placeholder" /> Duration
              </span>
              <span className="font-mono text-sm font-bold text-primary block mt-1.5">
                {formatDuration(durationSec)}
              </span>
            </div>

            <div className="rounded border border-border-subtle bg-bg-base/20 p-3 text-left">
              <span className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase flex items-center gap-1">
                <BarChart2 className="h-3 w-3 text-text-placeholder" /> Total Volume
              </span>
              <span className="font-mono text-sm font-bold text-primary block mt-1.5">
                {formatVolume(volume)}
              </span>
            </div>

            <div className="rounded border border-border-subtle bg-bg-base/20 p-3 text-left">
              <span className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-text-placeholder" /> Completed
              </span>
              <span className="font-mono text-sm font-bold text-primary block mt-1.5">
                {setsCount} sets ({repsCount} reps)
              </span>
            </div>

            <div className="rounded border border-border-subtle bg-bg-base/20 p-3 text-left">
              <span className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase flex items-center gap-1">
                <Flame className="h-3 w-3 text-text-placeholder" /> PRs Achieved
              </span>
              <span className={cn(
                "font-mono text-sm font-bold block mt-1.5",
                prsCount > 0 ? "text-warning" : "text-primary"
              )}>
                {prsCount} records beat
              </span>
            </div>
          </div>

          {/* New PR achievements lists if unlocked */}
          {prsCount > 0 && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3.5 space-y-2">
              <span className="text-[9px] font-mono font-bold text-warning uppercase tracking-wider block">
                Records Surpassed:
              </span>
              <div className="space-y-1">
                {session.prsAchieved?.map((pr) => (
                  <div key={pr.id} className="flex justify-between items-center text-xs">
                    <span className="text-primary font-medium">Beast Mode unlocked</span>
                    <span className="font-mono text-warning font-semibold">+{pr.value}kg Max</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Coach Recovery recommendation */}
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 space-y-1.5 text-left">
            <span className="text-[9px] font-mono tracking-widest text-accent uppercase block">
              AI Coach // Next Actions
            </span>
            <p className="text-xs text-text-secondary leading-relaxed">
              Excellent focus. Recommend consuming <strong className="text-primary font-medium">35g protein</strong> within 45 mins. Prioritize sleep quality tonight; recovery windows are active.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border-subtle bg-bg-base/35 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="w-full h-10 rounded bg-accent text-bg-base hover:bg-accent-hover font-bold text-xs transition-colors flex items-center justify-center gap-1"
          >
            Done <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
export default WorkoutSummaryModal
