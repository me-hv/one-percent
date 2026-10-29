"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import {
  Moon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  ShieldCheck,
  Activity,
  Heart,
  Sparkles,
} from "lucide-react"
import { useRecoveryStore } from "@/features/recovery/store/recovery.store"
import { useAuthStore } from "@/lib/store/auth.store"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { calculateReadinessScore } from "@/features/recovery/services/readiness.service"
import { calculateTrainingLoadSummary } from "@/features/recovery/services/training-load.service"
import { generateRecoveryInsights } from "@/features/recovery/services/recovery-insights.service"
import { ReadinessScoreCard } from "@/features/recovery/components/ReadinessScoreCard"
import { SleepTrendsCard } from "@/features/recovery/components/SleepTrendsCard"
import { WellnessTrendsCard } from "@/features/recovery/components/WellnessTrendsCard"
import { MuscleRecoveryMapCard } from "@/features/recovery/components/MuscleRecoveryMapCard"
import { TrainingWorkloadCard } from "@/features/recovery/components/TrainingWorkloadCard"
import { RecoveryInsightsList } from "@/features/recovery/components/RecoveryInsightsList"
import { HistoricalReadinessChart } from "@/features/recovery/components/HistoricalReadinessChart"
import { formatDateKey, formatDateShort, subDays, addDays } from "@/lib/utils/date"
import type { WorkoutSession } from "@/lib/types/training.types"

const DailyCheckInModal = dynamic(
  () =>
    import("@/features/recovery/components/DailyCheckInModal").then(
      (m) => m.DailyCheckInModal
    ),
  { ssr: false }
)

export default function RecoveryPage() {
  const { user } = useAuthStore()
  const { entries, config, updateConfig } = useRecoveryStore()

  // Selected date for viewing / check-in
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const selectedDateStr = formatDateKey(selectedDate)

  // Modal controls
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [targetSleepInput, setTargetSleepInput] = useState(
    (config.targetSleepMinutes / 60).toFixed(1)
  )

  // Query actual completed workouts
  const { data: remoteSessions } = useWorkoutHistory(user?.uid || "")
  const sessions: WorkoutSession[] = useMemo(() => {
    return remoteSessions || []
  }, [remoteSessions])

  // Get selected day's entry or fallback
  const selectedDayEntry = useMemo(() => {
    return entries.find((e) => e.date === selectedDateStr)
  }, [entries, selectedDateStr])

  const hasTodayCheckIn = useMemo(() => {
    const todayStr = formatDateKey(new Date())
    return entries.some((e) => e.date === todayStr)
  }, [entries])

  // Calculate Readiness for selected date
  const readiness = useMemo(() => {
    return calculateReadinessScore(selectedDayEntry, config)
  }, [selectedDayEntry, config])

  // Calculate Training Load & Muscle Statuses
  const trainingLoad = useMemo(() => {
    return calculateTrainingLoadSummary(sessions, entries, selectedDate)
  }, [sessions, entries, selectedDate])

  // Deterministic Insights
  const insights = useMemo(() => {
    return generateRecoveryInsights(entries, trainingLoad, config)
  }, [entries, trainingLoad, config])

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(targetSleepInput)
    if (!isNaN(val) && val >= 4 && val <= 14) {
      updateConfig({ targetSleepMinutes: Math.round(val * 60) })
      setIsConfigOpen(false)
    }
  }

  return (
    <div className="page-container space-y-6 max-w-6xl mx-auto">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="page-title">Recovery & Readiness</h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-accent/15 text-accent border border-accent/25">
              Deterministic
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Sleep tracking, daily wellness check-ins, muscle soreness mapping, and training readiness.
          </p>
        </div>

        {/* Date Selector & Config Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setSelectedDate((d) => subDays(d, 1))}
            aria-label="Previous day"
            className="p-2 rounded border border-border-default bg-bg-surface text-text-secondary hover:text-primary hover:border-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="px-3 py-1.5 rounded border border-border-default bg-bg-surface text-primary font-bold text-center min-w-[130px]">
            {formatDateShort(selectedDate)}
          </div>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            aria-label="Next day"
            className="p-2 rounded border border-border-default bg-bg-surface text-text-secondary hover:text-primary hover:border-accent transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-2.5 py-1.5 rounded bg-accent/15 text-accent hover:bg-accent/25 font-bold transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setIsConfigOpen(true)}
            aria-label="Recovery settings"
            className="p-2 rounded border border-border-default bg-bg-surface text-text-secondary hover:text-primary transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Target Sleep Config Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleSaveConfig}
            className="card p-5 max-w-sm w-full space-y-4 border border-border-default bg-bg-surface shadow-2xl font-sans"
          >
            <div className="flex justify-between items-center border-b border-border-subtle pb-2">
              <h4 className="text-sm font-bold text-primary">Sleep Target Configuration</h4>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="text-text-placeholder hover:text-primary"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-mono">
                Daily Sleep Target (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="4"
                max="14"
                value={targetSleepInput}
                onChange={(e) => setTargetSleepInput(e.target.value)}
                className="w-full h-9 px-3 rounded border border-border-default bg-bg-base font-mono text-sm text-primary outline-none focus:border-accent"
              />
              <span className="text-[10px] text-text-placeholder block">
                Readiness calculations will benchmark your sleep against this configured need.
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="h-8 px-3 rounded border border-border-default text-xs font-mono text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 px-4 rounded bg-accent text-bg-base font-bold text-xs font-mono"
              >
                Save Target
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Primary Card: Daily Training Readiness with Factor Breakdown */}
      <ReadinessScoreCard
        readiness={readiness}
        onOpenCheckIn={() => setIsCheckInOpen(true)}
        hasTodayCheckIn={hasTodayCheckIn}
      />

      {/* Historical Readiness Progression Chart */}
      <HistoricalReadinessChart entries={entries} config={config} />

      {/* Dual Trends Grid: Sleep Duration Tracking & Subjective Wellness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SleepTrendsCard entries={entries} config={config} />
        <WellnessTrendsCard entries={entries} />
      </div>

      {/* Muscle Recovery Map & DOMS Status */}
      <MuscleRecoveryMapCard muscleStatuses={trainingLoad.muscleStatuses} />

      {/* Training Load & Workload Ratio (ACWR) */}
      <TrainingWorkloadCard summary={trainingLoad} />

      {/* Deterministic Recovery Insights List */}
      <RecoveryInsightsList insights={insights} />

      {/* Interactive Check-In Modal */}
      <DailyCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        initialDateStr={selectedDateStr}
      />
    </div>
  )
}
