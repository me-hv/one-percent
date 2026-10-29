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
2. **Sync Inputs**: `WorkoutSession[]`, `WeightLog[]`, `BodyMeasurements[]`, `HabitLog[]`, `DailyRecoveryEntry[]`.
3. **Execution**: `goals-sync.service.ts` inspects active goals, matches `autoUpdateKey` or `exerciseId`, recalculates `currentValue` & `progressPct`, and triggers milestone callout notifications (*"Only 5kg left to your Bench goal"*).

---

## 3. Recovery & Readiness Pipeline

1. **Daily Check-In**: User records sleep duration, sleep quality, energy, stress, fatigue, motivation, DOMS muscle soreness map, optional biometrics (RHR/HRV), and notes.
2. **Readiness Calculation**: `readiness.service.ts` computes a 0–100 score dynamically normalizing available factor weights (sleep duration 30%, sleep quality 25%, energy 15%, fatigue 10%, soreness 10%, stress 10%), requiring $\ge 40\%$ completeness.
3. **Training Load & Muscle Recovery**: `training-load.service.ts` evaluates actual completed sessions for 7d/28d volume, Acute:Chronic Workload Ratio (ACWR), and per-muscle recovery estimates (fresh / recovering / strained / untrained).
4. **Platform Integration**: Feeds into the Dashboard `RecoveryWidget`, overall Performance Score (10% recovery factor weight), and Goal auto-updates (`sleep_hours`, `readiness_score`).

---

## 4. Query & Cache Management

- **TanStack Query (React Query)** handles remote Firestore query caching and background refetching using strict query key hierarchies defined in `lib/constants/QUERY_KEYS.ts`.
- Cache stales are managed via `lib/constants/CACHE_CONFIG.ts`.
