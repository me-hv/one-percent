import type { DailyRecoveryEntry, RecoveryConfig } from "@/lib/types/recovery.types"
import { STORE_PERSIST_KEYS, CURRENT_SCHEMA_VERSION } from "@/lib/constants/VERSION"

export const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  targetSleepMinutes: 480, // 8 hours baseline
  minCompletenessPct: 40,  // Require at least 40% of factors for readiness score
}

export class RecoveryRepository {
  private getLocalState(): Record<string, unknown> {
    if (typeof window === "undefined") return {}
    try {
      const raw = localStorage.getItem(STORE_PERSIST_KEYS.recovery)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return parsed.state || {}
    } catch {
      return {}
    }
  }

  public getEntries(): DailyRecoveryEntry[] {
    const state = this.getLocalState()
    return (state.entries as DailyRecoveryEntry[]) || []
  }

  public getEntryByDate(dateStr: string): DailyRecoveryEntry | null {
    const entries = this.getEntries()
    return entries.find((e) => e.date === dateStr) || null
  }

  public getConfig(): RecoveryConfig {
    const state = this.getLocalState()
    return (state.config as RecoveryConfig) || DEFAULT_RECOVERY_CONFIG
  }
}

export const recoveryRepository = new RecoveryRepository()
