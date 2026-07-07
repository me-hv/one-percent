"use client"

import { usePathname } from "next/navigation"
import { Menu, Play, Square, Pause } from "lucide-react"
import { useUIStore } from "@/lib/store/ui.store"
import { useWorkoutStore } from "@/lib/store/workout.store"
import { formatDurationShort } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import { useEffect, useRef } from "react"

export function TopBar() {
  const pathname = usePathname()
  const { toggleMobileSidebar, setActiveWorkoutModalOpen } = useUIStore()
  const {
    activeSession,
    timerSeconds,
    isTimerRunning,
    isPaused,
    tickTimer,
    togglePause,
  } = useWorkoutStore()

  // ─── Active Workout Timer Effect ─────────────────────────────────
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (activeSession && isTimerRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        tickTimer()
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [activeSession, isTimerRunning, isPaused, tickTimer])

  // ─── Route Title Mapper ──────────────────────────────────────────
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return "Dashboard"

    const firstSegment = segments[0]!
    const capitalized = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)

    // Handle subpages titles if needed
    if (segments.length > 1) {
      const sub = segments[1]!
      if (sub === "new") return `New ${capitalized.slice(0, -1)}`
      if (sub === "log") return "Active Workout"
    }

    return capitalized
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-bg-base/80 backdrop-blur-md px-4 lg:px-6">
      {/* ─── Page Title & Mobile Menu ───────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="rounded p-1 hover:bg-bg-elevated text-text-secondary hover:text-primary transition-colors lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-primary lg:text-lg">
          {getPageTitle()}
        </h1>
      </div>

      {/* ─── Active Workout Widget ──────────────────────────────────── */}
      {activeSession && (
        <div className="flex items-center gap-2 rounded-full bg-bg-surface border border-accent/20 px-3 py-1 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isPaused ? "bg-warning" : "bg-accent",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isPaused ? "bg-warning" : "bg-accent",
                )}
              />
            </span>
            <button
              onClick={() => setActiveWorkoutModalOpen(true)}
              className="font-mono text-xs font-semibold text-primary hover:text-accent transition-colors"
            >
              {activeSession.name}
            </button>
            <span className="font-mono text-xs text-text-secondary border-l border-border-default pl-2">
              {formatDurationShort(timerSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-border-default pl-1.5 ml-1">
            <button
              onClick={togglePause}
              className="rounded-full p-1 hover:bg-bg-elevated text-text-secondary hover:text-primary transition-colors"
              aria-label={isPaused ? "Resume workout timer" : "Pause workout timer"}
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
