import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { DailyRecoveryEntry, RecoveryConfig } from "@/lib/types/recovery.types"
import { STORE_PERSIST_KEYS, CURRENT_SCHEMA_VERSION } from "@/lib/constants/VERSION"
import { DEFAULT_RECOVERY_CONFIG } from "@/features/recovery/repository/recovery.repository"
import { generateSeedRecoveryEntries } from "@/features/recovery/data/recovery.seed"
import { syncQueueService } from "@/lib/services/sync-queue.service"

interface RecoveryState {
  entries: DailyRecoveryEntry[]
  config: RecoveryConfig

  // Actions
  saveCheckIn: (
    checkInData: Omit<DailyRecoveryEntry, "id" | "schemaVersion" | "createdAt" | "updatedAt">
  ) => DailyRecoveryEntry
  deleteCheckIn: (id: string) => void
  getCheckInByDate: (dateStr: string) => DailyRecoveryEntry | undefined
  updateConfig: (updates: Partial<RecoveryConfig>) => void
  resetToDefaultSeed: () => void
}

export const useRecoveryStore = create<RecoveryState>()(
  persist(
    (set, get) => ({
      entries: generateSeedRecoveryEntries(),
      config: DEFAULT_RECOVERY_CONFIG,

      getCheckInByDate: (dateStr: string) => {
        return get().entries.find((e) => e.date === dateStr)
      },

      saveCheckIn: (checkInData) => {
        const { entries } = get()
        const nowIso = new Date().toISOString()
        const existingIndex = entries.findIndex((e) => e.date === checkInData.date)
        const isUpdate = existingIndex !== -1

        let savedEntry: DailyRecoveryEntry

        if (isUpdate) {
          const existing = entries[existingIndex]!
          savedEntry = {
            ...existing,
            ...checkInData,
            id: existing.id,
            schemaVersion: CURRENT_SCHEMA_VERSION,
            createdAt: existing.createdAt,
            updatedAt: nowIso,
          }
          const updatedEntries = [...entries]
          updatedEntries[existingIndex] = savedEntry
          set({
            entries: updatedEntries.sort((a, b) => b.date.localeCompare(a.date)),
          })
        } else {
          savedEntry = {
            ...checkInData,
            id: `rec-${checkInData.date}`,
            schemaVersion: CURRENT_SCHEMA_VERSION,
            createdAt: nowIso,
            updatedAt: nowIso,
          }
          set({
            entries: [savedEntry, ...entries].sort((a, b) => b.date.localeCompare(a.date)),
          })
        }

        // Enqueue offline sync mutation
        try {
          syncQueueService.enqueue(
            "recovery",
            savedEntry.id,
            isUpdate ? "update" : "create",
            savedEntry
          )
        } catch {
          // Graceful fallback if sync queue fails
        }

        return savedEntry
      },

      deleteCheckIn: (id: string) => {
        const { entries } = get()
        const target = entries.find((e) => e.id === id)
        if (!target) return

        set({
          entries: entries.filter((e) => e.id !== id),
        })

        try {
          syncQueueService.enqueue("recovery", id, "delete", { id, date: target.date })
        } catch {
          // Graceful fallback
        }
      },

      updateConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates },
        }))
      },

      resetToDefaultSeed: () => {
        set({
          entries: generateSeedRecoveryEntries(),
          config: DEFAULT_RECOVERY_CONFIG,
        })
      },
    }),
    {
      name: STORE_PERSIST_KEYS.recovery,
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_SCHEMA_VERSION,
    }
  )
)
