"use client"

import { useMemo, useState } from "react"
import { TrendingUp, Calendar, AlertCircle } from "lucide-react"
import type { DailyRecoveryEntry, RecoveryConfig } from "@/lib/types/recovery.types"
import { calculateReadinessScore } from "@/features/recovery/services/readiness.service"
import { formatDateShort, subDays } from "@/lib/utils/date"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts"

interface HistoricalReadinessChartProps {
  entries: DailyRecoveryEntry[]
  config: RecoveryConfig
}

export function HistoricalReadinessChart({
  entries,
  config,
}: HistoricalReadinessChartProps) {
  const [timeframeDays, setTimeframeDays] = useState<7 | 14 | 30 | 90>(30)

  // Calculate readiness scores across timeframe
  const chartData = useMemo(() => {
    const today = new Date()
    const cutoff = subDays(today, timeframeDays - 1)
    const filtered = entries
      .filter((e) => new Date(e.date + "T00:00:00") >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date))

    return filtered.map((e) => {
      const res = calculateReadinessScore(e, config)
      return {
        date: formatDateShort(new Date(e.date + "T00:00:00")),
        rawDate: e.date,
        score: res.score,
        category: res.category,
        completeness: res.completenessPct,
      }
    })
  }, [entries, timeframeDays, config])

  const validScores = chartData.filter((d) => d.score != null).map((d) => d.score as number)
  const avgScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((sum, s) => sum + s, 0) / validScores.length)
      : null

  return (
    <div className="card p-5 border border-border-default bg-bg-surface space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <div>
            <h4 className="text-sm font-bold text-primary">Readiness History & Progression</h4>
            <span className="text-[10px] text-text-placeholder font-mono">
              Daily calculated readiness trend over time
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {avgScore != null && (
            <div className="font-mono text-xs text-text-muted">
              Period Average: <strong className="text-accent">{avgScore}/100</strong>
            </div>
          )}

          <div className="flex items-center gap-1 bg-bg-base p-1 rounded-lg border border-border-subtle font-mono text-xs">
            {([7, 14, 30, 90] as const).map((days) => (
              <button
                key={days}
                onClick={() => setTimeframeDays(days)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
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
      </div>

      {/* Area Chart */}
      {chartData.length > 0 ? (
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#222" strokeDasharray="3 3" vertical={false} />
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
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0]?.payload
                  return (
                    <div className="p-3 rounded-lg border border-border-default bg-bg-surface shadow-xl font-mono text-xs space-y-1">
                      <div className="text-text-placeholder text-[10px]">{data.rawDate}</div>
                      {data.score != null ? (
                        <>
                          <div className="text-accent font-bold text-sm">
                            Readiness: {data.score} / 100
                          </div>
                          <div className="text-text-secondary text-[11px]">
                            {data.category} ({data.completeness}% completeness)
                          </div>
                        </>
                      ) : (
                        <div className="text-text-placeholder italic">
                          Insufficient Data ({data.completeness}% completeness)
                        </div>
                      )}
                    </div>
                  )
                }}
              />
              <ReferenceLine
                y={80}
                stroke="#10B981"
                strokeDasharray="2 4"
                label={{ value: "High (80)", fill: "#10B981", fontSize: 9, position: "insideTopLeft" }}
              />
              <ReferenceLine
                y={60}
                stroke="#F59E0B"
                strokeDasharray="2 4"
                label={{ value: "Moderate (60)", fill: "#F59E0B", fontSize: 9, position: "insideTopLeft" }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#22C55E"
                strokeWidth={2}
                fill="url(#readinessGrad)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-text-placeholder font-mono border border-dashed border-border-subtle rounded-lg">
          No historical readiness logs recorded in this timeframe.
        </div>
      )}
    </div>
  )
}
