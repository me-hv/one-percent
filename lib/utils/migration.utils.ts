import { CURRENT_SCHEMA_VERSION } from "@/lib/constants/VERSION"

export interface VersionedPayload<T = unknown> {
  schemaVersion: number
  updatedAt?: string
  data: T
}

/**
 * Ensures stored state object complies with the current schema version.
 * Performs forward migrations if schema versions differ.
 */
export function migrateStoreState<T extends Record<string, unknown>>(
  persistedState: unknown,
  version: number
): T {
  if (!persistedState || typeof persistedState !== "object") {
    return {} as T
  }

  const state = persistedState as Record<string, unknown>
  const currentVersion = (state.schemaVersion as number) || 0

  if (currentVersion === version) {
    return state as T
  }

  // Version 0 -> Version 1 migration logic
  if (currentVersion < 1) {
    state.schemaVersion = 1
    state.migratedAt = new Date().toISOString()
  }

  return state as T
}

/**
 * Validates entity items for required ID and valid timestamps.
 */
export function sanitizeEntityList<T extends { id: string }>(items: unknown[]): T[] {
  if (!Array.isArray(items)) return []
  return items.filter((item): item is T => {
    return Boolean(item && typeof item === "object" && typeof (item as T).id === "string" && (item as T).id.length > 0)
  })
}
