"use client"

import { Dumbbell, Plus } from "lucide-react"
import Link from "next/link"
import { ROUTES } from "@/lib/constants/ROUTES"
import { useWorkoutStore } from "@/lib/store/workout.store"
import { useRouter } from "next/navigation"

export function TrainingWidget() {
  const router = useRouter()
  const { startWorkout } = useWorkoutStore()

  const handleStartWorkout = () => {
    startWorkout("Push Day A")
    router.push(ROUTES.training.log)
  }

  return (
    <div className="card space-y-4">
      <div className="card-header">
        <span className="card-label">Training weekly load</span>
        <Dumbbell className="h-4 w-4 text-text-placeholder" />
      </div>

      <div className="space-y-4">
        {/* Weekly frequency target display */}
        <div className="flex justify-between items-baseline">
          <div className="space-y-1">
            <span className="font-mono text-3xl font-bold text-primary tracking-tight">
              3
            </span>
            <span className="text-xs text-text-secondary ml-1.5">/ 4 sessions done</span>
          </div>
          <span className="text-[10px] font-mono text-text-placeholder">
            Week 2 of 12
          </span>
        </div>

        {/* Small calendar-like bar indicators */}
        <div className="flex gap-2">
          {[
            { label: "Mon", status: "completed", name: "Lower Power" },
            { label: "Tue", status: "completed", name: "Upper Power" },
            { label: "Wed", status: "rest" },
            { label: "Thu", status: "completed", name: "Push Day A" },
            { label: "Fri", status: "rest" },
            { label: "Sat", status: "missed" },
            { label: "Sun", status: "active", name: "Pull Day A" },
          ].map((day, idx) => {
            const completed = day.status === "completed"
            const active = day.status === "active"

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-2 w-full rounded-sm ${
                    completed
                      ? "bg-accent"
                      : active
                        ? "bg-accent/40 animate-pulse"
                        : "bg-bg-elevated border border-border-subtle"
                  }`}
                  title={day.name || "Rest day"}
                />
                <span className="text-[9px] font-mono text-text-placeholder">{day.label}</span>
              </div>
            )
          })}
        </div>

        {/* Fast CTA Button to start workout */}
        <button
          onClick={handleStartWorkout}
          className="w-full h-9 rounded-md bg-accent text-bg-base font-semibold hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-150 flex items-center justify-center gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Start Workout Session
        </button>
      </div>
    </div>
  )
}
export default TrainingWidget
