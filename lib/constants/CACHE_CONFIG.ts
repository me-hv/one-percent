/**
 * TanStack Query Cache Configuration
 *
 * Stale times are calibrated per data category:
 * - Fast-changing data (active workout) = 0 stale time (always fresh)
 * - Session history = 5 min (user won't change past sessions often)
 * - Exercise library = 24h (rarely changes)
 * - Analytics = 10 min (expensive to compute, acceptable staleness)
 */

export const CACHE_CONFIG = {
  // ─── Stale Times (ms) ──────────────────────────────────────────
  staleTime: {
    immediate:    0,             // Always refetch (active workout, real-time)
    fast:         30_000,        // 30s — today's data
    short:        60_000,        // 1m  — current session data
    medium:       5 * 60_000,    // 5m  — recent history
    long:         10 * 60_000,   // 10m — analytics, aggregates
    day:          24 * 60 * 60_000, // 24h — exercise library, static content
  },

  // ─── GC Times (ms after becoming unused) ──────────────────────
  gcTime: {
    short:  5 * 60_000,     // 5m  — short-lived data
    medium: 30 * 60_000,    // 30m — standard
    long:   60 * 60_000,    // 1h  — frequently accessed
    day:    24 * 60 * 60_000, // 24h — exercise library, static
  },

  // ─── Retry Config ─────────────────────────────────────────────
  retry: {
    count: 3,
    delay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  },

  // ─── Per-Query Defaults ────────────────────────────────────────
  queries: {
    // Training
    workoutSession:   { staleTime: 0,           gcTime: 5 * 60_000   },
    workoutHistory:   { staleTime: 5 * 60_000,  gcTime: 30 * 60_000  },
    programs:         { staleTime: 5 * 60_000,  gcTime: 60 * 60_000  },
    exerciseLibrary:  { staleTime: 24 * 60 * 60_000, gcTime: 24 * 60 * 60_000 },
    personalRecords:  { staleTime: 5 * 60_000,  gcTime: 30 * 60_000  },

    // Nutrition
    dailyNutrition:   { staleTime: 30_000,       gcTime: 5 * 60_000   },
    nutritionHistory: { staleTime: 5 * 60_000,  gcTime: 30 * 60_000  },
    foodDatabase:     { staleTime: 60 * 60_000, gcTime: 24 * 60 * 60_000 },

    // Body
    weightLog:        { staleTime: 5 * 60_000,  gcTime: 30 * 60_000  },
    measurements:     { staleTime: 5 * 60_000,  gcTime: 30 * 60_000  },
    photos:           { staleTime: 10 * 60_000, gcTime: 60 * 60_000  },

    // Recovery
    sleepLog:         { staleTime: 5 * 60_000,  gcTime: 30 * 60_000  },
    recoveryScore:    { staleTime: 60_000,       gcTime: 5 * 60_000   },

    // Habits
    habitLog:         { staleTime: 30_000,       gcTime: 5 * 60_000   },
    habitHistory:     { staleTime: 5 * 60_000,  gcTime: 30 * 60_000  },

    // Analytics
    analytics:        { staleTime: 10 * 60_000, gcTime: 30 * 60_000  },

    // Coach
    briefing:         { staleTime: 5 * 60_000,  gcTime: 30 * 60_000  },

    // User
    profile:          { staleTime: 5 * 60_000,  gcTime: 60 * 60_000  },
  },
} as const
