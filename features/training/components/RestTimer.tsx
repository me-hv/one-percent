"use client"

import { useRestTimerStore } from "../store/restTimer.store"
import { Play, Pause, Square, Plus, Minus, BellRing } from "lucide-react"
import { formatDurationShort } from "@/lib/utils/format"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils/cn"

export function RestTimer() {
  const {
    secondsRemaining,
    totalSeconds,
    isActive,
    isPaused,
    pauseTimer,
    resumeTimer,
    stopTimer,
    adjustTimer,
    tick,
  } = useRestTimerStore()

  // ─── Timer Interval Tick Observer ─────────────────────────────────
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        tick()
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, isPaused, tick])

  if (!isActive) return null

  const pct = totalSeconds > 0 ? (secondsRemaining / totalSeconds) * 100 : 0

  return (
    <div className="fixed bottom-16 right-4 left-4 lg:left-auto lg:right-6 lg:bottom-6 z-40 w-auto lg:w-80 rounded-xl border border-accent/30 bg-bg-surface/95 backdrop-blur-md p-4 shadow-xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="space-y-3">
        {/* Header Title */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono tracking-widest text-accent uppercase flex items-center gap-1">
            <BellRing className="h-3 w-3 animate-bounce" /> Rest active
          </span>
          <span className="font-mono text-xs text-text-secondary">
            {formatDurationShort(secondsRemaining)} remaining
          </span>
        </div>

        {/* Circular Ring or Linear Progress Bar */}
        <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Adjust controls dial */}
        <div className="flex justify-between items-center gap-2 pt-1">
          <div className="flex gap-1.5">
            <button
              onClick={() => adjustTimer(-30)}
              className="h-7 px-2 rounded border border-border-default hover:bg-bg-elevated text-primary text-[10px] font-mono flex items-center gap-0.5"
            >
              <Minus className="h-3 w-3" /> 30s
            </button>
            <button
              onClick={() => adjustTimer(30)}
              className="h-7 px-2 rounded border border-border-default hover:bg-bg-elevated text-primary text-[10px] font-mono flex items-center gap-0.5"
            >
              <Plus className="h-3 w-3" /> 30s
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={isPaused ? resumeTimer : pauseTimer}
              className="h-7 w-7 rounded-full bg-bg-elevated border border-border-strong hover:bg-bg-base text-primary flex items-center justify-center transition-colors"
              title={isPaused ? "Resume rest timer" : "Pause rest timer"}
            >
              {isPaused ? <Play className="h-3 w-3 fill-primary" /> : <Pause className="h-3 w-3" />}
            </button>
            <button
              onClick={stopTimer}
              className="h-7 w-7 rounded-full bg-negative-bg border border-negative-border hover:bg-negative text-primary hover:text-bg-base flex items-center justify-center transition-all"
              title="Skip rest"
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default RestTimer
