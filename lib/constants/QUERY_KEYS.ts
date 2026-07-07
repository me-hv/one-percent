/**
 * TanStack Query Key Registry
 *
 * All query keys follow a hierarchical namespace pattern.
 * This enables precise cache invalidation:
 *   - Invalidate ['training', 'sessions', userId] → all session queries for user
 *   - Invalidate ['training'] → all training data for all users
 *
 * Never use raw string arrays in query calls — always use QUERY_KEYS.
 *
 * Usage:
 *   useQuery({ queryKey: QUERY_KEYS.training.session(userId, sessionId), ... })
 *   queryClient.invalidateQueries({ queryKey: QUERY_KEYS.training.sessions(userId) })
 */

export const QUERY_KEYS = {
  // ─── Training ───────────────────────────────────────────────────
  training: {
    all:      () => ["training"] as const,
    sessions: (userId: string) => ["training", "sessions", userId] as const,
    session:  (userId: string, sessionId: string) =>
                ["training", "sessions", userId, sessionId] as const,
    programs: (userId: string) => ["training", "programs", userId] as const,
    program:  (userId: string, programId: string) =>
                ["training", "programs", userId, programId] as const,
    exercises:         () => ["training", "exercises"] as const,
    exercisesCustom:   (userId: string) => ["training", "exercises", "custom", userId] as const,
    exercise:          (exerciseId: string) => ["training", "exercises", exerciseId] as const,
    prs:               (userId: string) => ["training", "prs", userId] as const,
    prsByExercise:     (userId: string, exerciseId: string) =>
                         ["training", "prs", userId, exerciseId] as const,
    calendar:          (userId: string, year: number, month: number) =>
                         ["training", "calendar", userId, year, month] as const,
    activeProgram:     (userId: string) => ["training", "activeProgram", userId] as const,
  },

  // ─── Nutrition ─────────────────────────────────────────────────
  nutrition: {
    all:       (userId: string) => ["nutrition", userId] as const,
    dailyLog:  (userId: string, date: string) => ["nutrition", "daily", userId, date] as const,
    foods:     (userId: string) => ["nutrition", "foods", userId] as const,
    savedMeals:(userId: string) => ["nutrition", "meals", userId] as const,
    targets:   (userId: string) => ["nutrition", "targets", userId] as const,
    history:   (userId: string) => ["nutrition", "history", userId] as const,
  },

  // ─── Body ──────────────────────────────────────────────────────
  body: {
    all:          (userId: string) => ["body", userId] as const,
    weightLog:    (userId: string) => ["body", "weight", userId] as const,
    measurements: (userId: string) => ["body", "measurements", userId] as const,
    photos:       (userId: string) => ["body", "photos", userId] as const,
    photo:        (userId: string, photoId: string) =>
                    ["body", "photos", userId, photoId] as const,
  },

  // ─── Recovery ──────────────────────────────────────────────────
  recovery: {
    all:      (userId: string) => ["recovery", userId] as const,
    sleepLog: (userId: string) => ["recovery", "sleep", userId] as const,
    scores:   (userId: string) => ["recovery", "scores", userId] as const,
    today:    (userId: string) => ["recovery", "today", userId] as const,
  },

  // ─── Habits ────────────────────────────────────────────────────
  habits: {
    all:     (userId: string) => ["habits", userId] as const,
    list:    (userId: string) => ["habits", "list", userId] as const,
    logs:    (userId: string) => ["habits", "logs", userId] as const,
    log:     (userId: string, date: string) => ["habits", "logs", userId, date] as const,
    history: (userId: string, habitId: string) =>
               ["habits", "history", userId, habitId] as const,
  },

  // ─── Goals ─────────────────────────────────────────────────────
  goals: {
    all:       (userId: string) => ["goals", userId] as const,
    active:    (userId: string) => ["goals", "active", userId] as const,
    completed: (userId: string) => ["goals", "completed", userId] as const,
    goal:      (userId: string, goalId: string) => ["goals", userId, goalId] as const,
  },

  // ─── Analytics ─────────────────────────────────────────────────
  analytics: {
    all:              (userId: string) => ["analytics", userId] as const,
    training:         (userId: string, period: string) =>
                        ["analytics", "training", userId, period] as const,
    nutrition:        (userId: string, period: string) =>
                        ["analytics", "nutrition", userId, period] as const,
    body:             (userId: string, period: string) =>
                        ["analytics", "body", userId, period] as const,
    recovery:         (userId: string, period: string) =>
                        ["analytics", "recovery", userId, period] as const,
    habits:           (userId: string, period: string) =>
                        ["analytics", "habits", userId, period] as const,
    comparative:      (userId: string, periodA: string, periodB: string) =>
                        ["analytics", "comparative", userId, periodA, periodB] as const,
  },

  // ─── AI Coach ──────────────────────────────────────────────────
  coach: {
    all:            (userId: string) => ["coach", userId] as const,
    briefing:       (userId: string, date: string) =>
                      ["coach", "briefing", userId, date] as const,
    conversations:  (userId: string) => ["coach", "conversations", userId] as const,
    conversation:   (userId: string, conversationId: string) =>
                      ["coach", "conversations", userId, conversationId] as const,
    reports:        (userId: string) => ["coach", "reports", userId] as const,
  },

  // ─── Achievements ──────────────────────────────────────────────
  achievements: {
    all:      () => ["achievements"] as const,
    unlocked: (userId: string) => ["achievements", "unlocked", userId] as const,
    progress: (userId: string) => ["achievements", "progress", userId] as const,
  },

  // ─── Notifications ─────────────────────────────────────────────
  notifications: {
    all:    (userId: string) => ["notifications", userId] as const,
    unread: (userId: string) => ["notifications", "unread", userId] as const,
  },

  // ─── User / Profile ────────────────────────────────────────────
  user: {
    profile:        (userId: string) => ["user", "profile", userId] as const,
    preferences:    (userId: string) => ["user", "preferences", userId] as const,
    integrations:   (userId: string) => ["user", "integrations", userId] as const,
  },
} as const
