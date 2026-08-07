/**
 * Analytics Utility Functions for One Percent Progress Intelligence Engine.
 * Provides math, statistics, E1RM calculations, moving averages, trendlines,
 * muscle volume aggregations, and consistency score algorithms.
 */

export interface Point {
  x: number
  y: number
}

export interface DatedPoint {
  date: string
  value: number
}

/**
 * Calculates Estimated 1RM (E1RM) using Brzycki and Epley formulas.
 * Epley formula: Weight * (1 + Reps / 30)
 * Brzycki formula: Weight * (36 / (37 - Reps))
 * Returns average for reps > 1, or exact weight for 1 rep.
 */
export function calculateE1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return Math.round(weight * 10) / 10

  const epley = weight * (1 + reps / 30)
  const brzycki = reps < 37 ? weight * (36 / (37 - reps)) : epley
  const avg = (epley + brzycki) / 2
  return Math.round(avg * 10) / 10
}

/**
 * Calculates simple moving average (SMA) for time-series data with configurable window size.
 */
export function calculateMovingAverage(
  data: DatedPoint[],
  windowSize = 7
): DatedPoint[] {
  if (data.length === 0) return []
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
  
  return sorted.map((point, idx) => {
    const startIdx = Math.max(0, idx - windowSize + 1)
    const window = sorted.slice(startIdx, idx + 1)
    const sum = window.reduce((acc, p) => acc + p.value, 0)
    return {
      date: point.date,
      value: Math.round((sum / window.length) * 10) / 10,
    }
  })
}

/**
 * Calculates linear regression trendline for chart overlays.
 * y = slope * x + intercept
 */
export function calculateTrendline(points: Point[]): Point[] {
  if (points.length < 2) return points
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  const n = points.length

  points.forEach((pt) => {
    sumX += pt.x
    sumY += pt.y
    sumXY += pt.x * pt.y
    sumXX += pt.x * pt.x
  })

  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) return points

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  return points.map((pt) => ({
    x: pt.x,
    y: Math.round((slope * pt.x + intercept) * 10) / 10,
  }))
}

/**
 * Calculates percentage change between two values.
 */
export function calculatePercentageChange(current: number, baseline: number): number {
  if (baseline === 0) return current > 0 ? 100 : 0
  const change = ((current - baseline) / baseline) * 100
  return Math.round(change * 10) / 10
}

/**
 * Calculates training consistency score (0 to 100%) based on active days vs target schedule over timeframe.
 */
export function calculateConsistencyScore(
  activeDates: Set<string>,
  targetDaysPerWeek = 4,
  daysLookback = 30
): number {
  if (daysLookback <= 0 || targetDaysPerWeek <= 0) return 0
  
  const targetTotal = Math.ceil((daysLookback / 7) * targetDaysPerWeek)
  const actualActive = activeDates.size
  const score = Math.min(100, Math.round((actualActive / targetTotal) * 100))
  return score
}

/**
 * Calculates average weekly workout frequency over given number of weeks.
 */
export function calculateWorkoutFrequency(
  totalSessions: number,
  totalDays: number
): number {
  if (totalDays <= 0) return 0
  const weeks = totalDays / 7
  return Math.round((totalSessions / weeks) * 10) / 10
}
