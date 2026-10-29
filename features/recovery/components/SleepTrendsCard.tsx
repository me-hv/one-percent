"use client"

import { useMemo, useState } from "react"
import { Moon, Clock, TrendingUp, CheckCircle2 } from "lucide-react"
import type { DailyRecoveryEntry, RecoveryConfig } from "@/lib/types/recovery.types"
import { WELLNESS_SCALE_LABELS } from "@/lib/types/recovery.types"
import { formatDateShort, subDays } from "@/lib/utils/date"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts"

interface SleepTrendsCardProps {
  entries: DailyRecoveryEntry[]
  config: RecoveryConfig
}

export function SleepTrendsCard({ entries, config }: SleepTrendsCardProps) {
  const [timeframeDays, setTimeframeDays] = useState<7 | 14 | 30>(7)

  // Filter entries for chosen timeframe
  const chartData = useMemo(() => {
    const today = new Date()
    const cutoff = subDays(today, timeframeDays - 1)
    const filtered = entries
      .filter((e) => new Date(e.date + "T00:00:00") >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date))

    return filtered.map((e) => {
      const hours = e.sleepDurationMinutes ? e.sleepDurationMinutes / 60 : 0
      return {
        date: formatDateShort(new Date(e.date + "T00:00:00")),
        rawDate: e.date,
        hours: Math.round(hours * 10) / 10,
        quality: e.sleepQuality || null,
        targetHours: config.targetSleepMinutes / 60,
      }
    })
  }, [entries, timeframeDays, config])

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const valid = chartData.filter((d) => d.hours > 0)
    if (valid.length === 0) {
      return {
        avgHours: 0,
        adherencePct: 0,
        avgQuality: 0,
        totalLogged: 0,
      }
    }

    const totalHours = valid.reduce((sum, d) => sum + d.hours, 0)
    const avgHours = Math.round((totalHours / valid.length) * 10) / 10

    const targetMetCount = valid.filter(
      (d) => d.hours >= config.targetSleepMinutes / 60
    ).length
    const adherencePct = Math.round((targetMetCount / valid.length) * 100)

    const qualityItems = valid.filter((d) => d.quality !== null)
    const avgQuality =
      qualityItems.length > 0
        ? Math.round(
            (qualityItems.reduce((sum, d) => sum + (d.quality || 0), 0) /
              qualityItems.length) *
              10
          ) / 10
        : 0

    return {
      avgHours,
      adherencePct,
      avgQuality,
      totalLogged: valid.length,
    }
  }, [chartData, config])

  const targetHours = (config.targetSleepMinutes / 60).toFixed(1)

  return (
    <div className="card p-5 border border-border-default bg-bg-surface space-y-4 font-sans">
      {/* Header with Timeframe selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-accent" />
          <h4 className="text-sm font-bold text-primary">Sleep Duration & Target Tracking</h4>
        </div>

        <div className="flex items-center gap-1 bg-bg-base p-1 rounded-lg border border-border-subtle font-mono text-xs">
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              onClick={() => setTimeframeDays(days)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                timeframeDays === days
                  ? "bg-accent/20 text-accent font-bold"
                  : "text-text-placeholder hover:text-primary"
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/30 space-y-0.5">
          <span className="text-[10px] uppercase text-text-placeholder block">Average Sleep</span>
          <span className="text-base font-bold text-accent block">
            {metrics.avgHours}h{" "}
            <span className="text-[10px] text-text-placeholder">/ {targetHours}h target</span>
          </span>
        </div>

        <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/30 space-y-0.5">
          <span className="text-[10px] uppercase text-text-placeholder block">Target Met Rate</span>
          <span className="text-base font-bold text-emerald-400 block">
            {metrics.adherencePct}%{" "}
            <span className="text-[10px] text-text-placeholder">of nights</span>
          </span>
        </div>

        <div className="p-3 rounded-lg border border-border-subtle bg-bg-base/30 space-y-0.5">
          <span className="text-[10px] uppercase text-text-placeholder block">Avg Sleep Quality</span>
          <span className="text-base font-bold text-primary block">
            {metrics.avgQuality > 0 ? `${metrics.avgQuality} / 5` : "N/A"}
          </span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 12]}
                ticks={[0, 4, 8, 12]}
                unit="h"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0]?.payload
                  return (
                    <div className="p-2.5 rounded-lg border border-border-default bg-bg-surface shadow-xl font-mono text-xs space-y-1">
                      <div className="text-text-placeholder text-[10px]">{data.rawDate}</div>
                      <div className="text-accent font-bold">
                        Duration: {data.hours} hours
                      </div>
                      {data.quality && (
                        <div className="text-text-secondary text-[11px]">
                          Quality: {data.quality}/5 (
                          {
                            WELLNESS_SCALE_LABELS.sleepQuality[
                              data.quality as keyof typeof WELLNESS_SCALE_LABELS.sleepQuality
                            ]
                          }
                          )
                        </div>
                      )}
                    </div>
                  )
                }}
              />
              <ReferenceLine
                y={config.targetSleepMinutes / 60}
                stroke="#22C55E"
                strokeDasharray="3 3"
                label={{
                  value: `${targetHours}h Target`,
                  fill: "#22C55E",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
              <Bar
                dataKey="hours"
                fill="#22C55E"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-text-placeholder font-mono border border-dashed border-border-subtle rounded-lg">
          No sleep logs recorded in this timeframe. Click "Log Recovery Check-In" to log sleep.
        </div>
      )}
    </div>
  )
}
