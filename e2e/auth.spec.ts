import { test, expect } from "@playwright/test"

test.describe("Authentication & Session Lifecycle (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test("renders login page with branding, credentials form, and Google sign-in", async ({ page }) => {
    await page.goto("/login")

    // Check branding
    await expect(page.getByText("1%").first()).toBeVisible()
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()

    // Check form inputs
    const emailInput = page.getByLabel("Email address")
    const passwordInput = page.getByLabel("Password")
    const submitButton = page.getByRole("button", { name: /Sign In/i })
    const googleButton = page.getByRole("button", { name: /Continue with Google/i })

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
    await expect(googleButton).toBeVisible()
  })

  test("validates required fields on empty submission", async ({ page }) => {
    await page.goto("/login")
    const submitButton = page.getByRole("button", { name: /Sign In/i })

    await submitButton.click()

    // HTML5 validation prevents submission of empty required fields
    const emailInput = page.getByLabel("Email address")
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity())
    expect(isValid).toBe(false)
  })

  test("displays error message on invalid credentials", async ({ page }) => {
    await page.goto("/login")

    await page.getByLabel("Email address").fill("invalid-athlete@onepercent.app")
    await page.getByLabel("Password").fill("wrongpassword123")
    await page.getByRole("button", { name: /Sign In/i }).click()

    // Expect error alert banner or error toast to appear
    await expect(
      page.locator(".text-destructive").filter({
        hasText: /Invalid email address or password|invalid-credential/i,
      }).first()
    ).toBeVisible({ timeout: 10000 })
  })

  test("redirects unauthenticated user visiting /dashboard to /login with redirect param", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/)
  })

  test("protects against open redirect attacks in redirect parameter", async ({ page }) => {
    // Malicious external redirect attempt
    await page.goto("/login?redirect=https://evil-phishing.com")
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()

    // Verify application remains on origin and does not redirect to external malicious origin
    const currentUrl = page.url()
    expect(new URL(currentUrl).origin).toBe("http://localhost:3000")
  })
})
