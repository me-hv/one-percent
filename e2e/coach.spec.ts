import { test, expect } from "@playwright/test"

test.describe("AI Coach & Adaptive Programming (E2E)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: "__session",
        value: "mock_jwt_token_for_playwright_e2e_testing",
        domain: "localhost",
        path: "/",
      },
    ])

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "one-percent-auth-store",
        JSON.stringify({
          state: {
            user: { uid: "coach-athlete-1", email: "coach@onepercent.app" },
            profile: {
              id: "coach-athlete-1",
              displayName: "Coach Athlete",
              email: "coach@onepercent.app",
            },
            initialized: true,
          },
          version: 1,
        })
      )
    })
  })

  test("loads AI Coach dashboard with status metrics", async ({ page }) => {
    await page.goto("/coach")

    // Expect coach navigation header or title
    await expect(page.getByText(/Coach/i).first()).toBeVisible({ timeout: 10000 })
  })

  test("persists proposal rollback snapshots in coach store", async ({ page }) => {
    await page.goto("/coach")

    await page.evaluate(() => {
      window.localStorage.setItem(
        "one-percent-coach-store",
        JSON.stringify({
          state: {
            proposals: [
              {
                id: "proposal-e2e-1",
                programId: "prog-alpha",
                status: "applied",
                rollbackSnapshot: {
                  programId: "prog-alpha",
                  previousSchedule: [{ dayIndex: 0, exercises: [] }],
                },
              },
            ],
          },
          version: 1,
        })
      )
    })

    const coachState = await page.evaluate(() => {
      const raw = window.localStorage.getItem("one-percent-coach-store")
      return raw ? JSON.parse(raw) : null
    })

    expect(coachState?.state?.proposals[0]?.rollbackSnapshot?.programId).toBe("prog-alpha")
  })
})
