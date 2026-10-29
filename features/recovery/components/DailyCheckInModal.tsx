"use client"

import { useState, useEffect, useMemo } from "react"
import {
  X,
  Moon,
  Zap,
  Activity,
  Flame,
  AlertCircle,
  Heart,
  ChevronDown,
  ChevronUp,
  Check,
  Calendar,
} from "lucide-react"
import { useRecoveryStore } from "@/features/recovery/store/recovery.store"
import { calculateReadinessScore } from "@/features/recovery/services/readiness.service"
import type {
  DailyRecoveryEntry,
  MuscleGroup,
  SorenessRating,
  WellnessRating1to5,
} from "@/lib/types/recovery.types"
import { WELLNESS_SCALE_LABELS } from "@/lib/types/recovery.types"
import { formatDateShort, formatDateKey } from "@/lib/utils/date"
import { cn } from "@/lib/utils/cn"
import { toast } from "sonner"

interface DailyCheckInModalProps {
  isOpen: boolean
  onClose: () => void
  initialDateStr?: string
}

const MUSCLE_GROUPS: { id: MuscleGroup; label: string }[] = [
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back / Lats" },
  { id: "shoulders", label: "Shoulders" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "glutes", label: "Glutes" },
  { id: "calves", label: "Calves" },
  { id: "core", label: "Core / Abs" },
]

export function DailyCheckInModal({
  isOpen,
  onClose,
  initialDateStr,
}: DailyCheckInModalProps) {
  const { entries, saveCheckIn, config } = useRecoveryStore()

  const [dateStr, setDateStr] = useState(initialDateStr || formatDateKey(new Date()))

  // Sleep
  const [sleepHours, setSleepHours] = useState(7)
  const [sleepMinutes, setSleepMinutes] = useState(30)
  const [bedtime, setBedtime] = useState("23:00")
  const [wakeTime, setWakeTime] = useState("07:00")
  const [sleepQuality, setSleepQuality] = useState<WellnessRating1to5 | undefined>(4)

  // Subjective wellness (1-5)
  const [energy, setEnergy] = useState<WellnessRating1to5 | undefined>(4)
  const [fatigue, setFatigue] = useState<WellnessRating1to5 | undefined>(2)
  const [stress, setStress] = useState<WellnessRating1to5 | undefined>(2)
  const [motivation, setMotivation] = useState<WellnessRating1to5 | undefined>(4)

  // Muscle Soreness (0-5 per muscle)
  const [muscleSoreness, setMuscleSoreness] = useState<
    Partial<Record<MuscleGroup, SorenessRating>>
  >({})

  // Advanced / Optional Biometrics
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [restingHR, setRestingHR] = useState<string>("")
  const [hrv, setHrv] = useState<string>("")
  const [notes, setNotes] = useState("")

  // Load existing entry if available when date changes
  useEffect(() => {
    const existing = entries.find((e) => e.date === dateStr)
    if (existing) {
      if (existing.sleepDurationMinutes != null) {
        setSleepHours(Math.floor(existing.sleepDurationMinutes / 60))
        setSleepMinutes(existing.sleepDurationMinutes % 60)
      }
      setBedtime(existing.bedtime || "23:00")
      setWakeTime(existing.wakeTime || "07:00")
      setSleepQuality(existing.sleepQuality)
      setEnergy(existing.energy)
      setFatigue(existing.fatigue)
      setStress(existing.stress)
      setMotivation(existing.motivation)
      setMuscleSoreness(existing.muscleSoreness || {})
      setRestingHR(existing.restingHR != null ? String(existing.restingHR) : "")
      setHrv(existing.hrv != null ? String(existing.hrv) : "")
      setNotes(existing.notes || "")
      if (existing.restingHR || existing.hrv) {
        setShowAdvanced(true)
      }
    } else {
      // Default clean state
      setSleepHours(7)
      setSleepMinutes(30)
      setSleepQuality(4)
      setEnergy(4)
      setFatigue(2)
      setStress(2)
      setMotivation(4)
      setMuscleSoreness({})
      setRestingHR("")
      setHrv("")
      setNotes("")
    }
  }, [dateStr, entries])

  // Update initial date prop
  useEffect(() => {
    if (initialDateStr) {
      setDateStr(initialDateStr)
    }
  }, [initialDateStr])

  // Calculate live preview of readiness score
  const livePreview = useMemo(() => {
    const totalDurationMinutes = sleepHours * 60 + sleepMinutes
    const draft: Partial<DailyRecoveryEntry> = {
      date: dateStr,
      sleepDurationMinutes: totalDurationMinutes > 0 ? totalDurationMinutes : undefined,
      sleepQuality,
      energy,
      fatigue,
      stress,
      motivation,
      muscleSoreness,
      restingHR: restingHR ? parseFloat(restingHR) : undefined,
      hrv: hrv ? parseFloat(hrv) : undefined,
    }
    return calculateReadinessScore(draft, config)
  }, [
    dateStr,
    sleepHours,
    sleepMinutes,
    sleepQuality,
    energy,
    fatigue,
    stress,
    motivation,
    muscleSoreness,
    restingHR,
    hrv,
    config,
  ])

  if (!isOpen) return null

  const handleSorenessToggle = (muscle: MuscleGroup, rating: SorenessRating) => {
    setMuscleSoreness((prev) => {
      const current = prev[muscle]
      if (current === rating) {
        // Toggle off back to 0
        const copy = { ...prev }
        delete copy[muscle]
        return copy
      }
      return { ...prev, [muscle]: rating }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const totalDuration = sleepHours * 60 + sleepMinutes
    if (totalDuration < 60 && totalDuration > 0) {
      toast.error("Please enter a realistic sleep duration (at least 1 hour)")
      return
    }

    const rhrNum = restingHR ? parseFloat(restingHR) : undefined
    const hrvNum = hrv ? parseFloat(hrv) : undefined

    if (rhrNum != null && (rhrNum < 30 || rhrNum > 180)) {
      toast.error("Resting HR out of typical physiological range (30-180 bpm)")
      return
    }

    if (hrvNum != null && (hrvNum < 5 || hrvNum > 250)) {
      toast.error("HRV out of typical physiological range (5-250 ms)")
      return
    }

    saveCheckIn({
      userId: "user-1",
      date: dateStr,
      sleepDurationMinutes: totalDuration > 0 ? totalDuration : undefined,
      bedtime: bedtime || undefined,
      wakeTime: wakeTime || undefined,
      sleepQuality,
      energy,
      fatigue,
      stress,
      motivation,
      muscleSoreness,
      restingHR: rhrNum,
      hrv: hrvNum,
      notes: notes.trim() || undefined,
    })

    toast.success(`Recovery check-in saved for ${formatDateShort(new Date(dateStr + "T00:00:00"))}`)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-border-default bg-bg-surface p-5 sm:p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-accent/15 text-accent border border-accent/25">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <h2 id="checkin-title" className="text-base font-bold text-primary">
                Daily Recovery & Wellness Check-In
              </h2>
              <p className="text-xs text-text-placeholder font-mono">
                Deterministic readiness and muscle tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-md text-text-placeholder hover:text-primary hover:bg-bg-elevated transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Date Selector & Live Score Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-lg border border-border-subtle bg-bg-base/40">
          <div className="sm:col-span-5 space-y-1">
            <label className="text-[11px] font-mono text-text-placeholder block uppercase">
              Check-In Date
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent shrink-0" />
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full h-8 px-2 rounded border border-border-default bg-bg-surface text-primary font-mono text-xs outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="sm:col-span-7 flex items-center justify-between sm:justify-end gap-4 sm:border-l sm:border-border-subtle sm:pl-4">
            <div>
              <span className="text-[10px] uppercase font-mono text-text-placeholder block">
                Calculated Readiness
              </span>
              <span className="text-xs font-bold text-primary">
                {livePreview.category}
              </span>
            </div>
            <div className="text-right">
              {livePreview.score != null ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold font-mono text-accent">
                    {livePreview.score}
                  </span>
                  <span className="text-[10px] text-text-placeholder font-mono">/100</span>
                </div>
              ) : (
                <span className="text-xs font-mono text-text-placeholder">
                  {livePreview.completenessPct}% data
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Sleep Duration & Sleep Quality */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary uppercase">
              <Moon className="h-3.5 w-3.5 text-accent" />
              <span>1. Sleep Duration & Quality</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Duration Inputs */}
              <div className="space-y-1">
                <label className="text-[11px] text-text-secondary">
                  Duration Asleep ({sleepHours}h {sleepMinutes}m)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1 border border-border-default rounded bg-bg-base px-2 h-9">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 bg-transparent text-center font-mono font-bold text-xs text-primary outline-none"
                    />
                    <span className="text-xs text-text-placeholder">hrs</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1 border border-border-default rounded bg-bg-base px-2 h-9">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      step={5}
                      value={sleepMinutes}
                      onChange={(e) =>
                        setSleepMinutes(
                          Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                        )
                      }
                      className="w-12 bg-transparent text-center font-mono font-bold text-xs text-primary outline-none"
                    />
                    <span className="text-xs text-text-placeholder">mins</span>
                  </div>
                </div>
              </div>

              {/* Bedtime / Wake times */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-text-secondary">Bedtime</label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full h-9 px-2 rounded border border-border-default bg-bg-base text-primary font-mono text-xs outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-text-secondary">Wake Time</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full h-9 px-2 rounded border border-border-default bg-bg-base text-primary font-mono text-xs outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Sleep Quality (1-5) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-text-secondary">Sleep Quality Self-Rating</span>
                <span className="font-mono text-accent font-semibold">
                  {sleepQuality ? WELLNESS_SCALE_LABELS.sleepQuality[sleepQuality] : "Not rated"}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {([1, 2, 3, 4, 5] as WellnessRating1to5[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSleepQuality(val)}
                    className={cn(
                      "py-2 rounded border text-xs font-mono font-bold transition-all flex flex-col items-center gap-0.5",
                      sleepQuality === val
                        ? "border-accent bg-accent/20 text-accent ring-1 ring-accent"
                        : "border-border-subtle bg-bg-base/60 text-text-secondary hover:border-border-default"
                    )}
                  >
                    <span>{val}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Daily Wellness Assessments (1-5) */}
          <div className="space-y-4 border-t border-border-subtle pt-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary uppercase">
              <Zap className="h-3.5 w-3.5 text-accent" />
              <span>2. Subjective Wellness (1–5)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Energy (Higher is better) */}
              <div className="space-y-1.5 p-3 rounded-lg border border-border-subtle bg-bg-base/30">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-primary">Energy</span>
                  <span className="font-mono text-accent">
                    {energy ? WELLNESS_SCALE_LABELS.energy[energy] : "Not rated"}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {([1, 2, 3, 4, 5] as WellnessRating1to5[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEnergy(val)}
                      className={cn(
                        "h-8 rounded border text-xs font-mono font-bold transition-all",
                        energy === val
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500"
                          : "border-border-subtle bg-bg-base text-text-placeholder hover:text-primary"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fatigue (Lower is better) */}
              <div className="space-y-1.5 p-3 rounded-lg border border-border-subtle bg-bg-base/30">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-primary">Fatigue</span>
                  <span className="font-mono text-rose-400">
                    {fatigue ? WELLNESS_SCALE_LABELS.fatigue[fatigue] : "Not rated"}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {([1, 2, 3, 4, 5] as WellnessRating1to5[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFatigue(val)}
                      className={cn(
                        "h-8 rounded border text-xs font-mono font-bold transition-all",
                        fatigue === val
                          ? "border-rose-500 bg-rose-500/20 text-rose-400 ring-1 ring-rose-500"
                          : "border-border-subtle bg-bg-base text-text-placeholder hover:text-primary"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress (Lower is better) */}
              <div className="space-y-1.5 p-3 rounded-lg border border-border-subtle bg-bg-base/30">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-primary">Stress Level</span>
                  <span className="font-mono text-amber-400">
                    {stress ? WELLNESS_SCALE_LABELS.stress[stress] : "Not rated"}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {([1, 2, 3, 4, 5] as WellnessRating1to5[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setStress(val)}
                      className={cn(
                        "h-8 rounded border text-xs font-mono font-bold transition-all",
                        stress === val
                          ? "border-amber-500 bg-amber-500/20 text-amber-400 ring-1 ring-amber-500"
                          : "border-border-subtle bg-bg-base text-text-placeholder hover:text-primary"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motivation (Higher is better) */}
              <div className="space-y-1.5 p-3 rounded-lg border border-border-subtle bg-bg-base/30">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-primary">Motivation to Train</span>
                  <span className="font-mono text-cyan-400">
                    {motivation ? WELLNESS_SCALE_LABELS.motivation[motivation] : "Not rated"}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {([1, 2, 3, 4, 5] as WellnessRating1to5[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMotivation(val)}
                      className={cn(
                        "h-8 rounded border text-xs font-mono font-bold transition-all",
                        motivation === val
                          ? "border-cyan-500 bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500"
                          : "border-border-subtle bg-bg-base text-text-placeholder hover:text-primary"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Muscle Soreness by Group (0-5) */}
          <div className="space-y-3 border-t border-border-subtle pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary uppercase">
                <Activity className="h-3.5 w-3.5 text-accent" />
                <span>3. Muscle Soreness Map</span>
              </div>
              <span className="text-[10px] text-text-placeholder font-mono">
                Click rating (0: Fresh, 5: Severe DOMS)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MUSCLE_GROUPS.map((m) => {
                const currentRating = muscleSoreness[m.id] ?? 0
                return (
                  <div
                    key={m.id}
                    className="p-2 rounded border border-border-subtle bg-bg-base/40 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-medium text-primary">{m.label}</span>
                    <div className="flex items-center gap-1">
                      {([0, 1, 2, 3, 4, 5] as SorenessRating[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleSorenessToggle(m.id, r)}
                          className={cn(
                            "w-6 h-6 rounded text-[10px] font-mono font-bold transition-all flex items-center justify-center",
                            currentRating === r
                              ? r === 0
                                ? "bg-bg-elevated text-text-secondary border border-border-default"
                                : r <= 2
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                : "bg-rose-500/25 text-rose-400 border border-rose-500/50"
                              : "text-text-placeholder hover:text-text-secondary"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 4: Advanced Biometrics (Optional) */}
          <div className="border-t border-border-subtle pt-3 space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-xs font-mono text-text-secondary hover:text-primary py-1"
            >
              <div className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                <span>Optional Biometrics (HRV & Resting HR)</span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border-subtle bg-bg-base/30 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="text-[11px] text-text-secondary">Resting HR (bpm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 52"
                    value={restingHR}
                    onChange={(e) => setRestingHR(e.target.value)}
                    className="w-full h-8 px-2.5 rounded border border-border-default bg-bg-surface font-mono text-xs text-primary outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-text-secondary">HRV rMSSD (ms)</label>
                  <input
                    type="number"
                    placeholder="e.g. 74"
                    value={hrv}
                    onChange={(e) => setHrv(e.target.value)}
                    className="w-full h-8 px-2.5 rounded border border-border-default bg-bg-surface font-mono text-xs text-primary outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Optional Notes */}
          <div className="space-y-1 border-t border-border-subtle pt-3">
            <label className="text-[11px] text-text-secondary font-mono">
              Optional Recovery Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Woke up feeling energized, slight quad stiffness from heavy squats yesterday."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded border border-border-default bg-bg-base text-xs text-primary placeholder-text-placeholder outline-none focus:border-accent resize-none font-sans"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded border border-border-default text-text-secondary hover:text-primary text-xs font-mono transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded bg-accent text-bg-base font-bold text-xs hover:bg-accent-hover transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="h-4 w-4" /> Save Recovery Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
