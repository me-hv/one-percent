"use client"

import { useState, useMemo, useEffect } from "react"
import { useBodyStore } from "@/features/body/store/body.store"
import { formatDateShort, formatDateCompact, todayKey, formatDateKey, subDays } from "@/lib/utils/date"
import type { WeightLog, ProgressPhoto, BodyMeasurements, ProgressPhotoPose } from "@/lib/types/body.types"
import { toast } from "sonner"
import {
  Scale,
  Ruler,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  ArrowRightLeft,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

// ─── Linear Regression Helper for Trendline ───────────────────────
function calculateTrendline(data: { x: number; y: number }[]): { x: number; y: number }[] {
  if (data.length < 2) return []
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  const n = data.length
  data.forEach((pt) => {
    sumX += pt.x
    sumY += pt.y
    sumXY += pt.x * pt.y
    sumXX += pt.x * pt.x
  })
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return data.map((pt) => ({
    x: pt.x,
    y: slope * pt.x + intercept,
  }))
}

// ─── Moving Average Helper (7-day window) ─────────────────────────
function calculateMovingAverage(logs: { date: string; weight: number }[]): { date: string; avg: number }[] {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((log, idx) => {
    const startIdx = Math.max(0, idx - 6)
    const windowLogs = sorted.slice(startIdx, idx + 1)
    const sum = windowLogs.reduce((acc, l) => acc + l.weight, 0)
    return {
      date: log.date,
      avg: Math.round((sum / windowLogs.length) * 10) / 10,
    }
  })
}

export default function BodyPage() {
  const {
    weightLogs,
    measurements,
    photos,
    addWeightLog,
    deleteWeightLog,
    addMeasurements,
    deleteMeasurements,
    addProgressPhoto,
    deleteProgressPhoto,
  } = useBodyStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [activeTab, setActiveTab] = useState<"weight" | "measurements" | "photos">("weight")

  // ─── Weight Sub-states ──────────────────────────────────────────
  const [weightInput, setWeightInput] = useState("")
  const [weightNotes, setWeightNotes] = useState("")
  const [weightDate, setWeightDate] = useState(todayKey())
  const [weightPeriod, setWeightPeriod] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d")

  // ─── Measurements Sub-states ────────────────────────────────────
  const [showMeasForm, setShowMeasForm] = useState(false)
  const [measWaist, setMeasWaist] = useState("")
  const [measChest, setMeasChest] = useState("")
  const [measHips, setMeasHips] = useState("")
  const [measArms, setMeasArms] = useState("")
  const [measNeck, setMeasNeck] = useState("")
  const [measThighs, setMeasThighs] = useState("")
  const [measCalves, setMeasCalves] = useState("")
  const [measDate, setMeasDate] = useState(todayKey())

  // ─── Photos Sub-states ──────────────────────────────────────────
  const [photoPose, setPhotoPose] = useState<ProgressPhotoPose>("front")
  const [photoNotes, setPhotoNotes] = useState("")
  const [photoFilter, setPhotoFilter] = useState<"all" | "front" | "side" | "back">("all")
  const [compareBeforeId, setCompareBeforeId] = useState<string>("")
  const [compareAfterId, setCompareAfterId] = useState<string>("")
  const [photoSliderPct, setPhotoSliderPct] = useState(50)

  // ─── Weight Calculations ────────────────────────────────────────
  const sortedWeightLogs = useMemo(() => {
    return [...weightLogs].sort((a, b) => a.date.localeCompare(b.date))
  }, [weightLogs])

  const filteredWeightLogs = useMemo(() => {
    const now = new Date()
    let cutoff = new Date(0)
    if (weightPeriod === "7d") cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    else if (weightPeriod === "30d") cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    else if (weightPeriod === "90d") cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    else if (weightPeriod === "1y") cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

    return sortedWeightLogs.filter((log) => new Date(log.date) >= cutoff)
  }, [sortedWeightLogs, weightPeriod])

  const movingAverages = useMemo(() => {
    const list = sortedWeightLogs.map((l) => ({ date: l.date, weight: l.weightKg }))
    return calculateMovingAverage(list)
  }, [sortedWeightLogs])

  const chartData = useMemo(() => {
    // Generate linear regression points for trendline
    const regressionInput = filteredWeightLogs.map((log, idx) => ({
      x: idx,
      y: log.weightKg,
    }))
    const trendPoints = calculateTrendline(regressionInput)

    return filteredWeightLogs.map((log, idx) => {
      const ma = movingAverages.find((m) => m.date === log.date)?.avg
      return {
        dateStr: formatDateCompact(log.date),
        weight: log.weightKg,
        movingAverage: ma,
        trendline: trendPoints[idx] ? Math.round(trendPoints[idx].y * 10) / 10 : undefined,
      }
    })
  }, [filteredWeightLogs, movingAverages])

  const weightStats = useMemo(() => {
    if (sortedWeightLogs.length === 0) return null
    const latest = sortedWeightLogs[sortedWeightLogs.length - 1]!
    const latestWeight = latest.weightKg

    // Calculate weekly changes
    const oneWeekAgoStr = formatDateKey(subDays(new Date(), 7))
    const weightOneWeekAgo = sortedWeightLogs.find((l) => l.date <= oneWeekAgoStr)?.weightKg ?? latestWeight
    const weeklyChange = Math.round((latestWeight - weightOneWeekAgo) * 10) / 10

    // Calculate monthly changes
    const oneMonthAgoStr = formatDateKey(subDays(new Date(), 30))
    const weightOneMonthAgo = sortedWeightLogs.find((l) => l.date <= oneMonthAgoStr)?.weightKg ?? latestWeight
    const monthlyChange = Math.round((latestWeight - weightOneMonthAgo) * 10) / 10

    // Latest moving average
    const latestMA = movingAverages[movingAverages.length - 1]?.avg ?? latestWeight

    return {
      current: latestWeight,
      weeklyChange,
      monthlyChange,
      movingAverage: latestMA,
    }
  }, [sortedWeightLogs, movingAverages])

  // ─── Actions ────────────────────────────────────────────────────
  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault()
    const weight = parseFloat(weightInput)
    if (!weight || weight <= 0) {
      toast.error("Please enter a valid body weight")
      return
    }
    addWeightLog(weight, weightNotes.trim(), weightDate)
    toast.success("Weight log added successfully")
    setWeightInput("")
    setWeightNotes("")
  }

  const handleAddMeasurements = (e: React.FormEvent) => {
    e.preventDefault()
    addMeasurements({
      date: measDate,
      waist: measWaist ? parseFloat(measWaist) : undefined,
      chest: measChest ? parseFloat(measChest) : undefined,
      hips: measHips ? parseFloat(measHips) : undefined,
      bicepLeft: measArms ? parseFloat(measArms) : undefined,
      bicepRight: measArms ? parseFloat(measArms) : undefined,
      neck: measNeck ? parseFloat(measNeck) : undefined,
      thighLeft: measThighs ? parseFloat(measThighs) : undefined,
      thighRight: measThighs ? parseFloat(measThighs) : undefined,
      calfLeft: measCalves ? parseFloat(measCalves) : undefined,
      calfRight: measCalves ? parseFloat(measCalves) : undefined,
    })
    toast.success("Body measurements logged")
    setShowMeasForm(false)
    setMeasWaist("")
    setMeasChest("")
    setMeasHips("")
    setMeasArms("")
    setMeasNeck("")
    setMeasThighs("")
    setMeasCalves("")
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 4MB for localStorage base64 safety
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Photo exceeds 4MB limit. Please compress first.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        addProgressPhoto(reader.result, photoPose, photoNotes.trim())
        toast.success("Progress photo added")
        setPhotoNotes("")
      }
    }
    reader.readAsDataURL(file)
  }

  // ─── Comparative Photos Selection ───────────────────────────────
  const poseFilteredPhotos = useMemo(() => {
    if (photoFilter === "all") return photos
    return photos.filter((p) => p.pose === photoFilter)
  }, [photos, photoFilter])

  const beforePhoto = useMemo(() => photos.find((p) => p.id === compareBeforeId), [photos, compareBeforeId])
  const afterPhoto = useMemo(() => photos.find((p) => p.id === compareAfterId), [photos, compareAfterId])

  return (
    <div className="page-container space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="page-title">Body Progress</h2>
          <p className="text-sm text-text-secondary mt-1">
            Track metrics, circumferences, and photos to map visual physical changes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle">
        {[
          { id: "weight", label: "Weight Logs", icon: Scale },
          { id: "measurements", label: "Measurements", icon: Ruler },
          { id: "photos", label: "Progress Photos", icon: ImageIcon },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px",
                active
                  ? "border-accent text-primary"
                  : "border-transparent text-text-secondary hover:text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ─── TAB: Weight Logs ────────────────────────────────────────── */}
      {activeTab === "weight" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          {weightStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">Current Weight</span>
                <span className="text-2xl font-bold font-mono text-primary">{weightStats.current} kg</span>
              </div>
              <div className="card p-4 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">7d Moving Avg</span>
                <span className="text-2xl font-bold font-mono text-text-secondary">{weightStats.movingAverage} kg</span>
              </div>
              <div className="card p-4 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">Weekly Change</span>
                <div className="flex items-center gap-1.5">
                  {weightStats.weeklyChange <= 0 ? (
                    <TrendingDown className="h-5 w-5 text-accent" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-warning" />
                  )}
                  <span className={cn("text-xl font-bold font-mono", weightStats.weeklyChange <= 0 ? "text-accent" : "text-warning")}>
                    {weightStats.weeklyChange > 0 ? `+${weightStats.weeklyChange}` : weightStats.weeklyChange} kg
                  </span>
                </div>
              </div>
              <div className="card p-4 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">Monthly Change</span>
                <div className="flex items-center gap-1.5">
                  {weightStats.monthlyChange <= 0 ? (
                    <TrendingDown className="h-5 w-5 text-accent" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-warning" />
                  )}
                  <span className={cn("text-xl font-bold font-mono", weightStats.monthlyChange <= 0 ? "text-accent" : "text-warning")}>
                    {weightStats.monthlyChange > 0 ? `+${weightStats.monthlyChange}` : weightStats.monthlyChange} kg
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Graph Section */}
          <div className="card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">Weight Progression</span>
              <div className="flex rounded border border-border-default overflow-hidden">
                {[
                  { id: "7d", label: "7D" },
                  { id: "30d", label: "30D" },
                  { id: "90d", label: "90D" },
                  { id: "1y", label: "1Y" },
                  { id: "all", label: "ALL" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setWeightPeriod(p.id as any)}
                    className={cn(
                      "px-2.5 h-7 text-[10px] font-mono transition-colors",
                      weightPeriod === p.id ? "bg-bg-elevated text-primary" : "text-text-secondary hover:bg-bg-elevated/50"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-text-placeholder">
                  No weight entries logged for this period.
                </div>
              ) : !mounted ? (
                <div className="h-full w-full animate-pulse bg-bg-elevated/10 rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1F1F1F" strokeDasharray="3 3" />
                    <XAxis dataKey="dateStr" stroke="#737373" fontSize={9} tickLine={false} />
                    <YAxis
                      stroke="#737373"
                      fontSize={9}
                      domain={["dataMin - 1", "dataMax + 1"]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: "#171717", borderColor: "#262626", borderRadius: "8px" }}
                      labelStyle={{ color: "#737373", fontSize: "10px", fontFamily: "monospace" }}
                      itemStyle={{ color: "#E5E5E5", fontSize: "11px" }}
                    />
                    <Area
                      type="monotone"
                      name="Logged"
                      dataKey="weight"
                      stroke="#22C55E"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#weightGrad)"
                    />
                    <Line
                      type="monotone"
                      name="Moving Avg"
                      dataKey="movingAverage"
                      stroke="#3B82F6"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      name="Trendline"
                      dataKey="trendline"
                      stroke="#737373"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Log form */}
            <form onSubmit={handleAddWeight} className="md:col-span-4 card p-5 space-y-4 h-fit">
              <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider block border-b border-border-subtle pb-2">
                New Weigh-in
              </span>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="e.g. 78.4"
                  className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-sm outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Date</label>
                <input
                  type="date"
                  value={weightDate}
                  onChange={(e) => setWeightDate(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Notes</label>
                <input
                  type="text"
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                  placeholder="Fasted, post-workout, etc."
                  className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-9 rounded bg-accent text-bg-base hover:bg-accent-hover font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Save Weigh-in
              </button>
            </form>

            {/* History logs */}
            <div className="md:col-span-8 card p-5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider block border-b border-border-subtle pb-2">
                History
              </span>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-text-placeholder uppercase font-mono text-[9px] tracking-wider text-left">
                      <th className="py-2">Date</th>
                      <th className="py-2">Weight</th>
                      <th className="py-2">Notes</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50">
                    {weightLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-bg-elevated/10">
                        <td className="py-2.5 font-mono text-text-secondary">{formatDateShort(log.date)}</td>
                        <td className="py-2.5 font-bold font-mono text-primary">{log.weightKg} kg</td>
                        <td className="py-2.5 text-text-secondary max-w-[150px] truncate" title={log.notes}>{log.notes || "—"}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => { deleteWeightLog(log.id); toast.success("Weight entry deleted") }}
                            className="p-1 rounded hover:bg-negative-bg/20 text-text-placeholder hover:text-negative transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {weightLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-text-placeholder">
                          No weigh-in logs saved.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Measurements ────────────────────────────────────────── */}
      {activeTab === "measurements" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">Circumference Tracker</span>
            <button
              onClick={() => setShowMeasForm(!showMeasForm)}
              className="h-8 px-3 rounded border border-border-default hover:bg-bg-elevated text-primary text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Log Measurements
            </button>
          </div>

          {/* Log Measurements Form Overlay panel */}
          {showMeasForm && (
            <form onSubmit={handleAddMeasurements} className="card p-5 space-y-4 border border-accent/20 bg-bg-surface/50 animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">Record circumference metrics</span>
                <span className="text-[10px] text-text-placeholder font-mono">All values in cm</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase">Waist</label>
                  <input type="number" step="0.1" value={measWaist} onChange={(e) => setMeasWaist(e.target.value)} placeholder="At navel" className="w-full h-8 px-2.5 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase">Chest</label>
                  <input type="number" step="0.1" value={measChest} onChange={(e) => setMeasChest(e.target.value)} placeholder="Chest" className="w-full h-8 px-2.5 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase">Hips</label>
                  <input type="number" step="0.1" value={measHips} onChange={(e) => setMeasHips(e.target.value)} placeholder="Hips" className="w-full h-8 px-2.5 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase">Arms (Bicep)</label>
                  <input type="number" step="0.1" value={measArms} onChange={(e) => setMeasArms(e.target.value)} placeholder="Arms" className="w-full h-8 px-2.5 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase">Neck</label>
                  <input type="number" step="0.1" value={measNeck} onChange={(e) => setMeasNeck(e.target.value)} placeholder="Neck" className="w-full h-8 px-2.5 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase">Thighs</label>
                  <input type="number" step="0.1" value={measThighs} onChange={(e) => setMeasThighs(e.target.value)} placeholder="Thigh" className="w-full h-8 px-2.5 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase">Calves</label>
                  <input type="number" step="0.1" value={measCalves} onChange={(e) => setMeasCalves(e.target.value)} placeholder="Calf" className="w-full h-8 px-2.5 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-text-placeholder uppercase">Log Date</label>
                  <input type="date" value={measDate} onChange={(e) => setMeasDate(e.target.value)} className="w-full h-8 px-2.5 rounded border border-border-default bg-bg-base text-primary text-xs outline-none" />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowMeasForm(false)} className="h-8 px-4 rounded border border-border-default text-primary text-xs hover:bg-bg-elevated">Cancel</button>
                <button type="submit" className="h-8 px-4 rounded bg-accent text-bg-base hover:bg-accent-hover font-bold text-xs">Save Log</button>
              </div>
            </form>
          )}

          {/* Measurements grid list */}
          {measurements.length === 0 ? (
            <div className="card p-12 text-center text-text-placeholder text-xs">
              No measurements logged. Log your first circumference entries.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Latest Measurements Comparison Summary */}
              {measurements.length > 1 && (
                <div className="card p-5 space-y-4 bg-bg-surface/30 border border-border-subtle">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent font-mono">
                    <Sparkles className="h-4 w-4" />
                    COMPARED TO ALL-TIME BASELINE ({formatDateShort(measurements[measurements.length - 1]?.date || "")})
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { name: "Waist", key: "waist" as const, unit: "cm" },
                      { name: "Chest", key: "chest" as const, unit: "cm" },
                      { name: "Arms", key: "bicepLeft" as const, unit: "cm" },
                      { name: "Neck", key: "neck" as const, unit: "cm" },
                    ].map((item) => {
                      const latest = measurements[0]?.[item.key]
                      const baseline = measurements[measurements.length - 1]?.[item.key]
                      if (latest == null || baseline == null) return null
                      const diff = Math.round((latest - baseline) * 10) / 10
                      return (
                        <div key={item.key} className="space-y-1">
                          <span className="text-[10px] text-text-placeholder font-mono uppercase tracking-wider block">{item.name}</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono font-bold text-primary text-lg">{latest} {item.unit}</span>
                            <span className={cn("text-[10px] font-bold font-mono", diff < 0 ? "text-accent" : diff > 0 ? "text-warning" : "text-text-placeholder")}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* History Table */}
              <div className="card p-5 space-y-4">
                <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider block border-b border-border-subtle pb-2">
                  Logs History
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border-subtle text-text-placeholder uppercase font-mono text-[9px] tracking-wider">
                        <th className="py-2">Date</th>
                        <th className="py-2">Waist</th>
                        <th className="py-2">Chest</th>
                        <th className="py-2">Hips</th>
                        <th className="py-2">Arms</th>
                        <th className="py-2">Neck</th>
                        <th className="py-2">Thighs</th>
                        <th className="py-2">Calves</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/50">
                      {measurements.map((m) => (
                        <tr key={m.id} className="hover:bg-bg-elevated/10">
                          <td className="py-3 font-mono text-text-secondary">{formatDateShort(m.date)}</td>
                          <td className="py-3 font-mono text-primary font-semibold">{m.waist ? `${m.waist} cm` : "—"}</td>
                          <td className="py-3 font-mono text-primary">{m.chest ? `${m.chest} cm` : "—"}</td>
                          <td className="py-3 font-mono text-primary">{m.hips ? `${m.hips} cm` : "—"}</td>
                          <td className="py-3 font-mono text-primary">{m.bicepLeft ? `${m.bicepLeft} cm` : "—"}</td>
                          <td className="py-3 font-mono text-primary">{m.neck ? `${m.neck} cm` : "—"}</td>
                          <td className="py-3 font-mono text-primary">{m.thighLeft ? `${m.thighLeft} cm` : "—"}</td>
                          <td className="py-3 font-mono text-primary">{m.calfLeft ? `${m.calfLeft} cm` : "—"}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => { deleteMeasurements(m.id); toast.success("Measurements log deleted") }}
                              className="p-1 rounded hover:bg-negative-bg/20 text-text-placeholder hover:text-negative transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Progress Photos ──────────────────────────────────────── */}
      {activeTab === "photos" && (
        <div className="space-y-6">
          {/* Section: Upload */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 card p-5 space-y-4 h-fit">
              <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider block border-b border-border-subtle pb-2">
                Upload Progress Photo
              </span>

              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Pose Category</label>
                <div className="grid grid-cols-4 gap-1">
                  {(["front", "side", "back", "relaxed"] as const).map((pose) => (
                    <button
                      key={pose}
                      type="button"
                      onClick={() => setPhotoPose(pose)}
                      className={cn(
                        "h-8 rounded border text-[10px] font-mono capitalize transition-all",
                        photoPose === pose
                          ? "border-accent text-accent bg-accent/10"
                          : "border-border-subtle text-text-placeholder hover:border-border-default"
                      )}
                    >
                      {pose}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">Caption Notes</label>
                <input
                  type="text"
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  placeholder="Morning checks, relaxed pose..."
                  className="w-full h-9 px-3 rounded border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent text-xs outline-none"
                />
              </div>

              {/* Real drag and drop simulated uploader */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-default hover:border-accent rounded-lg cursor-pointer bg-bg-base/20 transition-colors group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  <Upload className="h-6 w-6 text-text-placeholder group-hover:text-accent mb-2 transition-colors" />
                  <p className="text-xs text-text-secondary"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                  <p className="text-[9px] text-text-placeholder font-mono uppercase mt-1">PNG, JPG up to 4MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Section: Split screen side-by-side comparison slider */}
            <div className="md:col-span-8 card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-subtle pb-2">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-accent" />
                  <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">Side-By-Side Visual Slider</span>
                </div>

                {/* Dropdowns to select comparison images */}
                <div className="flex gap-2 text-xs font-mono">
                  <select
                    value={compareBeforeId}
                    onChange={(e) => setCompareBeforeId(e.target.value)}
                    className="h-8 px-2 rounded border border-border-default bg-bg-base text-primary outline-none"
                  >
                    <option value="">Select Baseline (Before)</option>
                    {photos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatDateShort(p.date)} ({p.pose})
                      </option>
                    ))}
                  </select>

                  <select
                    value={compareAfterId}
                    onChange={(e) => setCompareAfterId(e.target.value)}
                    className="h-8 px-2 rounded border border-border-default bg-bg-base text-primary outline-none"
                  >
                    <option value="">Select Follow-up (After)</option>
                    {photos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatDateShort(p.date)} ({p.pose})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slider View container */}
              {beforePhoto && afterPhoto ? (
                <div className="space-y-4">
                  <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-lg overflow-hidden border border-border-default select-none">
                    {/* Before Image (underneath) */}
                    <img
                      src={beforePhoto.url}
                      alt="Before"
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />

                    {/* After Image (sliding crop on top) */}
                    <div
                      className="absolute inset-y-0 left-0 right-0 overflow-hidden"
                      style={{ clipPath: `polygon(0 0, ${photoSliderPct}% 0, ${photoSliderPct}% 100%, 0 100%)` }}
                    >
                      <img
                        src={afterPhoto.url}
                        alt="After"
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                      />
                    </div>

                    {/* Sliding line & handle */}
                    <div
                      className="absolute inset-y-0 w-0.5 bg-accent cursor-ew-resize"
                      style={{ left: `${photoSliderPct}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-accent text-bg-base flex items-center justify-center text-[10px] font-bold shadow-lg border border-white/20">
                        ↔
                      </div>
                    </div>

                    {/* User slider overlay input */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={photoSliderPct}
                      onChange={(e) => setPhotoSliderPct(parseInt(e.target.value))}
                      className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                    />
                  </div>

                  <div className="flex justify-between max-w-md mx-auto text-[10px] font-mono text-text-placeholder uppercase">
                    <span>Before: {formatDateShort(beforePhoto.date)}</span>
                    <span>After: {formatDateShort(afterPhoto.date)}</span>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-lg text-xs text-text-placeholder text-center p-8 space-y-2">
                  <ArrowRightLeft className="h-8 w-8 text-text-placeholder" />
                  <p>Select a "Before" and "After" photo from the dropdowns above to compare physical differences live.</p>
                </div>
              )}
            </div>
          </div>

          {/* Grid list of progress photos */}
          <div className="space-y-4 pt-4 border-t border-border-subtle/50">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">Photo Log Library</span>
              <div className="flex gap-1">
                {(["all", "front", "side", "back"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPhotoFilter(filter)}
                    className={cn(
                      "px-2.5 h-6 rounded text-[9px] font-mono uppercase tracking-wider transition-colors",
                      photoFilter === filter ? "bg-bg-elevated text-primary border border-border-default" : "text-text-placeholder hover:text-primary"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-4">
              {poseFilteredPhotos.map((photo) => (
                <div key={photo.id} className="group relative card overflow-hidden border border-border-subtle aspect-[3/4] flex flex-col">
                  <img src={photo.url} alt={photo.pose} className="w-full h-full object-cover flex-1" />
                  
                  {/* Hover Actions / Info overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => { deleteProgressPhoto(photo.id); toast.success("Photo removed") }}
                      className="p-1 rounded bg-black/60 hover:bg-negative-bg/40 text-text-placeholder hover:text-negative self-end transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block capitalize">{photo.pose}</span>
                      <span className="text-[9px] text-text-secondary font-mono block">{formatDateShort(photo.date)}</span>
                      {photo.notes && <p className="text-[9px] text-text-placeholder line-clamp-2 leading-tight">{photo.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}

              {poseFilteredPhotos.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-text-placeholder card border-dashed">
                  No progress photos found for the selected pose category.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
