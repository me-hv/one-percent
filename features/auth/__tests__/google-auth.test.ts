import { describe, it, expect, vi, beforeEach } from "vitest"
import { authService } from "../services/auth.service"
import { authRepository, getDefaultPreferences } from "../repositories/auth.repository"
import { getFirebaseAuthErrorMessage } from "../utils/auth-errors"
import * as firebaseAuth from "firebase/auth"

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>()
  class MockGoogleAuthProvider {
    setCustomParameters = vi.fn()
  }
  return {
    ...actual,
    signInWithPopup: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    GoogleAuthProvider: MockGoogleAuthProvider,
  }
})

describe("Google Authentication & Permissions System", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (typeof document === "undefined") {
      (global as any).document = { cookie: "" }
    } else {
      document.cookie = ""
    }
  })

  // 1. First-time Google sign-in and profile creation
  it("handles first-time Google user sign-in and initializes profile & preferences", async () => {
    const mockUser = {
      uid: "google-new-user-123",
      email: "newathlete@gmail.com",
      displayName: "New Athlete",
      photoURL: "https://lh3.googleusercontent.com/a/avatar123",
      getIdToken: vi.fn().mockResolvedValue("mock-google-id-token-xyz"),
    }

    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({
      user: mockUser,
    } as any)

    const getProfileSpy = vi.spyOn(authRepository, "getProfile").mockResolvedValueOnce(null)
    const getPrefsSpy = vi.spyOn(authRepository, "getPreferences").mockResolvedValueOnce(null)
    const createProfileSpy = vi.spyOn(authRepository, "createProfile").mockResolvedValueOnce({
      id: "google-new-user-123",
      uid: "google-new-user-123",
      email: "newathlete@gmail.com",
      displayName: "New Athlete",
      photoURL: "https://lh3.googleusercontent.com/a/avatar123",
    } as any)
    const createPrefsSpy = vi.spyOn(authRepository, "createPreferences").mockResolvedValueOnce({
      userId: "google-new-user-123",
      theme: "dark",
    } as any)

    const result = await authService.signInWithGoogle()

    expect(firebaseAuth.signInWithPopup).toHaveBeenCalledTimes(1)
    expect(mockUser.getIdToken).toHaveBeenCalledTimes(1)
    expect(document.cookie).toContain("__session=mock-google-id-token-xyz")

    expect(getProfileSpy).toHaveBeenCalledWith("google-new-user-123")
    expect(createProfileSpy).toHaveBeenCalledWith(
      "google-new-user-123",
      "newathlete@gmail.com",
      "New Athlete",
      "https://lh3.googleusercontent.com/a/avatar123"
    )
    expect(createPrefsSpy).toHaveBeenCalledWith("google-new-user-123")

    expect(result.credential.user.uid).toBe("google-new-user-123")
    expect(result.profile.displayName).toBe("New Athlete")
    expect(result.profile.photoURL).toBe("https://lh3.googleusercontent.com/a/avatar123")
  })

  // 2. Returning Google sign-in and preservation of existing data
  it("handles returning Google user without creating duplicate profile or resetting data", async () => {
    const mockUser = {
      uid: "google-returning-user-456",
      email: "returning@gmail.com",
      displayName: "Existing Athlete",
      photoURL: "https://lh3.googleusercontent.com/a/existing-avatar",
      getIdToken: vi.fn().mockResolvedValue("mock-returning-token-abc"),
    }

    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({
      user: mockUser,
    } as any)

    const existingProfile = {
      id: "google-returning-user-456",
      uid: "google-returning-user-456",
      email: "returning@gmail.com",
      displayName: "Existing Athlete",
      photoURL: "https://lh3.googleusercontent.com/a/existing-avatar",
      plan: "pro",
      onboardingCompleted: true,
    }
    const existingPrefs = {
      userId: "google-returning-user-456",
      theme: "dark",
      units: { weight: "lbs" },
    }

    const getProfileSpy = vi.spyOn(authRepository, "getProfile").mockResolvedValueOnce(existingProfile as any)
    const getPrefsSpy = vi.spyOn(authRepository, "getPreferences").mockResolvedValueOnce(existingPrefs as any)
    const createProfileSpy = vi.spyOn(authRepository, "createProfile")
    const createPrefsSpy = vi.spyOn(authRepository, "createPreferences")

    const result = await authService.signInWithGoogle()

    expect(getProfileSpy).toHaveBeenCalledWith("google-returning-user-456")
    expect(createProfileSpy).not.toHaveBeenCalled()
    expect(createPrefsSpy).not.toHaveBeenCalled()

    expect(result.credential.user.uid).toBe("google-returning-user-456")
    expect(result.profile.displayName).toBe("Existing Athlete")
    expect(result.profile.plan).toBe("pro")
    expect(result.preferences.units.weight).toBe("lbs")
    expect(document.cookie).toContain("__session=mock-returning-token-abc")
  })

  // 3. Idempotent profile initialization & missing-profile recovery
  it("recovers missing profile safely for an existing auth user without errors", async () => {
    const mockUser = {
      uid: "google-recovery-user-789",
      email: "lostprofile@gmail.com",
      displayName: "Recovered Athlete",
      photoURL: null,
      getIdToken: vi.fn().mockResolvedValue("mock-recovery-token"),
    }

    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({
      user: mockUser,
    } as any)

    // Profile was deleted or missing in Firestore
    vi.spyOn(authRepository, "getProfile").mockResolvedValueOnce(null)
    vi.spyOn(authRepository, "getPreferences").mockResolvedValueOnce({
      userId: "google-recovery-user-789",
      theme: "dark",
    } as any)

    const createProfileSpy = vi.spyOn(authRepository, "createProfile").mockResolvedValueOnce({
      id: "google-recovery-user-789",
      uid: "google-recovery-user-789",
      email: "lostprofile@gmail.com",
      displayName: "Recovered Athlete",
    } as any)

    const result = await authService.signInWithGoogle()

    expect(createProfileSpy).toHaveBeenCalledWith(
      "google-recovery-user-789",
      "lostprofile@gmail.com",
      "Recovered Athlete",
      undefined
    )
    expect(result.profile.id).toBe("google-recovery-user-789")
  })

  // 4. Graceful handling of preferences permission-denied / missing doc
  it("gracefully falls back to default preferences when Firestore preferences throws permission-denied", async () => {
    const mockUser = {
      uid: "google-fallback-user-111",
      email: "fallback@gmail.com",
      displayName: "Fallback Athlete",
      photoURL: undefined,
      getIdToken: vi.fn().mockResolvedValue("mock-fallback-token"),
    }

    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({
      user: mockUser,
    } as any)

    vi.spyOn(authRepository, "getProfile").mockResolvedValueOnce({
      id: "google-fallback-user-111",
      uid: "google-fallback-user-111",
      email: "fallback@gmail.com",
      displayName: "Fallback Athlete",
    } as any)

    // Simulate preferences collection being restricted or throwing permission-denied
    vi.spyOn(authRepository, "getPreferences").mockResolvedValueOnce(
      getDefaultPreferences("google-fallback-user-111")
    )

    const result = await authService.signInWithGoogle()

    expect(result.preferences).toBeDefined()
    expect(result.preferences.userId).toBe("google-fallback-user-111")
    expect(result.preferences.theme).toBe("dark")
    expect(result.preferences.units.weight).toBe("kg")
  })

  // 5. Existing email/password login remains functional
  it("authenticates via email and password and loads user profile", async () => {
    const mockUser = {
      uid: "email-user-222",
      email: "athlete@onepercent.app",
      getIdToken: vi.fn().mockResolvedValue("mock-email-token"),
    }

    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: mockUser,
    } as any)

    const mockProfile = {
      id: "email-user-222",
      uid: "email-user-222",
      email: "athlete@onepercent.app",
      displayName: "Standard Athlete",
    }
    const mockPrefs = {
      userId: "email-user-222",
      theme: "dark",
    }

    vi.spyOn(authRepository, "getProfile").mockResolvedValueOnce(mockProfile as any)
    vi.spyOn(authRepository, "getPreferences").mockResolvedValueOnce(mockPrefs as any)

    const result = await authService.signIn("athlete@onepercent.app", "SecretPassword123")

    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "athlete@onepercent.app",
      "SecretPassword123"
    )
    expect(document.cookie).toContain("__session=mock-email-token")
    expect(result.profile?.displayName).toBe("Standard Athlete")
  })

  // 6. User closing Google popup (auth/popup-closed-by-user)
  it("handles user closing Google popup (auth/popup-closed-by-user)", async () => {
    const popupClosedError = {
      code: "auth/popup-closed-by-user",
      message: "Firebase: Error (auth/popup-closed-by-user).",
    }
    vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValueOnce(popupClosedError)

    await expect(authService.signInWithGoogle()).rejects.toMatchObject({
      code: "auth/popup-closed-by-user",
    })

    const userMessage = getFirebaseAuthErrorMessage(popupClosedError)
    expect(userMessage).toBe("Authentication window was closed before completing sign-in.")
  })

  // 7. Popup blocked by browser
  it("handles popup blocked by browser (auth/popup-blocked)", async () => {
    const popupBlockedError = {
      code: "auth/popup-blocked",
      message: "Firebase: Error (auth/popup-blocked).",
    }
    vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValueOnce(popupBlockedError)

    await expect(authService.signInWithGoogle()).rejects.toMatchObject({
      code: "auth/popup-blocked",
    })

    const userMessage = getFirebaseAuthErrorMessage(popupBlockedError)
    expect(userMessage).toContain("blocked by your browser")
  })

  // 8. Unauthorized domain error
  it("handles unauthorized domain error (auth/unauthorized-domain)", async () => {
    const unauthorizedDomainError = {
      code: "auth/unauthorized-domain",
      message: "Firebase: Error (auth/unauthorized-domain).",
    }
    vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValueOnce(unauthorizedDomainError)

    await expect(authService.signInWithGoogle()).rejects.toMatchObject({
      code: "auth/unauthorized-domain",
    })

    const userMessage = getFirebaseAuthErrorMessage(unauthorizedDomainError)
    expect(userMessage).toContain("Authorized Domains")
  })

  // 9. Provider disabled in console
  it("handles provider disabled in console (auth/operation-not-allowed)", async () => {
    const opNotAllowedError = {
      code: "auth/operation-not-allowed",
      message: "Firebase: Error (auth/operation-not-allowed).",
    }
    vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValueOnce(opNotAllowedError)

    await expect(authService.signInWithGoogle()).rejects.toMatchObject({
      code: "auth/operation-not-allowed",
    })

    const userMessage = getFirebaseAuthErrorMessage(opNotAllowedError)
    expect(userMessage).toContain("Sign-in method")
  })

  // 10. Account collision
  it("handles account collision (auth/account-exists-with-different-credential)", async () => {
    const accountCollisionError = {
      code: "auth/account-exists-with-different-credential",
      message: "Firebase: Error (auth/account-exists-with-different-credential).",
    }
    vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValueOnce(accountCollisionError)

    await expect(authService.signInWithGoogle()).rejects.toMatchObject({
      code: "auth/account-exists-with-different-credential",
    })

    const userMessage = getFirebaseAuthErrorMessage(accountCollisionError)
    expect(userMessage).toContain("different sign-in method")
  })

  // 11. Appropriate handling of permission-denied error code
  it("maps permission-denied to user-friendly permission error", () => {
    const permissionError = {
      code: "permission-denied",
      message: "Firebase: Missing or insufficient permissions.",
    }
    const msg = getFirebaseAuthErrorMessage(permissionError)
    expect(msg).toBe("Missing or insufficient permissions.")
  })
})
