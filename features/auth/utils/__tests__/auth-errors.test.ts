import { describe, it, expect } from "vitest"
import { getFirebaseAuthErrorMessage } from "../auth-errors"

describe("getFirebaseAuthErrorMessage", () => {
  it("provides helpful message for network-request-failed", () => {
    const msg = getFirebaseAuthErrorMessage({ code: "auth/network-request-failed" })
    expect(msg).toContain("Unable to")
  })

  it("handles invalid credentials securely without revealing whether user exists", () => {
    const credMsg = getFirebaseAuthErrorMessage({ code: "auth/invalid-credential" })
    const wrongPassMsg = getFirebaseAuthErrorMessage({ code: "auth/wrong-password" })
    const noUserMsg = getFirebaseAuthErrorMessage({ code: "auth/user-not-found" })

    expect(credMsg).toBe("Invalid email address or password. Please verify your credentials and try again.")
    expect(wrongPassMsg).toBe(credMsg)
    expect(noUserMsg).toBe(credMsg)
  })

  it("handles unauthorized domain error with console guidance", () => {
    const msg = getFirebaseAuthErrorMessage({ code: "auth/unauthorized-domain" })
    expect(msg).toContain("Authorized Domains")
  })

  it("handles disabled provider with sign-in method guidance", () => {
    const msg = getFirebaseAuthErrorMessage({ code: "auth/operation-not-allowed" })
    expect(msg).toContain("Sign-in method")
  })

  it("handles too many requests rate limit", () => {
    const msg = getFirebaseAuthErrorMessage({ code: "auth/too-many-requests" })
    expect(msg).toContain("temporarily disabled")
  })

  it("handles email already in use on registration", () => {
    const msg = getFirebaseAuthErrorMessage({ code: "auth/email-already-in-use" })
    expect(msg).toContain("already exists")
  })

  it("handles weak password on registration", () => {
    const msg = getFirebaseAuthErrorMessage({ code: "auth/weak-password" })
    expect(msg).toContain("at least 6 characters")
  })

  it("handles unknown or malformed error objects safely", () => {
    expect(getFirebaseAuthErrorMessage(null)).toBe("An unexpected error occurred. Please try again.")
    expect(getFirebaseAuthErrorMessage(undefined)).toBe("An unexpected error occurred. Please try again.")
    expect(getFirebaseAuthErrorMessage("some string")).toBe("An unexpected error occurred. Please try again.")
  })
})
