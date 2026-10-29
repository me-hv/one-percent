"use client"

import { useMemo, useState } from "react"
import { Activity, Zap, ShieldAlert, Heart } from "lucide-react"
import type { DailyRecoveryEntry } from "@/lib/types/recovery.types"
import { formatDateShort, subDays } from "@/lib/utils/date"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"

interface WellnessTrendsCardProps {
  entries: DailyRecoveryEntry[]
}

export function WellnessTrendsCard({ entries }: WellnessTrendsCardProps) {
  const [timeframeDays, setTimeframeDays] = useState<7 | 14 | 30>(7)

  // Filter entries for chosen timeframe
  const chartData = useMemo(() => {
    const today = new Date()
    const cutoff = subDays(today, timeframeDays - 1)
    const filtered = entries
      .filter((e) => new Date(e.date + "T00:00:00") >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date))

    return filtered.map((e) => ({
      date: formatDateShort(new Date(e.date + "T00:00:00")),
      rawDate: e.date,
      energy: e.energy || null,
      fatigue: e.fatigue || null,
      stress: e.stress || null,
      motivation: e.motivation || null,
    }))
  }, [entries, timeframeDays])

  return (
    <div className="card p-5 border border-border-default bg-bg-surface space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <div>
            <h4 className="text-sm font-bold text-primary">Wellness & Subjective Trends</h4>
            <span className="text-[10px] text-text-placeholder font-mono">
              Energy, Fatigue, Stress & Motivation (1–5 scale)
            </span>
          </div>
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

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0]?.payload
                  return (
                    <div className="p-3 rounded-lg border border-border-default bg-bg-surface shadow-xl font-mono text-xs space-y-1">
                      <div className="text-text-placeholder text-[10px]">{data.rawDate}</div>
                      {data.energy != null && (
                        <div className="text-emerald-400">Energy: {data.energy} / 5</div>
                      )}
                      {data.fatigue != null && (
                        <div className="text-rose-400">Fatigue: {data.fatigue} / 5</div>
                      )}
                      {data.stress != null && (
                        <div className="text-amber-400">Stress: {data.stress} / 5</div>
                      )}
                      {data.motivation != null && (
                        <div className="text-cyan-400">Motivation: {data.motivation} / 5</div>
                      )}
                    </div>
                  )
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
              />
              <Line
                type="monotone"
                dataKey="energy"
                name="Energy"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="fatigue"
                name="Fatigue"
                stroke="#F43F5E"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="stress"
                name="Stress"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="motivation"
                name="Motivation"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-text-placeholder font-mono border border-dashed border-border-subtle rounded-lg">
          No wellness check-ins recorded in this timeframe.
        </div>
      )}
    </div>
  )
}
