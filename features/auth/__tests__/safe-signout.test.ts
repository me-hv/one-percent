import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { syncQueueService } from "@/lib/services/sync-queue.service"
import { clearUserStorage } from "../services/auth.service"

describe("Safe Sign-Out with Unsynchronized Data Protection", () => {
  const storeMap = new Map<string, string>()

  const mockLocalStorage = {
    getItem: (key: string) => storeMap.get(key) || null,
    setItem: (key: string, value: string) => storeMap.set(key, value),
    removeItem: (key: string) => storeMap.delete(key),
    clear: () => storeMap.clear(),
  }

  beforeEach(() => {
    storeMap.clear()
    ;(globalThis as any).localStorage = mockLocalStorage
    ;(globalThis as any).window = globalThis
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      configurable: true,
      writable: true,
    })

    // Reset sync queue
    syncQueueService.clearQueueForTesting()
  })

  afterEach(() => {
    delete (globalThis as any).localStorage
    delete (globalThis as any).window
  })

  it("detects unsynchronized mutations in the offline sync queue", () => {
    const initialPending = syncQueueService
      .getQueue()
      .filter((op) => op.status === "pending" || op.status === "processing" || op.status === "failed")
    expect(initialPending.length).toBe(0)

    // Enqueue an offline mutation
    syncQueueService.enqueue("workout", "workout-test-1", "create", {
      id: "workout-test-1",
      name: "Heavy Deadlift Day",
      volume: 12000,
    })

    const pending = syncQueueService
      .getQueue()
      .filter((op) => op.status === "pending" || op.status === "processing" || op.status === "failed")

    expect(pending.length).toBeGreaterThanOrEqual(1)
    expect(pending[0]?.entityType).toBe("workout")
    expect(pending[0]?.entityId).toBe("workout-test-1")
  })

  it("can flush the sync queue before sign out when online", async () => {
    syncQueueService.enqueue("recovery", "rec-entry-1", "create", {
      date: "2026-10-29",
      score: 85,
    })

    // Await background flush dispatch
    await new Promise((resolve) => setTimeout(resolve, 450))

    const remaining = syncQueueService
      .getQueue()
      .filter((op) => op.status === "pending" || op.status === "processing" || op.status === "failed")

    expect(remaining.length).toBe(0)
  })

  it("purges user stores on intentional sign out confirmation", () => {
    mockLocalStorage.setItem("one-percent-workout-store", JSON.stringify({ workouts: [{ id: "w-1" }] }))
    mockLocalStorage.setItem("one-percent-recovery-store", JSON.stringify({ entries: [{ id: "r-1" }] }))
    mockLocalStorage.setItem("one-percent-coach-store", JSON.stringify({ proposals: [] }))

    expect(mockLocalStorage.getItem("one-percent-workout-store")).not.toBeNull()

    // Clear user storage
    clearUserStorage()

    expect(mockLocalStorage.getItem("one-percent-workout-store")).toBeNull()
    expect(mockLocalStorage.getItem("one-percent-recovery-store")).toBeNull()
    expect(mockLocalStorage.getItem("one-percent-coach-store")).toBeNull()
  })
})
