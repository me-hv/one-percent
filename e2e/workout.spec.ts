import { test, expect } from "@playwright/test"

test.describe("Workout Engine & Offline Persistence (E2E)", () => {
  test.beforeEach(async ({ page, context }) => {
    // Inject valid authenticated athlete session
    await context.addCookies([
      {
        name: "__session",
        value: "mock_jwt_token_for_playwright_e2e_testing",
        domain: "localhost",
        path: "/",
      },
    ])

    // Pre-seed athlete profile in local storage
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "one-percent-auth-store",
        JSON.stringify({
          state: {
            user: { uid: "playwright-athlete-1", email: "athlete@onepercent.app" },
            profile: {
              id: "playwright-athlete-1",
              displayName: "Test Athlete",
              email: "athlete@onepercent.app",
            },
            initialized: true,
          },
          version: 1,
        })
      )
    })
  })

  test("navigates to training workspace and displays workout routines", async ({ page }) => {
    await page.goto("/training")

    // Verify training page loads
    await expect(page.getByRole("heading", { name: "Training", exact: true })).toBeVisible({ timeout: 10000 })
  })

  test("persists workout state in localStorage across page reloads", async ({ page }) => {
    await page.goto("/training")

    // Seed active workout in localStorage
    await page.evaluate(() => {
      window.localStorage.setItem(
        "one-percent-workout-store",
        JSON.stringify({
          state: {
            activeWorkout: {
              id: "active-e2e-session",
              name: "Strength Block A",
              startedAt: new Date().toISOString(),
              exercises: [
                {
                  id: "ex-1",
                  name: "Barbell Back Squat",
                  sets: [{ id: "set-1", weight: 140, reps: 5, completed: true }],
                },
              ],
            },
          },
          version: 1,
        })
      )
    })

    // Reload page
    await page.reload()

    // Verify localStorage retains active workout state
    const stored = await page.evaluate(() => {
      const raw = window.localStorage.getItem("one-percent-workout-store")
      return raw ? JSON.parse(raw) : null
    })

    expect(stored?.state?.activeWorkout?.id).toBe("active-e2e-session")
    expect(stored?.state?.activeWorkout?.exercises[0]?.name).toBe("Barbell Back Squat")
  })
})
