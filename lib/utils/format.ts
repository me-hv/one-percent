/**
 * Number and unit formatting utilities
 * All display-facing formatting lives here — never in components.
 */

// ─── Weight ────────────────────────────────────────────────────────
export function formatWeight(kg: number, unit: "kg" | "lbs" = "kg"): string {
  const value = unit === "lbs" ? kg * 2.20462 : kg
  const rounded = Math.round(value * 4) / 4 // Round to nearest 0.25
  return `${rounded}${unit}`
}

export function formatWeightValue(kg: number, unit: "kg" | "lbs" = "kg"): number {
  const value = unit === "lbs" ? kg * 2.20462 : kg
  return Math.round(value * 4) / 4
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 100) / 100
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 100) / 100
}

// ─── Distance ─────────────────────────────────────────────────────
export function formatDistance(km: number, unit: "km" | "mi" = "km"): string {
  const value = unit === "mi" ? km * 0.621371 : km
  return `${value.toFixed(2)}${unit}`
}

// ─── Reps / Sets ──────────────────────────────────────────────────
export function formatSets(sets: number, reps: number | string, weight?: number, weightUnit?: "kg" | "lbs"): string {
  const repsStr = typeof reps === "number" ? reps.toString() : reps
  if (weight !== undefined && weight > 0 && weightUnit) {
    return `${sets}×${repsStr} @ ${formatWeight(weight, weightUnit)}`
  }
  return `${sets}×${repsStr}`
}

// ─── Duration ────────────────────────────────────────────────────
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, "0")}m`
  }
  if (m > 0) {
    return `${m}m ${s.toString().padStart(2, "0")}s`
  }
  return `${s}s`
}

export function formatDurationShort(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

// ─── Macros / Nutrition ───────────────────────────────────────────
export function formatCalories(kcal: number): string {
  return `${Math.round(kcal)} kcal`
}

export function formatMacro(grams: number, label?: string): string {
  const formatted = `${Math.round(grams)}g`
  return label ? `${formatted} ${label}` : formatted
}

// ─── Percentages ──────────────────────────────────────────────────
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function formatPercentChange(current: number, previous: number): string {
  if (previous === 0) return "—"
  const change = ((current - previous) / Math.abs(previous)) * 100
  const sign = change >= 0 ? "+" : ""
  return `${sign}${change.toFixed(1)}%`
}

// ─── Body Measurements ────────────────────────────────────────────
export function formatMeasurement(cm: number, unit: "cm" | "in" = "cm"): string {
  if (unit === "in") {
    const inches = cm / 2.54
    return `${inches.toFixed(1)}in`
  }
  return `${cm.toFixed(1)}cm`
}

export function formatHeight(cm: number, unit: "cm" | "ft" = "cm"): string {
  if (unit === "ft") {
    const totalInches = cm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${feet}'${inches}"`
  }
  return `${cm}cm`
}

// ─── Volume (Training Load) ───────────────────────────────────────
export function formatVolume(kg: number, unit: "kg" | "lbs" = "kg"): string {
  const value = unit === "lbs" ? kg * 2.20462 : kg
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k${unit}`
  }
  return `${Math.round(value)}${unit}`
}

// ─── Score / Rating ───────────────────────────────────────────────
export function formatScore(score: number, max = 100): string {
  return `${Math.round(score)}/${max}`
}

// ─── Compact Large Numbers ────────────────────────────────────────
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

// ─── Change Indicator ─────────────────────────────────────────────
export type ChangeDirection = "positive" | "negative" | "neutral"

export function getChangeDirection(
  change: number,
  metric: "weight" | "volume" | "reps" | "calories" | "sleep" | "recovery",
): ChangeDirection {
  if (change === 0) return "neutral"
  // For weight loss goals, losing weight is "positive"
  // This function returns semantic direction — callers interpret per-goal
  return change > 0 ? "positive" : "negative"
}
