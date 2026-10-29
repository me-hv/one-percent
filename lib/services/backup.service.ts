import { CURRENT_SCHEMA_VERSION, STORE_PERSIST_KEYS } from "@/lib/constants/VERSION"
import type { WorkoutSession, TrainingProgram, WorkoutTemplate, Exercise } from "@/lib/types/training.types"
import type { Goal } from "@/lib/types/goals.types"
import type { WeightLog, BodyMeasurements } from "@/lib/types/body.types"
import type { HabitLog } from "@/lib/types/habits.types"
import type { DailyRecoveryEntry } from "@/lib/types/recovery.types"

export interface BackupPayload {
  app: "One Percent"
  version: string
  schemaVersion: number
  exportedAt: string
  checksum: string
  data: {
    workouts: WorkoutSession[]
    programs: TrainingProgram[]
    templates: WorkoutTemplate[]
    exercises: Exercise[]
    goals: Goal[]
    weightLogs: WeightLog[]
    bodyMeasurements: BodyMeasurements[]
    habits: HabitLog[]
    recovery?: DailyRecoveryEntry[]
    settings?: Record<string, unknown>
  }
}

export interface ValidationResult {
  valid: boolean
  schemaVersion?: number
  exportedAt?: string
  entityCounts?: Record<string, number>
  errors: string[]
  warnings: string[]
}

/**
 * Computes a simple checksum for stringified payload data integrity.
 */
function computeChecksum(dataStr: string): string {
  let hash = 0
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash).toString(16)
}

/**
 * Exports complete application snapshot as a structured JSON object.
 */
export function generateAppDataBackup(): BackupPayload {
  const getItem = <T>(key: string): T[] => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return parsed.state ? (Object.values(parsed.state)[0] as T[]) || [] : []
    } catch {
      return []
    }
  }

  const workouts = getItem<WorkoutSession>(STORE_PERSIST_KEYS.workout)
  const programs = getItem<TrainingProgram>(STORE_PERSIST_KEYS.program)
  const templates = getItem<WorkoutTemplate>("one-percent-template-store")
  const exercises = getItem<Exercise>(STORE_PERSIST_KEYS.exercise)
  const goals = getItem<Goal>(STORE_PERSIST_KEYS.goals)
  const weightLogs = getItem<WeightLog>(STORE_PERSIST_KEYS.body)
  const bodyMeasurements = getItem<BodyMeasurements>("one-percent-measurement-store")
  const habits = getItem<HabitLog>("one-percent-habit-store")
  const recovery = getItem<DailyRecoveryEntry>(STORE_PERSIST_KEYS.recovery)

  const dataPayload = {
    workouts,
    programs,
    templates,
    exercises,
    goals,
    weightLogs,
    bodyMeasurements,
    habits,
    recovery,
  }

  const dataStr = JSON.stringify(dataPayload)
  const checksum = computeChecksum(dataStr)

  return {
    app: "One Percent",
    version: "1.0.0",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    checksum,
    data: dataPayload,
  }
}

/**
 * Downloads the JSON backup payload to the user's browser.
 */
export function downloadBackupFile(): void {
  const backup = generateAppDataBackup()
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2))
  const downloadAnchor = document.createElement("a")
  const fileName = `one-percent-backup-${new Date().toISOString().split("T")[0]}.json`
  downloadAnchor.setAttribute("href", dataStr)
  downloadAnchor.setAttribute("download", fileName)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

/**
 * Validates JSON schema integrity and version compatibility.
 */
export function validateBackupSchema(jsonContent: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!jsonContent || typeof jsonContent !== "object") {
    return { valid: false, errors: ["Invalid backup file format. Must be a valid JSON object."], warnings }
  }

  const payload = jsonContent as Partial<BackupPayload>

  if (payload.app !== "One Percent") {
    warnings.push("Backup file app signature missing or unrecognized.")
  }

  if (typeof payload.schemaVersion !== "number") {
    errors.push("Missing required field: schemaVersion")
  } else if (payload.schemaVersion > CURRENT_SCHEMA_VERSION) {
    errors.push(`Backup schema version (${payload.schemaVersion}) is higher than current system version (${CURRENT_SCHEMA_VERSION}). Please update the app first.`)
  }

  if (!payload.data || typeof payload.data !== "object") {
    errors.push("Missing required payload object: data")
    return { valid: false, errors, warnings }
  }

  const data = payload.data
  const entityCounts = {
    workouts: Array.isArray(data.workouts) ? data.workouts.length : 0,
    programs: Array.isArray(data.programs) ? data.programs.length : 0,
    goals: Array.isArray(data.goals) ? data.goals.length : 0,
    weightLogs: Array.isArray(data.weightLogs) ? data.weightLogs.length : 0,
  }

  return {
    valid: errors.length === 0,
    schemaVersion: payload.schemaVersion,
    exportedAt: payload.exportedAt,
    entityCounts,
    errors,
    warnings,
  }
}

/**
 * Restores data snapshot to application local stores.
 */
export function restoreAppDataBackup(backup: BackupPayload, mode: "full" | "merge" = "merge"): void {
  if (typeof window === "undefined") return

  const setStore = (key: string, stateProp: string, items: unknown[]) => {
    try {
      if (mode === "full") {
        localStorage.setItem(key, JSON.stringify({ state: { [stateProp]: items }, version: CURRENT_SCHEMA_VERSION }))
      } else {
        const raw = localStorage.getItem(key)
        let existing: unknown[] = []
        if (raw) {
          const parsed = JSON.parse(raw)
          existing = parsed.state ? (Object.values(parsed.state)[0] as unknown[]) || [] : []
        }
        const mergedMap = new Map<string, unknown>()
        existing.forEach((item) => {
          if (item && typeof item === "object" && "id" in item) mergedMap.set((item as { id: string }).id, item)
        })
        items.forEach((item) => {
          if (item && typeof item === "object" && "id" in item) mergedMap.set((item as { id: string }).id, item)
        })
        localStorage.setItem(
          key,
          JSON.stringify({ state: { [stateProp]: Array.from(mergedMap.values()) }, version: CURRENT_SCHEMA_VERSION })
        )
      }
    } catch (err) {
      console.error(`Failed to restore store ${key}:`, err)
    }
  }

  setStore(STORE_PERSIST_KEYS.workout, "sessions", backup.data.workouts || [])
  setStore(STORE_PERSIST_KEYS.program, "programs", backup.data.programs || [])
  setStore(STORE_PERSIST_KEYS.goals, "goals", backup.data.goals || [])
  setStore(STORE_PERSIST_KEYS.body, "weightLogs", backup.data.weightLogs || [])
  setStore(STORE_PERSIST_KEYS.recovery, "entries", backup.data.recovery || [])

  // Trigger reload to apply restored state across Zustand stores
  window.location.reload()
}
