"use client"

import { useMemo, useState, useEffect } from "react"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { useBodyStore } from "@/features/body/store/body.store"
import { useAuthStore } from "@/lib/store/auth.store"
import { useAnalyticsStore, type AnalyticsTimeframe } from "@/features/analytics/store/analytics.store"
import { generateSmartInsights } from "@/features/analytics/services/insights.service"
import { TrainingCalendar } from "@/features/analytics/components/TrainingCalendar"
import { PRLeaderboard } from "@/features/analytics/components/PRLeaderboard"
import { formatDateShort, subDays, formatDateCompact, formatDateKey } from "@/lib/utils/date"
import type { WorkoutSession } from "@/lib/types/training.types"
import {
  TrendingUp,
  Clock,
  Sparkles,
  Trophy,
  Calendar as CalendarIcon,
  BarChart2,
  Zap,
  Activity,
  Flame,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

// ─── Rich Seed Workout History (Last 90 Days) ─────────────────────
const seedMockWorkouts = (): WorkoutSession[] => {
  const list: WorkoutSession[] = []
  const workoutTemplates = [
    { name: "Push Day A", muscles: ["chest" as const, "shoulders" as const, "triceps" as const], baseVol: 8200 },
    { name: "Pull Day A", muscles: ["back" as const, "biceps" as const, "forearms" as const], baseVol: 9100 },
    { name: "Legs Day A", muscles: ["quads" as const, "hamstrings" as const, "glutes" as const, "calves" as const], baseVol: 11000 },
    { name: "Upper Power B", muscles: ["chest" as const, "back" as const, "shoulders" as const, "biceps" as const, "triceps" as const], baseVol: 9800 },
    { name: "Lower Power B", muscles: ["quads" as const, "glutes" as const, "hamstrings" as const, "core" as const], baseVol: 12200 },
  ]

  for (let i = 90; i >= 1; i--) {
    if ((i % 7) === 0 || (i % 7) === 3 || (i % 7) === 5) continue

    const date = subDays(new Date(), i)
    const template = workoutTemplates[i % workoutTemplates.length] || workoutTemplates[0]!
    
    const progressionBonus = (90 - i) * 80
    const noise = (Math.random() - 0.5) * 800
    const volume = Math.round(template.baseVol + progressionBonus + noise)
    const duration = Math.round(45 * 60 + (90 - i) * 10 + Math.random() * 20 * 60)
    const rpe = Math.round((7.0 + Math.sin(i * 0.7) * 1.2 + Math.random() * 0.5) * 10) / 10

    const ts = {
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: () => date,
    } as any

    list.push({
      id: `mock-session-${i}`,
      userId: "user-1",
      name: template.name,
      status: "completed" as const,
      exercises: [],
      exerciseCount: 3,
      totalVolume: volume,
      totalSets: 12 + (i % 6),
      totalReps: 60 + (i % 40),
      durationSeconds: duration,
      averageRpe: Math.min(Math.max(rpe, 5), 10),
      musclesWorked: template.muscles,
      startedAt: ts,
      completedAt: ts,
      createdAt: ts,
      updatedAt: ts,
    })
  }
  return list.sort((a, b) => (b.completedAt?.toDate?.() ? b.completedAt.toDate().getTime() : 0) - (a.completedAt?.toDate?.() ? a.completedAt.toDate().getTime() : 0))
}

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const { data: dbHistory } = useWorkoutHistory(user?.uid ?? "")
  const { weightLogs, measurements, habitLogs } = useBodyStore()
  const { timeframe, setTimeframe, activeTab, setActiveTab } = useAnalyticsStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Merge database logs with mock history
  const workoutHistory = useMemo(() => {
    const dbLogs = dbHistory || []
    const mocks = seedMockWorkouts()
    const merged = [...dbLogs, ...mocks]
    return merged.sort((a, b) => {
      const dateA = a.completedAt?.toDate?.() ? a.completedAt.toDate().getTime() : Date.now()
      const dateB = b.completedAt?.toDate?.() ? b.completedAt.toDate().getTime() : Date.now()
      return dateB - dateA
    })
  }, [dbHistory])

  // Filter workout history by selected timeframe
  const filteredHistory = useMemo(() => {
    const now = new Date()
    let cutoff = new Date(0)
    if (timeframe === "7d") cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    else if (timeframe === "30d") cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    else if (timeframe === "90d") cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    else if (timeframe === "1y") cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

    return workoutHistory.filter((w) => {
      const d = w.completedAt?.toDate?.() ? w.completedAt.toDate() : new Date()
      return d >= cutoff
    })
  }, [workoutHistory, timeframe])

  // 1. Chronological history for charts
  const chronologicalHistory = useMemo(() => {
    return [...filteredHistory].reverse().map((w) => {
      const date = w.completedAt?.toDate?.() ? w.completedAt.toDate() : new Date()
      return {
        dateStr: formatDateCompact(date),
        volume: w.totalVolume,
        duration: Math.round((w.durationSeconds || 0) / 60),
        rpe: w.averageRpe || 0,
        calories: Math.round((w.durationSeconds || 3600) / 60 * 7.5),
      }
    })
  }, [filteredHistory])

  // 2. Weekly aggregations
  const weeklyFrequencyData = useMemo(() => {
    const weeksMap: Record<string, { weekLabel: string; sessions: number; volume: number }> = {}
    
    filteredHistory.forEach((w) => {
      const d = w.completedAt?.toDate?.() ? w.completedAt.toDate() : new Date()
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(d.setDate(diff))
      const weekStr = formatDateKey(monday)
      const weekLabel = `W/O ${formatDateCompact(monday)}`
      
      if (!weeksMap[weekStr]) {
        weeksMap[weekStr] = { weekLabel, sessions: 0, volume: 0 }
      }
      weeksMap[weekStr].sessions += 1
      weeksMap[weekStr].volume += w.totalVolume
    })

    return Object.values(weeksMap).reverse()
  }, [filteredHistory])

  // 3. Target Muscle Distribution
  const muscleDistribution = useMemo(() => {
    const musclesMap: Record<string, number> = {}
    filteredHistory.forEach((w) => {
      w.musclesWorked?.forEach((muscle: string) => {
        musclesMap[muscle] = (musclesMap[muscle] || 0) + (w.totalSets || 12)
      })
    })

    return Object.entries(musclesMap).map(([subject, value]) => ({
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      value,
      fullMark: Math.max(...Object.values(musclesMap)) + 5,
    }))
  }, [filteredHistory])

  // 4. Overall Analytics Stats
  const stats = useMemo(() => {
    if (filteredHistory.length === 0) return null
    const totalVolume = filteredHistory.reduce((acc, w) => acc + w.totalVolume, 0)
    const totalDuration = filteredHistory.reduce((acc, w) => acc + (w.durationSeconds || 0), 0)
    const averageVolume = Math.round(totalVolume / filteredHistory.length)
    const averageDuration = Math.round((totalDuration / filteredHistory.length) / 60)
    const averageRpe = Math.round((filteredHistory.reduce((acc, w) => acc + (w.averageRpe || 0), 0) / filteredHistory.length) * 10) / 10

    const latestVol = filteredHistory.slice(0, 4).reduce((acc, w) => acc + w.totalVolume, 0)
    const oldestVol = filteredHistory.slice(-4).reduce((acc, w) => acc + w.totalVolume, 0)
    const volumeIncreasePct = oldestVol > 0 ? Math.round(((latestVol - oldestVol) / oldestVol) * 100) : 0

    return {
      sessionsCount: filteredHistory.length,
      averageVolume,
      averageDuration,
      averageRpe,
      volumeIncreasePct,
    }
  }, [filteredHistory])

  // 5. Smart Insights
  const smartInsights = useMemo(() => {
    return generateSmartInsights(workoutHistory, weightLogs, measurements, habitLogs)
  }, [workoutHistory, weightLogs, measurements, habitLogs])

  return (
    <div className="page-container space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="page-title">Progress Intelligence</h2>
          <p className="text-sm text-text-secondary mt-1">
            Data-driven training analytics, volume progression, PR leaderboards, and deterministic insights.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex rounded border border-border-default overflow-hidden self-start sm:self-auto">
          {[
            { id: "7d", label: "7 Days" },
            { id: "30d", label: "30 Days" },
            { id: "90d", label: "90 Days" },
            { id: "1y", label: "1 Year" },
            { id: "all", label: "All Time" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id as AnalyticsTimeframe)}
              className={cn(
                "px-3 h-8 text-[11px] font-mono transition-colors",
                timeframe === t.id ? "bg-bg-elevated text-primary" : "text-text-secondary hover:bg-bg-elevated/50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border-subtle overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: BarChart2 },
          { id: "prs", label: "PR Leaderboard", icon: Trophy },
          { id: "calendar", label: "Training Calendar", icon: CalendarIcon },
          { id: "insights", label: "Smart Insights", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px flex items-center gap-1.5 shrink-0",
                activeTab === tab.id
                  ? "border-accent text-primary"
                  : "border-transparent text-text-secondary hover:text-primary"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB: Overview & Charts */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">Workouts Done</span>
                <span className="text-2xl font-bold font-mono text-primary">{stats.sessionsCount} sessions</span>
              </div>
              <div className="card p-4 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">Avg Session Volume</span>
                <span className="text-2xl font-bold font-mono text-primary">{stats.averageVolume.toLocaleString()} kg</span>
              </div>
              <div className="card p-4 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">Avg Duration</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-accent" />
                  <span className="text-2xl font-bold font-mono text-primary">{stats.averageDuration} mins</span>
                </div>
              </div>
              <div className="card p-4 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase block">Load Progression</span>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="text-2xl font-bold font-mono text-accent">+{stats.volumeIncreasePct}% volume</span>
                </div>
              </div>
            </div>
          )}

          {/* Primary Graphs Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Total Volume lifted */}
            <div className="md:col-span-8 card p-5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider block">Training Volume Progression (kg)</span>
              <div className="h-64 w-full">
                {!mounted ? (
                  <div className="h-full w-full animate-pulse bg-bg-elevated/10 rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chronologicalHistory} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
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
                      <Area type="monotone" dataKey="volume" name="Volume" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#volGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Muscle group distribution radar */}
            <div className="md:col-span-4 card p-5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider block">Target Muscle Focus (Sets)</span>
              <div className="h-64 w-full flex items-center justify-center">
                {!mounted ? (
                  <div className="h-full w-full animate-pulse bg-bg-elevated/10 rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={muscleDistribution}>
                      <PolarGrid stroke="#262626" />
                      <PolarAngleAxis dataKey="subject" stroke="#737373" fontSize={9} />
                      <PolarRadiusAxis stroke="#262626" fontSize={8} tick={false} />
                      <Radar name="Sets" dataKey="value" stroke="#22C55E" fill="#22C55E" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Graphs Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly frequency */}
            <div className="card p-5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider block">Workout Frequency (Sessions / Week)</span>
              <div className="h-60 w-full">
                {!mounted ? (
                  <div className="h-full w-full animate-pulse bg-bg-elevated/10 rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyFrequencyData} margin={{ left: -30, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid stroke="#1F1F1F" strokeDasharray="3 3" />
                      <XAxis dataKey="weekLabel" stroke="#737373" fontSize={9} tickLine={false} />
                      <YAxis stroke="#737373" fontSize={9} tickLine={false} axisLine={false} ticks={[1, 2, 3, 4, 5, 6, 7]} />
                      <Tooltip
                        contentStyle={{ background: "#171717", borderColor: "#262626", borderRadius: "8px" }}
                        labelStyle={{ color: "#737373", fontSize: "10px", fontFamily: "monospace" }}
                        itemStyle={{ color: "#E5E5E5", fontSize: "11px" }}
                      />
                      <Bar dataKey="sessions" name="Sessions" fill="#22C55E" radius={[4, 4, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Session RPE Trends */}
            <div className="card p-5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider block">Average Session Intensity (RPE)</span>
              <div className="h-60 w-full">
                {!mounted ? (
                  <div className="h-full w-full animate-pulse bg-bg-elevated/10 rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chronologicalHistory} margin={{ left: -30, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid stroke="#1F1F1F" strokeDasharray="3 3" />
                      <XAxis dataKey="dateStr" stroke="#737373" fontSize={9} tickLine={false} />
                      <YAxis stroke="#737373" fontSize={9} domain={[1, 10]} ticks={[2, 4, 6, 8, 10]} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#171717", borderColor: "#262626", borderRadius: "8px" }}
                        labelStyle={{ color: "#737373", fontSize: "10px", fontFamily: "monospace" }}
                        itemStyle={{ color: "#E5E5E5", fontSize: "11px" }}
                      />
                      <Line type="monotone" dataKey="rpe" name="RPE" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PR Leaderboard */}
      {activeTab === "prs" && (
        <PRLeaderboard sessions={workoutHistory} />
      )}

      {/* TAB: Training Calendar */}
      {activeTab === "calendar" && (
        <TrainingCalendar sessions={workoutHistory} />
      )}

      {/* TAB: Smart Insights Feed */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">
              Deterministic Progress Feed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {smartInsights.map((insight) => (
              <div
                key={insight.id}
                className={cn(
                  "card p-5 space-y-2 border transition-colors",
                  insight.impact === "positive"
                    ? "border-accent/30 bg-accent/5"
                    : insight.impact === "warning"
                    ? "border-warning/30 bg-warning/5"
                    : "border-border-subtle bg-bg-surface/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {insight.impact === "positive" ? (
                      <TrendingUp className="h-4 w-4 text-accent" />
                    ) : insight.impact === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    ) : (
                      <Zap className="h-4 w-4 text-text-placeholder" />
                    )}
                    <h4 className="text-sm font-bold text-primary">{insight.title}</h4>
                  </div>
                  {insight.metricValue && (
                    <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent/15 border border-accent/20">
                      {insight.metricValue}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{insight.description}</p>
                <span className="text-[10px] font-mono text-text-placeholder block pt-1">
                  Generated {insight.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
