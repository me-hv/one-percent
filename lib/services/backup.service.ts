import { CURRENT_SCHEMA_VERSION, STORE_PERSIST_KEYS } from "@/lib/constants/VERSION"
import type { WorkoutSession, TrainingProgram, WorkoutTemplate, Exercise } from "@/lib/types/training.types"
import type { Goal } from "@/lib/types/goals.types"
import type { WeightLog, BodyMeasurements } from "@/lib/types/body.types"
import type { HabitLog } from "@/lib/types/habits.types"
import type { DailyRecoveryEntry } from "@/lib/types/recovery.types"
import type { DailyNutritionLog, FoodItem, SavedMeal, NutritionTargets } from "@/lib/types/nutrition.types"
import type { AdaptiveProposal, WeeklyCoachingReview } from "@/features/coach/types/coach.types"

// Maximum allowed backup file size: 15 MB
export const MAX_BACKUP_SIZE_BYTES = 15 * 1024 * 1024

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
    nutrition?: {
      dailyLogs: DailyNutritionLog[]
      customFoods?: FoodItem[]
      savedMeals?: SavedMeal[]
      targets?: NutritionTargets
    }
    coach?: {
      proposals: AdaptiveProposal[]
      weeklyReviews?: WeeklyCoachingReview[]
    }
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
 * Computes a deterministic checksum for payload data integrity.
 */
export function computeChecksum(dataStr: string): string {
  let hash = 0
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash).toString(16)
}

/**
 * Reads an array from a persisted Zustand store in localStorage.
 */
function getStoreArray<T>(key: string, propName?: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.state) return []
    
    if (propName && Array.isArray(parsed.state[propName])) {
      return parsed.state[propName] as T[]
    }
    
    // Fallback: search for first array property in state
    for (const val of Object.values(parsed.state)) {
      if (Array.isArray(val)) return val as T[]
    }
    return []
  } catch {
    return []
  }
}

/**
 * Exports complete application snapshot as a structured JSON object.
 */
export function generateAppDataBackup(): BackupPayload {
  const workouts = getStoreArray<WorkoutSession>(STORE_PERSIST_KEYS.workout, "sessions")
  const programs = getStoreArray<TrainingProgram>(STORE_PERSIST_KEYS.program, "programs")
  const templates = getStoreArray<WorkoutTemplate>("one-percent-template-store", "templates")
  const exercises = getStoreArray<Exercise>(STORE_PERSIST_KEYS.exercise, "customExercises")
  const goals = getStoreArray<Goal>(STORE_PERSIST_KEYS.goals, "goals")
  const weightLogs = getStoreArray<WeightLog>(STORE_PERSIST_KEYS.body, "weightLogs")
  const bodyMeasurements = getStoreArray<BodyMeasurements>("one-percent-measurement-store", "measurements")
  const habits = getStoreArray<HabitLog>("one-percent-habit-store", "habits")
  const recovery = getStoreArray<DailyRecoveryEntry>(STORE_PERSIST_KEYS.recovery, "entries")

  // Nutrition
  const nutritionLogs = getStoreArray<DailyNutritionLog>(STORE_PERSIST_KEYS.nutrition, "dailyLogs")
  const customFoods = getStoreArray<FoodItem>(STORE_PERSIST_KEYS.nutrition, "customFoods")
  const savedMeals = getStoreArray<SavedMeal>(STORE_PERSIST_KEYS.nutrition, "savedMeals")

  // Coach
  const proposals = getStoreArray<AdaptiveProposal>(STORE_PERSIST_KEYS.coach, "proposals")
  const weeklyReviews = getStoreArray<WeeklyCoachingReview>(STORE_PERSIST_KEYS.coach, "weeklyReviews")

  const dataPayload: BackupPayload["data"] = {
    workouts,
    programs,
    templates,
    exercises,
    goals,
    weightLogs,
    bodyMeasurements,
    habits,
    recovery,
    nutrition: {
      dailyLogs: nutritionLogs,
      customFoods,
      savedMeals,
    },
    coach: {
      proposals,
      weeklyReviews,
    },
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
 * Validates JSON schema integrity, version compatibility, payload size, and checksum.
 */
export function validateBackupSchema(jsonContent: unknown, rawLength?: number): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check oversized raw content if available
  if (rawLength !== undefined && rawLength > MAX_BACKUP_SIZE_BYTES) {
    return {
      valid: false,
      errors: [`Backup file exceeds the maximum permitted size of 15 MB (${(rawLength / 1024 / 1024).toFixed(1)} MB).`],
      warnings,
    }
  }

  if (!jsonContent || typeof jsonContent !== "object" || Array.isArray(jsonContent)) {
    return { valid: false, errors: ["Invalid backup file format. Must be a valid JSON object."], warnings }
  }

  const payload = jsonContent as Partial<BackupPayload>

  if (payload.app !== "One Percent") {
    warnings.push("Backup file app signature missing or unrecognized.")
  }

  if (typeof payload.schemaVersion !== "number" || isNaN(payload.schemaVersion)) {
    errors.push("Missing required field: schemaVersion")
  } else if (payload.schemaVersion > CURRENT_SCHEMA_VERSION) {
    errors.push(`Backup schema version (${payload.schemaVersion}) is higher than current system version (${CURRENT_SCHEMA_VERSION}). Please update the app first.`)
  }

  if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
    errors.push("Missing required payload object: data")
    return { valid: false, errors, warnings }
  }

  const data = payload.data

  // Checksum verification
  if (payload.checksum) {
    try {
      const calculated = computeChecksum(JSON.stringify(data))
      if (calculated !== payload.checksum) {
        warnings.push("Data checksum mismatch detected. The backup payload may have been altered or edited externally.")
      }
    } catch {
      warnings.push("Could not verify payload checksum.")
    }
  }

  const entityCounts = {
    workouts: Array.isArray(data.workouts) ? data.workouts.length : 0,
    programs: Array.isArray(data.programs) ? data.programs.length : 0,
    goals: Array.isArray(data.goals) ? data.goals.length : 0,
    weightLogs: Array.isArray(data.weightLogs) ? data.weightLogs.length : 0,
    recovery: Array.isArray(data.recovery) ? data.recovery.length : 0,
    nutrition: Array.isArray(data.nutrition?.dailyLogs) ? data.nutrition!.dailyLogs.length : 0,
    coachProposals: Array.isArray(data.coach?.proposals) ? data.coach!.proposals.length : 0,
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
 * Restores data snapshot to application local stores with deduplication and error isolation.
 */
export function restoreAppDataBackup(backup: BackupPayload, mode: "full" | "merge" = "merge"): void {
  if (typeof window === "undefined") return

  const setStore = (key: string, stateProp: string, items: unknown[]) => {
    try {
      // Filter out null or non-object items to prevent store corruption
      const safeItems = Array.isArray(items)
        ? items.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
        : []

      if (mode === "full") {
        localStorage.setItem(
          key,
          JSON.stringify({ state: { [stateProp]: safeItems }, version: CURRENT_SCHEMA_VERSION })
        )
      } else {
        const raw = localStorage.getItem(key)
        let existing: Record<string, unknown>[] = []
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            if (parsed && parsed.state) {
              const currentList = parsed.state[stateProp] || Object.values(parsed.state)[0]
              if (Array.isArray(currentList)) {
                existing = currentList.filter(
                  (item): item is Record<string, unknown> => item !== null && typeof item === "object"
                )
              }
            }
          } catch {
            existing = []
          }
        }

        const mergedMap = new Map<string, Record<string, unknown>>()
        // Deduplicate by id or date
        const getKey = (item: Record<string, unknown>, idx: number) =>
          typeof item.id === "string" ? item.id : typeof item.date === "string" ? item.date : `item-${idx}`

        existing.forEach((item, idx) => mergedMap.set(getKey(item, idx), item))
        safeItems.forEach((item, idx) => mergedMap.set(getKey(item, idx), item))

        localStorage.setItem(
          key,
          JSON.stringify({
            state: { [stateProp]: Array.from(mergedMap.values()) },
            version: CURRENT_SCHEMA_VERSION,
          })
        )
      }
    } catch (err) {
      console.error(`Failed to restore store ${key}:`, err)
    }
  }

  if (backup.data) {
    if (backup.data.workouts) setStore(STORE_PERSIST_KEYS.workout, "sessions", backup.data.workouts)
    if (backup.data.programs) setStore(STORE_PERSIST_KEYS.program, "programs", backup.data.programs)
    if (backup.data.goals) setStore(STORE_PERSIST_KEYS.goals, "goals", backup.data.goals)
    if (backup.data.weightLogs) setStore(STORE_PERSIST_KEYS.body, "weightLogs", backup.data.weightLogs)
    if (backup.data.recovery) setStore(STORE_PERSIST_KEYS.recovery, "entries", backup.data.recovery)
    if (backup.data.nutrition?.dailyLogs) {
      setStore(STORE_PERSIST_KEYS.nutrition, "dailyLogs", backup.data.nutrition.dailyLogs)
    }
    if (backup.data.coach?.proposals) {
      setStore(STORE_PERSIST_KEYS.coach, "proposals", backup.data.coach.proposals)
    }
  }

  // Trigger reload to apply restored state across Zustand stores
  window.location.reload()
}
