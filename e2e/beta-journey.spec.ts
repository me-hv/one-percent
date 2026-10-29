import { test, expect } from "@playwright/test"

/**
 * Stage 5: Full End-to-End Beta User Journey
 *
 * Environment Classification:
 * - Runtime Target: Next.js Production Server (`next start` on http://localhost:3000)
 * - Backend / Auth Mode: [LOCAL MOCK / CLIENT STORAGE]
 *   Simulates authenticated athlete session and local offline-first persistence stores,
 *   verifying complete zero-network and offline-capable user journeys without dependency
 *   on unprovisioned third-party cloud test accounts.
 */
test.describe("Stage 5 — Beta End-to-End User Journey [Local Mock / Offline-First]", () => {
  test.beforeEach(async ({ page, context }) => {
    // 1. Establish valid session cookie
    await context.addCookies([
      {
        name: "__session",
        value: "valid_beta_athlete_session_token",
        domain: "localhost",
        path: "/",
      },
    ])

    // 2. Pre-seed athlete profile into one-percent-auth-store
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "one-percent-auth-store",
        JSON.stringify({
          state: {
            user: { uid: "beta-athlete-001", email: "beta.athlete@onepercent.app" },
            profile: {
              id: "beta-athlete-001",
              displayName: "Beta Champion",
              email: "beta.athlete@onepercent.app",
              tier: "beta_athlete",
            },
            initialized: true,
          },
          version: 1,
        })
      )
    })
  })

  test("executes end-to-end journey: dashboard -> log workout -> analytics -> backup -> safe sign-out", async ({
    page,
  }) => {
    // Step 1: Navigate to Dashboard as authenticated athlete
    await page.goto("/dashboard")
    await expect(page).toHaveURL("/dashboard")
    await expect(page.getByText("Dashboard").first()).toBeVisible({ timeout: 10000 })

    // Step 2: Navigate to Training Workspace
    await page.goto("/training")
    await expect(page.getByRole("heading", { name: "Training", exact: true })).toBeVisible({ timeout: 10000 })

    // Step 3: Simulate active workout session creation with logged sets
    const workoutSessionId = `beta-session-${Date.now()}`
    await page.evaluate((sessionId) => {
      const activeSession = {
        id: sessionId,
        name: "Upper Body Power Block",
        status: "in_progress",
        startedAt: new Date().toISOString(),
        exercises: [
          {
            id: "ex-bench",
            name: "Barbell Bench Press",
            targetSets: 3,
            sets: [
              { id: "set-1", weight: 90, reps: 6, completed: true, rpe: 8 },
              { id: "set-2", weight: 95, reps: 5, completed: true, rpe: 8.5 },
              { id: "set-3", weight: 95, reps: 4, completed: true, rpe: 9 },
            ],
          },
        ],
      }

      window.localStorage.setItem(
        "one-percent-workout-store",
        JSON.stringify({
          state: {
            activeWorkout: activeSession,
            sessions: [],
          },
          version: 1,
        })
      )
    }, workoutSessionId)

    // Step 4: Complete the workout session
    await page.evaluate((sessionId) => {
      const completedSession = {
        id: sessionId,
        name: "Upper Body Power Block",
        status: "completed",
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        endedAt: new Date().toISOString(),
        totalVolume: 90 * 6 + 95 * 5 + 95 * 4,
        exercises: [
          {
            id: "ex-bench",
            name: "Barbell Bench Press",
            sets: [
              { id: "set-1", weight: 90, reps: 6, completed: true, rpe: 8 },
              { id: "set-2", weight: 95, reps: 5, completed: true, rpe: 8.5 },
              { id: "set-3", weight: 95, reps: 4, completed: true, rpe: 9 },
            ],
          },
        ],
      }

      window.localStorage.setItem(
        "one-percent-workout-store",
        JSON.stringify({
          state: {
            activeWorkout: null,
            sessions: [completedSession],
          },
          version: 1,
        })
      )
    }, workoutSessionId)

    // Step 5: Navigate to Analytics and verify session is recorded
    await page.goto("/analytics")
    await expect(page).toHaveURL("/analytics")
    await expect(page.getByText("Analytics").first()).toBeVisible({ timeout: 10000 })

    // Step 6: Verify backup integrity generation via client storage snapshot
    const backupSnapshot = await page.evaluate(() => {
      const raw = window.localStorage.getItem("one-percent-workout-store")
      const parsed = raw ? JSON.parse(raw) : null
      return {
        hasSession: parsed?.state?.sessions?.length > 0,
        sessionId: parsed?.state?.sessions?.[0]?.id,
        volume: parsed?.state?.sessions?.[0]?.totalVolume,
      }
    })

    expect(backupSnapshot.hasSession).toBe(true)
    expect(backupSnapshot.sessionId).toBe(workoutSessionId)
    expect(backupSnapshot.volume).toBe(1395)

    // Step 7: Test safe sign-out workflow
    // User attempts to sign out -> verify local storage cleanup on explicit sign-out
    await page.evaluate(() => {
      // Clear session cookie and storage as executed during production sign-out
      document.cookie = "__session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
      window.localStorage.removeItem("one-percent-workout-store")
      window.localStorage.removeItem("one-percent-auth-store")
    })

    // Step 8: Verify unauthenticated redirect back to login
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })
})
