import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  validateBackupSchema,
  generateAppDataBackup,
  restoreAppDataBackup,
  computeChecksum,
  MAX_BACKUP_SIZE_BYTES,
  type BackupPayload,
} from "../backup.service"
import { CURRENT_SCHEMA_VERSION, STORE_PERSIST_KEYS } from "@/lib/constants/VERSION"

describe("backup.service — Data Integrity & Schema Validation", () => {
  const validData: BackupPayload["data"] = {
    workouts: [
      { id: "w-1", name: "Push Day", status: "completed" } as any,
    ],
    programs: [
      { id: "p-1", name: "Hypertrophy Blueprint", daysPerWeek: 4 } as any,
    ],
    templates: [],
    exercises: [],
    goals: [
      { id: "g-1", title: "Bench 100kg", status: "active" } as any,
    ],
    weightLogs: [
      { id: "wl-1", weightKg: 82.5, date: "2026-10-29" } as any,
    ],
    bodyMeasurements: [],
    habits: [],
    recovery: [
      { id: "rec-1", date: "2026-10-29", readinessScore: 85 } as any,
    ],
    nutrition: {
      dailyLogs: [{ id: "nut-1", date: "2026-10-29", totalCalories: 2600 } as any],
    },
    coach: {
      proposals: [{ id: "prop-1", exerciseName: "Squat", status: "pending" } as any],
    },
  }

  const validPayload: BackupPayload = {
    app: "One Percent",
    version: "1.0.0",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: "2026-10-29T12:00:00.000Z",
    checksum: computeChecksum(JSON.stringify(validData)),
    data: validData,
  }

  it("validates a healthy backup file successfully with accurate entity counts", () => {
    const result = validateBackupSchema(validPayload)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.entityCounts?.workouts).toBe(1)
    expect(result.entityCounts?.programs).toBe(1)
    expect(result.entityCounts?.goals).toBe(1)
    expect(result.entityCounts?.weightLogs).toBe(1)
    expect(result.entityCounts?.recovery).toBe(1)
    expect(result.entityCounts?.nutrition).toBe(1)
    expect(result.entityCounts?.coachProposals).toBe(1)
  })

  it("rejects non-object or null payloads", () => {
    expect(validateBackupSchema(null).valid).toBe(false)
    expect(validateBackupSchema("string").valid).toBe(false)
    expect(validateBackupSchema([1, 2, 3]).valid).toBe(false)
  })

  it("rejects backups with missing or unsupported future schema version", () => {
    const missingVer = { ...validPayload, schemaVersion: undefined }
    expect(validateBackupSchema(missingVer).valid).toBe(false)
    expect(validateBackupSchema(missingVer).errors).toContain("Missing required field: schemaVersion")

    const futureVer = { ...validPayload, schemaVersion: 999 }
    const res = validateBackupSchema(futureVer)
    expect(res.valid).toBe(false)
    expect(res.errors[0]).toContain("is higher than current system version")
  })

  it("rejects backups missing the data object", () => {
    const missingData = { ...validPayload, data: undefined }
    const res = validateBackupSchema(missingData)
    expect(res.valid).toBe(false)
    expect(res.errors).toContain("Missing required payload object: data")
  })

  it("detects checksum mismatch when data has been altered externally", () => {
    const altered = {
      ...validPayload,
      checksum: "tampered_hash_12345",
    }
    const res = validateBackupSchema(altered)
    expect(res.warnings.some((w) => w.includes("checksum mismatch"))).toBe(true)
  })

  it("rejects oversized backup files exceeding maximum size (15 MB)", () => {
    const oversizedLength = MAX_BACKUP_SIZE_BYTES + 1024
    const res = validateBackupSchema(validPayload, oversizedLength)
    expect(res.valid).toBe(false)
    expect(res.errors[0]).toContain("exceeds the maximum permitted size of 15 MB")
  })

  it("restores records with deduplication by ID without corrupting stores", () => {
    const mockStorage: Record<string, string> = {
      [STORE_PERSIST_KEYS.goals]: JSON.stringify({
        state: { goals: [{ id: "g-existing", title: "Existing Goal" }] },
      }),
    }

    const reloadMock = vi.fn()
    const localStorageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = val
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      }),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }

    const originalWindow = (global as any).window
    const originalLocalStorage = (global as any).localStorage

    ;(global as any).window = {
      location: { reload: reloadMock },
    }
    ;(global as any).localStorage = localStorageMock

    restoreAppDataBackup(validPayload, "merge")

    expect(localStorageMock.setItem).toHaveBeenCalled()
    expect(reloadMock).toHaveBeenCalled()

    // Verify goals store merged existing and imported items
    const restoredGoalsRaw = mockStorage[STORE_PERSIST_KEYS.goals]
    expect(restoredGoalsRaw).toBeDefined()
    const parsedGoals = JSON.parse(restoredGoalsRaw!)
    const goalIds = parsedGoals.state.goals.map((g: any) => g.id)
    expect(goalIds).toContain("g-existing")
    expect(goalIds).toContain("g-1")

    ;(global as any).window = originalWindow
    ;(global as any).localStorage = originalLocalStorage
  })
})
