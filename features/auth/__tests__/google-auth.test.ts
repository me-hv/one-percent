import { describe, it, expect, vi, beforeEach } from "vitest"
import { authService } from "../services/auth.service"
import { authRepository } from "../repositories/auth.repository"
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
    GoogleAuthProvider: MockGoogleAuthProvider,
  }
})

describe("Google Authentication Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock document.cookie in test environment
    if (typeof document === "undefined") {
      (global as any).document = { cookie: "" }
    } else {
      document.cookie = ""
    }
  })

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
    } as any)
    const updateProfileSpy = vi.spyOn(authRepository, "updateProfile").mockResolvedValueOnce(undefined)
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
      "New Athlete"
    )
    expect(updateProfileSpy).toHaveBeenCalledWith("google-new-user-123", {
      photoURL: "https://lh3.googleusercontent.com/a/avatar123",
    })
    expect(createPrefsSpy).toHaveBeenCalledWith("google-new-user-123")

    expect(result.credential.user.uid).toBe("google-new-user-123")
    expect(result.profile.displayName).toBe("New Athlete")
    expect(result.profile.photoURL).toBe("https://lh3.googleusercontent.com/a/avatar123")
  })

  it("handles returning Google user without creating duplicate profile", async () => {
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
    }
    const existingPrefs = {
      userId: "google-returning-user-456",
      theme: "dark",
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
    expect(document.cookie).toContain("__session=mock-returning-token-abc")
  })

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
})
