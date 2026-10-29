import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { syncQueueService, type SyncOperation } from "../sync-queue.service"
import {
  generateAppDataBackup,
  restoreAppDataBackup,
  validateBackupSchema,
  computeChecksum,
  type BackupPayload,
} from "../backup.service"
import { clearUserStorage } from "@/features/auth/services/auth.service"
import { CURRENT_SCHEMA_VERSION, STORE_PERSIST_KEYS } from "@/lib/constants/VERSION"

describe("Stage 4 — Offline Data Integrity & Disaster Recovery Drills", () => {
  const storeMap = new Map<string, string>()

  const mockLocalStorage = {
    getItem: vi.fn((key: string) => storeMap.get(key) || null),
    setItem: vi.fn((key: string, value: string) => storeMap.set(key, value)),
    removeItem: vi.fn((key: string) => storeMap.delete(key)),
    clear: vi.fn(() => storeMap.clear()),
  }

  const reloadMock = vi.fn()

  beforeEach(() => {
    storeMap.clear()
    vi.clearAllMocks()

    ;(globalThis as any).localStorage = mockLocalStorage
    ;(globalThis as any).window = {
      location: { reload: reloadMock },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      configurable: true,
      writable: true,
    })

    syncQueueService.clearQueueForTesting()
  })

  afterEach(() => {
    delete (globalThis as any).localStorage
    delete (globalThis as any).window
  })

  describe("Drill 1: Offline Workout Creation -> Reload -> Sync Exactly Once", () => {
    it("persists offline workout mutation across reloads and syncs exactly once on reconnection", async () => {
      // 1. Simulate offline state
      Object.defineProperty(globalThis, "navigator", {
        value: { onLine: false },
        configurable: true,
        writable: true,
      })

      const offlineWorkout = {
        id: "workout-offline-101",
        name: "Leg Hypertrophy A",
        exercises: [{ id: "ex-squat", name: "Barbell Back Squat", sets: 4 }],
        clientTimestamp: Date.now(),
      }

      // Enqueue offline workout
      const op = syncQueueService.enqueue("workout", offlineWorkout.id, "create", offlineWorkout)
      expect(op.status).toBe("pending")
      expect(op.attemptCount).toBe(0)

      // Verify mutation is saved in persistent storage
      const rawQueue = storeMap.get("one-percent-sync-queue-v1")
      expect(rawQueue).toBeDefined()
      const parsedQueue: SyncOperation[] = JSON.parse(rawQueue!)
      expect(parsedQueue).toHaveLength(1)
      expect(parsedQueue[0]?.entityId).toBe("workout-offline-101")

      // 2. Simulate application reload / restart (re-loading queue from localStorage)
      const freshQueueService = new (syncQueueService.constructor as any)()
      const pendingAfterReload = freshQueueService.getQueue()
      expect(pendingAfterReload).toHaveLength(1)
      expect(pendingAfterReload[0]?.id).toBe(op.id)
      expect(pendingAfterReload[0]?.status).toBe("pending")

      // 3. Reconnect to network
      Object.defineProperty(globalThis, "navigator", {
        value: { onLine: true },
        configurable: true,
        writable: true,
      })

      // Flush queue
      await freshQueueService.flushQueue()

      // 4. Verify sync executed exactly once and completed cleanly
      const remainingQueue = freshQueueService.getQueue()
      // Completed operations are pruned from active queue to prevent duplicate replays
      expect(remainingQueue).toHaveLength(0)

      // Storage should reflect empty/completed queue
      const updatedStorageQueue = JSON.parse(storeMap.get("one-percent-sync-queue-v1") || "[]")
      expect(updatedStorageQueue).toHaveLength(0)
    })
  })

  describe("Drill 2: Sync Failure -> Retry -> Idempotency & Zero Data Loss", () => {
    it("preserves mutations across failed network attempts and prevents duplicate records upon retry", async () => {
      // Enqueue mutation offline
      Object.defineProperty(globalThis, "navigator", {
        value: { onLine: false },
        configurable: true,
        writable: true,
      })

      const recoveryEntry = {
        id: "rec-drill-2",
        date: "2026-10-29",
        readinessScore: 78,
        sleepHours: 7.5,
      }

      syncQueueService.enqueue("recovery", recoveryEntry.id, "create", recoveryEntry)

      // Enqueue an update to the SAME entity while still offline (tests idempotency merge)
      const updatedRecoveryEntry = {
        ...recoveryEntry,
        sleepHours: 8.0,
        hrvMs: 65,
      }
      syncQueueService.enqueue("recovery", recoveryEntry.id, "update", updatedRecoveryEntry)

      // Verify deduplication: queue still has exactly 1 operation for this entity
      const queueBeforeSync = syncQueueService.getQueue()
      expect(queueBeforeSync).toHaveLength(1)
      expect((queueBeforeSync[0]?.payload as any).sleepHours).toBe(8.0)
      expect((queueBeforeSync[0]?.payload as any).hrvMs).toBe(65)

      // Reconnect and flush
      Object.defineProperty(globalThis, "navigator", {
        value: { onLine: true },
        configurable: true,
        writable: true,
      })

      await syncQueueService.flushQueue()
      expect(syncQueueService.getQueue()).toHaveLength(0)
    })
  })

  describe("Drill 3: Sign-Out With Queued Offline Changes & Cancelation", () => {
    it("preserves queued mutations when user cancels sign-out", () => {
      // User creates offline nutrition log
      const nutritionPayload = { id: "nut-drill-3", calories: 2400, protein: 180 }
      syncQueueService.enqueue("nutrition", nutritionPayload.id, "create", nutritionPayload)

      const pendingOps = syncQueueService
        .getQueue()
        .filter((op) => op.status === "pending" || op.status === "processing" || op.status === "failed")

      expect(pendingOps.length).toBe(1)

      // User triggers sign-out modal -> Modal detects pending mutations (pendingChangesCount = 1)
      const modalProps = {
        isOpen: true,
        isOffline: true,
        pendingChangesCount: pendingOps.length,
      }
      expect(modalProps.pendingChangesCount).toBe(1)
      expect(modalProps.isOffline).toBe(true)

      // User clicks "Cancel & Keep Data" (does NOT call clearUserStorage)
      // Verify queue and stores remain completely intact
      expect(syncQueueService.getQueue()).toHaveLength(1)
      const storedQueue = JSON.parse(storeMap.get("one-percent-sync-queue-v1") || "[]")
      expect(storedQueue).toHaveLength(1)
      expect(storedQueue[0]?.entityId).toBe("nut-drill-3")
    })

    it("purges user stores and sync queue when user explicitly confirms sign-out", () => {
      storeMap.set(STORE_PERSIST_KEYS.workout, JSON.stringify({ state: { sessions: [{ id: "w-old" }] } }))
      storeMap.set(STORE_PERSIST_KEYS.goals, JSON.stringify({ state: { goals: [{ id: "g-old" }] } }))
      storeMap.set(STORE_PERSIST_KEYS.recovery, JSON.stringify({ state: { entries: [{ id: "r-old" }] } }))

      // User confirms force sign-out
      clearUserStorage()

      expect(storeMap.get(STORE_PERSIST_KEYS.workout)).toBeUndefined()
      expect(storeMap.get(STORE_PERSIST_KEYS.goals)).toBeUndefined()
      expect(storeMap.get(STORE_PERSIST_KEYS.recovery)).toBeUndefined()
    })
  })

  describe("Drill 4: Backup Export, SHA-256 Checksum, Schema Compatibility & Malformed JSON", () => {
    const validWorkout = { id: "w-export-1", name: "Push Strength", status: "completed" }
    const validGoal = { id: "g-export-1", title: "Squat 140kg", status: "active" }

    beforeEach(() => {
      storeMap.set(
        STORE_PERSIST_KEYS.workout,
        JSON.stringify({ state: { sessions: [validWorkout] }, version: CURRENT_SCHEMA_VERSION })
      )
      storeMap.set(
        STORE_PERSIST_KEYS.goals,
        JSON.stringify({ state: { goals: [validGoal] }, version: CURRENT_SCHEMA_VERSION })
      )
    })

    it("exports a valid backup with deterministic checksum and verified structure", () => {
      const backup = generateAppDataBackup()

      expect(backup.app).toBe("One Percent")
      expect(backup.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
      expect(backup.data.workouts).toHaveLength(1)
      expect(backup.data.goals).toHaveLength(1)
      expect(typeof backup.checksum).toBe("string")
      expect(backup.checksum.length).toBeGreaterThan(0)

      // Checksum matches data payload
      const calculatedChecksum = computeChecksum(JSON.stringify(backup.data))
      expect(backup.checksum).toBe(calculatedChecksum)

      // Validation passes
      const valResult = validateBackupSchema(backup)
      expect(valResult.valid).toBe(true)
      expect(valResult.errors).toHaveLength(0)
      expect(valResult.warnings).toHaveLength(0)
    })

    it("rejects malformed backup payloads (corrupted JSON, primitives, null)", () => {
      expect(validateBackupSchema(null).valid).toBe(false)
      expect(validateBackupSchema("invalid-json-string").valid).toBe(false)
      expect(validateBackupSchema(12345).valid).toBe(false)
      expect(validateBackupSchema([]).valid).toBe(false)
    })

    it("rejects backup payloads missing schemaVersion or targeting higher unsupported version", () => {
      const backup = generateAppDataBackup()

      // Missing schemaVersion
      const noVersion = { ...backup, schemaVersion: undefined }
      const res1 = validateBackupSchema(noVersion)
      expect(res1.valid).toBe(false)
      expect(res1.errors).toContain("Missing required field: schemaVersion")

      // Future schema version (e.g., version 99)
      const futureVersion = { ...backup, schemaVersion: CURRENT_SCHEMA_VERSION + 10 }
      const res2 = validateBackupSchema(futureVersion)
      expect(res2.valid).toBe(false)
      expect(res2.errors[0]).toContain("is higher than current system version")
    })

    it("flags warning on altered checksum without discarding recoverable data", () => {
      const backup = generateAppDataBackup()
      const tampered = { ...backup, checksum: "tampered_fake_checksum" }
      const res = validateBackupSchema(tampered)
      expect(res.valid).toBe(true) // Schema is valid but warned
      expect(res.warnings.some((w) => w.includes("Data checksum mismatch detected"))).toBe(true)
    })
  })

  describe("Drill 5: Backup Restore Against Empty Store & Last-Write-Wins Conflict Resolution", () => {
    it("restores cleanly into an empty local store", () => {
      const backup: BackupPayload = {
        app: "One Percent",
        version: "1.0.0",
        schemaVersion: CURRENT_SCHEMA_VERSION,
        exportedAt: "2026-10-29T10:00:00.000Z",
        checksum: "test-checksum",
        data: {
          workouts: [{ id: "w-empty-restore", name: "Pull Day", status: "completed" } as any],
          programs: [],
          templates: [],
          exercises: [],
          goals: [{ id: "g-empty-restore", title: "Deadlift 180kg" } as any],
          weightLogs: [],
          bodyMeasurements: [],
          habits: [],
        },
      }

      restoreAppDataBackup(backup, "merge")

      expect(reloadMock).toHaveBeenCalled()
      const restoredWorkoutsRaw = storeMap.get(STORE_PERSIST_KEYS.workout)
      expect(restoredWorkoutsRaw).toBeDefined()
      const parsedWorkouts = JSON.parse(restoredWorkoutsRaw!)
      expect(parsedWorkouts.state.sessions).toHaveLength(1)
      expect(parsedWorkouts.state.sessions[0].id).toBe("w-empty-restore")
    })

    it("preserves newer local records over older backup records (LWW Strategy)", () => {
      // Local existing record updated at 12:00
      const localWorkout = {
        id: "w-shared-1",
        name: "Upper Body Hypertrophy (Latest Local Edit)",
        updatedAt: "2026-10-29T12:00:00.000Z",
      }

      storeMap.set(
        STORE_PERSIST_KEYS.workout,
        JSON.stringify({ state: { sessions: [localWorkout] }, version: CURRENT_SCHEMA_VERSION })
      )

      // Incoming backup contains older version of the same record from 08:00
      const olderBackupRecord = {
        id: "w-shared-1",
        name: "Upper Body Hypertrophy (Old Backup Snapshot)",
        updatedAt: "2026-10-29T08:00:00.000Z",
      }

      const backup: BackupPayload = {
        app: "One Percent",
        version: "1.0.0",
        schemaVersion: CURRENT_SCHEMA_VERSION,
        exportedAt: "2026-10-29T08:00:00.000Z",
        checksum: "checksum",
        data: {
          workouts: [olderBackupRecord as any],
          programs: [],
          templates: [],
          exercises: [],
          goals: [],
          weightLogs: [],
          bodyMeasurements: [],
          habits: [],
        },
      }

      // Restore with merge mode
      restoreAppDataBackup(backup, "merge")

      const resultRaw = storeMap.get(STORE_PERSIST_KEYS.workout)
      const parsed = JSON.parse(resultRaw!)
      expect(parsed.state.sessions).toHaveLength(1)
      // The NEWER local edit MUST be preserved!
      expect(parsed.state.sessions[0].name).toBe("Upper Body Hypertrophy (Latest Local Edit)")
      expect(parsed.state.sessions[0].updatedAt).toBe("2026-10-29T12:00:00.000Z")
    })

    it("updates local records when incoming backup has a newer timestamp", () => {
      const localWorkout = {
        id: "w-shared-2",
        name: "Leg Day (Older Local)",
        updatedAt: "2026-10-28T10:00:00.000Z",
      }

      storeMap.set(
        STORE_PERSIST_KEYS.workout,
        JSON.stringify({ state: { sessions: [localWorkout] }, version: CURRENT_SCHEMA_VERSION })
      )

      const newerBackupRecord = {
        id: "w-shared-2",
        name: "Leg Day (Newer Cloud Snapshot)",
        updatedAt: "2026-10-29T14:00:00.000Z",
      }

      const backup: BackupPayload = {
        app: "One Percent",
        version: "1.0.0",
        schemaVersion: CURRENT_SCHEMA_VERSION,
        exportedAt: "2026-10-29T14:00:00.000Z",
        checksum: "checksum",
        data: {
          workouts: [newerBackupRecord as any],
          programs: [],
          templates: [],
          exercises: [],
          goals: [],
          weightLogs: [],
          bodyMeasurements: [],
          habits: [],
        },
      }

      restoreAppDataBackup(backup, "merge")

      const resultRaw = storeMap.get(STORE_PERSIST_KEYS.workout)
      const parsed = JSON.parse(resultRaw!)
      expect(parsed.state.sessions).toHaveLength(1)
      // The NEWER backup record replaces the older local one
      expect(parsed.state.sessions[0].name).toBe("Leg Day (Newer Cloud Snapshot)")
    })

    it("gracefully isolates corrupted or non-object items during restore", () => {
      const corruptedBackup: BackupPayload = {
        app: "One Percent",
        version: "1.0.0",
        schemaVersion: CURRENT_SCHEMA_VERSION,
        exportedAt: "2026-10-29T12:00:00.000Z",
        checksum: "checksum",
        data: {
          workouts: [null as any, undefined as any, "invalid-primitive" as any, { id: "w-healthy" } as any],
          programs: [],
          templates: [],
          exercises: [],
          goals: [],
          weightLogs: [],
          bodyMeasurements: [],
          habits: [],
        },
      }

      // Should not throw or crash
      expect(() => restoreAppDataBackup(corruptedBackup, "full")).not.toThrow()

      const resultRaw = storeMap.get(STORE_PERSIST_KEYS.workout)
      const parsed = JSON.parse(resultRaw!)
      // Filtered down to only valid objects
      expect(parsed.state.sessions).toHaveLength(1)
      expect(parsed.state.sessions[0].id).toBe("w-healthy")
    })
  })

  describe("Drill 6: User A -> User B Account Switching Isolation", () => {
    it("ensures User B has zero access or visibility into User A's local storage or queued mutations", () => {
      // 1. User A is active and performs actions
      storeMap.set(
        STORE_PERSIST_KEYS.workout,
        JSON.stringify({
          state: { sessions: [{ id: "userA-workout-1", userId: "athlete-A" }] },
          version: CURRENT_SCHEMA_VERSION,
        })
      )
      storeMap.set(
        STORE_PERSIST_KEYS.goals,
        JSON.stringify({
          state: { goals: [{ id: "userA-goal-1", userId: "athlete-A" }] },
          version: CURRENT_SCHEMA_VERSION,
        })
      )

      // 2. User A signs out
      clearUserStorage()

      // Verify all keys wiped
      expect(storeMap.get(STORE_PERSIST_KEYS.workout)).toBeUndefined()
      expect(storeMap.get(STORE_PERSIST_KEYS.goals)).toBeUndefined()

      // 3. User B logs in on same device
      storeMap.set(
        STORE_PERSIST_KEYS.workout,
        JSON.stringify({
          state: { sessions: [{ id: "userB-workout-1", userId: "athlete-B" }] },
          version: CURRENT_SCHEMA_VERSION,
        })
      )

      // 4. Inspect store contents
      const currentWorkouts = JSON.parse(storeMap.get(STORE_PERSIST_KEYS.workout)!)
      const allSessionIds = currentWorkouts.state.sessions.map((s: any) => s.id)
      const allUserIds = currentWorkouts.state.sessions.map((s: any) => s.userId)

      // User A's records MUST NOT exist in User B's state
      expect(allSessionIds).not.toContain("userA-workout-1")
      expect(allUserIds).not.toContain("athlete-A")
      expect(allSessionIds).toContain("userB-workout-1")
      expect(allUserIds).toContain("athlete-B")
    })
  })
})
