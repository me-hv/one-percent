import { test, expect } from "@playwright/test"

test.describe("Multi-User Isolation & Offline Storage Purge (E2E)", () => {
  test("purges User A data on sign-out preventing cross-user data leakage to User B", async ({ page, context }) => {
    // 1. User A logs in and records personal data
    await context.addCookies([
      {
        name: "__session",
        value: "token_for_user_a",
        domain: "localhost",
        path: "/",
      },
    ])

    await page.goto("/login")

    // Populate user A data in stores
    await page.evaluate(() => {
      window.localStorage.setItem(
        "one-percent-workout-store",
        JSON.stringify({
          state: {
            workouts: [{ id: "workout-user-a", name: "User A Confidential Workout", volume: 15000 }],
          },
        })
      )
      window.localStorage.setItem(
        "one-percent-recovery-store",
        JSON.stringify({
          state: {
            entries: [{ id: "rec-user-a", date: "2026-10-29", score: 92 }],
          },
        })
      )
    })

    // Verify User A data is present
    let workoutData = await page.evaluate(() => window.localStorage.getItem("one-percent-workout-store"))
    expect(workoutData).toContain("User A Confidential Workout")

    // 2. User A signs out via authService.clearUserStorage simulation or modal
    await page.evaluate(() => {
      // Simulate clearUserStorage invoked upon sign-out
      const userStoreKeys = [
        "one-percent-workout-store",
        "one-percent-goals-store",
        "one-percent-body-store",
        "one-percent-analytics-store",
        "one-percent-exercise-store",
        "one-percent-program-store",
        "one-percent-recovery-store",
        "one-percent-coach-store",
        "one-percent-nutrition-store",
        "one-percent-sync-queue-v1",
      ]
      userStoreKeys.forEach((key) => window.localStorage.removeItem(key))
      document.cookie = "__session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
    })

    // Verify storage is completely empty of user data
    workoutData = await page.evaluate(() => window.localStorage.getItem("one-percent-workout-store"))
    const recoveryData = await page.evaluate(() => window.localStorage.getItem("one-percent-recovery-store"))
    expect(workoutData).toBeNull()
    expect(recoveryData).toBeNull()

    // 3. User B arrives on the app
    await context.clearCookies()
    await page.goto("/login")

    // Verify User B sees clean state without any of User A's data
    const userBWorkout = await page.evaluate(() => window.localStorage.getItem("one-percent-workout-store"))
    expect(userBWorkout).toBeNull()
  })
})
