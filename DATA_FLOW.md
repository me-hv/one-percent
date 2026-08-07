# Data Flow Specification — One Percent

This document describes data lifecycles, state hydration, event-driven metrics recalculations, and background sync flows in **One Percent**.

---

## 1. Local Data Lifecycle

```
[User Action]
     │
     ▼
[Zustand Store Action] ──── (Optimistic State Update) ────► [UI Re-render]
     │
     ▼
[LocalStorage Persistence]
     │
     ▼
[Sync Queue Enqueue] ──── (If Online) ────► [Firebase Firestore Sync]
```

---

## 2. Dynamic Metric Auto-Sync

1. **Trigger Points**: Mounted in `/dashboard` and `/goals` pages via `useEffect`.
2. **Sync Inputs**: `WorkoutSession[]`, `WeightLog[]`, `BodyMeasurements[]`, `HabitLog[]`.
3. **Execution**: `goals-sync.service.ts` inspects active goals, matches `autoUpdateKey` or `exerciseId`, recalculates `currentValue` & `progressPct`, and triggers milestone callout notifications (*"Only 5kg left to your Bench goal"*).

---

## 3. Query & Cache Management

- **TanStack Query (React Query)** handles remote Firestore query caching and background refetching using strict query key hierarchies defined in `lib/constants/QUERY_KEYS.ts`.
- Cache stales are managed via `lib/constants/CACHE_CONFIG.ts`.
