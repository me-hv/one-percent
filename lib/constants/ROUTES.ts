/**
 * Application Routes Registry
 *
 * Single source of truth for all route paths.
 * Never hardcode route strings in components — always use ROUTES.
 * Type-safe route helpers included for parameterized routes.
 */

export const ROUTES = {
  // ─── Public / Auth ─────────────────────────────────────────────
  auth: {
    login:          "/login",
    register:       "/register",
    forgotPassword: "/forgot-password",
    resetPassword:  "/reset-password",
    verifyEmail:    "/verify-email",
    onboarding:     "/onboarding",
  },

  // ─── App Root ──────────────────────────────────────────────────
  dashboard: "/dashboard",

  // ─── Training ─────────────────────────────────────────────────
  training: {
    root:      "/training",
    sessions:  "/training/sessions",
    session:   (id: string) => `/training/sessions/${id}`,
    log:       "/training/log",           // Active workout
    programs:  "/training/programs",
    program:   (id: string) => `/training/programs/${id}`,
    exercises: "/training/exercises",
    exercise:  (id: string) => `/training/exercises/${id}`,
    calendar:  "/training/calendar",
    prs:       "/training/personal-records",
  },

  // ─── Nutrition ─────────────────────────────────────────────────
  nutrition: {
    root:   "/nutrition",
    log:    "/nutrition/log",
    log_date: (date: string) => `/nutrition/log/${date}`,
    foods:  "/nutrition/foods",
    meals:  "/nutrition/meals",
    targets: "/nutrition/targets",
    history: "/nutrition/history",
  },

  // ─── Body ──────────────────────────────────────────────────────
  body: {
    root:         "/body",
    weight:       "/body/weight",
    measurements: "/body/measurements",
    photos:       "/body/photos",
    photo:        (id: string) => `/body/photos/${id}`,
  },

  // ─── Recovery ──────────────────────────────────────────────────
  recovery: {
    root:    "/recovery",
    sleep:   "/recovery/sleep",
    scores:  "/recovery/scores",
    history: "/recovery/history",
  },

  // ─── Habits ───────────────────────────────────────────────────
  habits: {
    root:    "/habits",
    tracker: "/habits/tracker",
    history: "/habits/history",
    manage:  "/habits/manage",
  },

  // ─── Goals ────────────────────────────────────────────────────
  goals: {
    root:      "/goals",
    active:    "/goals/active",
    completed: "/goals/completed",
    goal:      (id: string) => `/goals/${id}`,
    new:       "/goals/new",
  },

  // ─── Analytics ────────────────────────────────────────────────
  analytics: {
    root:        "/analytics",
    training:    "/analytics/training",
    nutrition:   "/analytics/nutrition",
    body:        "/analytics/body",
    recovery:    "/analytics/recovery",
    habits:      "/analytics/habits",
    comparative: "/analytics/comparative",
    export:      "/analytics/export",
  },

  // ─── AI Coach ────────────────────────────────────────────────
  coach: {
    root:     "/coach",
    briefing: "/coach/briefing",
    chat:     "/coach/chat",
    reports:  "/coach/reports",
  },

  // ─── Achievements ─────────────────────────────────────────────
  achievements: {
    root:      "/achievements",
    unlocked:  "/achievements/unlocked",
    available: "/achievements/available",
  },

  // ─── Settings ─────────────────────────────────────────────────
  settings: {
    root:          "/settings",
    profile:       "/settings/profile",
    units:         "/settings/units",
    notifications: "/settings/notifications",
    integrations:  "/settings/integrations",
    billing:       "/settings/billing",
    data:          "/settings/data",
    appearance:    "/settings/appearance",
    privacy:       "/settings/privacy",
    danger:        "/settings/danger-zone",
  },

  // ─── API Routes ───────────────────────────────────────────────
  api: {
    auth: {
      session:    "/api/auth/session",
      signOut:    "/api/auth/sign-out",
    },
    coach: {
      message:   "/api/coach/message",
      briefing:  "/api/coach/briefing",
      report:    "/api/coach/report",
    },
    upload: {
      photo:     "/api/upload/photo",
    },
    integrations: {
      whoop:  "/api/integrations/whoop",
      oura:   "/api/integrations/oura",
      garmin: "/api/integrations/garmin",
      apple:  "/api/integrations/apple-health",
    },
    webhooks: {
      stripe: "/api/webhooks/stripe",
    },
  },
} as const

// ─── Type Helpers ──────────────────────────────────────────────────
export type Route = string
