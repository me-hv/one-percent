import { describe, it, expect, vi } from "vitest"
import { authService } from "../services/auth.service"
import { getFirebaseAuthErrorMessage } from "../utils/auth-errors"

describe("authService & Auth Verification", () => {
  it("translates invalid password attempts into clean user-facing error message", async () => {
    try {
      await authService.signIn("tester-nonexistent@onepercent.app", "wrongpassword123")
      // Should not reach here
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.code).not.toBe("auth/network-request-failed")
      expect(["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"]).toContain(err.code)

      const userFriendlyMessage = getFirebaseAuthErrorMessage(err)
      expect(userFriendlyMessage).toBe("Invalid email address or password. Please verify your credentials and try again.")
    }
  })

  it("handles sign out properly", async () => {
    await expect(authService.signOut()).resolves.toBeUndefined()
  })
})
