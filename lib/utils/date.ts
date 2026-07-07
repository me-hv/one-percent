/**
 * Date utility functions
 * Thin wrappers around date-fns to ensure consistent date handling.
 * Always use these — never import date-fns directly in components.
 */
import {
  format,
  formatDistanceToNow,
  formatRelative,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  addDays,
  differenceInDays,
  differenceInCalendarDays,
  isSameDay,
  parseISO,
  isValid,
  getDay,
} from "date-fns"

// ─── Formatting ───────────────────────────────────────────────────

/** "Mon, Jul 5" */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "EEE, MMM d")
}

/** "July 5, 2026" */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMMM d, yyyy")
}

/** "2026-07-05" — ISO date string for Firestore keys */
export function formatDateKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd")
}

/** "Jul 5" */
export function formatDateCompact(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMM d")
}

/** "23:45" or "11:45 PM" */
export function formatTime(date: Date | string, use24h = true): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, use24h ? "HH:mm" : "h:mm a")
}

/** "Jul 5 · 11:45 PM" */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMM d · h:mm a")
}

/** Relative: "Today", "Yesterday", "3 days ago", "Jul 5" */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  if (isToday(d)) return "Today"
  if (isYesterday(d)) return "Yesterday"
  if (isTomorrow(d)) return "Tomorrow"
  if (isThisWeek(d)) return format(d, "EEEE")
  return formatDateShort(d)
}

/** "2 hours ago", "3 minutes ago" */
export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

// ─── Date Ranges ─────────────────────────────────────────────────

export function getDateRange(period: "week" | "month" | "3months" | "6months" | "year"): {
  start: Date
  end: Date
} {
  const now = new Date()
  switch (period) {
    case "week":
      return { start: subDays(now, 7), end: now }
    case "month":
      return { start: subMonths(now, 1), end: now }
    case "3months":
      return { start: subMonths(now, 3), end: now }
    case "6months":
      return { start: subMonths(now, 6), end: now }
    case "year":
      return { start: subMonths(now, 12), end: now }
  }
}

export function getLast7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i))
}

export function getLast30Days(): Date[] {
  return Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i))
}

// ─── Comparison ───────────────────────────────────────────────────

export function isDateToday(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date
  return isToday(d)
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const dateA = typeof a === "string" ? parseISO(a) : a
  const dateB = typeof b === "string" ? parseISO(b) : b
  return Math.abs(differenceInCalendarDays(dateA, dateB))
}

export function isSameDayDate(a: Date | string, b: Date | string): boolean {
  const dateA = typeof a === "string" ? parseISO(a) : a
  const dateB = typeof b === "string" ? parseISO(b) : b
  return isSameDay(dateA, dateB)
}

// ─── Convenience ──────────────────────────────────────────────────

export function today(): Date {
  return startOfDay(new Date())
}

export function todayKey(): string {
  return formatDateKey(new Date())
}

export function parseDate(dateStr: string): Date {
  const d = parseISO(dateStr)
  if (!isValid(d)) throw new Error(`Invalid date string: "${dateStr}"`)
  return d
}

// Re-export frequently used date-fns functions for convenience
export {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  addDays,
  differenceInDays,
  isSameDay,
  parseISO,
  isValid,
  getDay,
}
