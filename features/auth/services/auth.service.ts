import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  type UserCredential,
} from "firebase/auth"
import { auth } from "@/lib/firebase/auth"
import { authRepository } from "../repositories/auth.repository"
import type { UserProfile, UserPreferences } from "@/lib/types/user.types"

// Helper to set cookie for middleware route protection
function setSessionCookie(token: string) {
  if (typeof document !== "undefined") {
    // Session cookie persists for 7 days
    const maxAge = 7 * 24 * 60 * 60
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:"
    document.cookie = `__session=${token}; path=/; max-age=${maxAge}; SameSite=Lax${isHttps ? "; Secure" : ""}`
  }
}

function clearSessionCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
  }
}

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{
    credential: UserCredential
    profile: UserProfile | null
    preferences: UserPreferences | null
  }> {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const token = await credential.user.getIdToken()
    setSessionCookie(token)

    const [profile, preferences] = await Promise.all([
      authRepository.getProfile(credential.user.uid),
      authRepository.getPreferences(credential.user.uid),
    ])

    return { credential, profile, preferences }
  },

  /**
   * Sign in or register with Google via popup
   */
  async signInWithGoogle(): Promise<{
    credential: UserCredential
    profile: UserProfile
    preferences: UserPreferences
  }> {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    const credential = await signInWithPopup(auth, provider)
    const token = await credential.user.getIdToken()
    setSessionCookie(token)

    const userId = credential.user.uid
    const email = credential.user.email || ""
    const displayName = credential.user.displayName || email.split("@")[0] || "Athlete"
    const photoURL = credential.user.photoURL || undefined

    // 1. Fetch existing profile and preferences safely (resilient to missing docs)
    let profile: UserProfile | null = null
    let preferences: UserPreferences | null = null

    try {
      profile = await authRepository.getProfile(userId)
    } catch (err: any) {
      console.warn("[authService] Could not load profile:", err?.message || err)
    }

    try {
      preferences = await authRepository.getPreferences(userId)
    } catch (err: any) {
      console.warn("[authService] Could not load preferences:", err?.message || err)
    }

    // 2. First-time user: create profile idempotently with photoURL in a single write
    if (!profile) {
      profile = await authRepository.createProfile(userId, email, displayName, photoURL)
    } else if (photoURL && !profile.photoURL) {
      // Returning user: sync photoURL if missing
      try {
        await authRepository.updateProfile(userId, { photoURL })
        profile.photoURL = photoURL
      } catch (err: any) {
        console.warn("[authService] Failed to sync photoURL:", err?.message || err)
      }
    }

    // 3. Ensure preferences exist
    if (!preferences) {
      preferences = await authRepository.createPreferences(userId)
    }

    return { credential, profile, preferences }
  },

  /**
   * Register a new account
   */
  async signUp(email: string, password: string, displayName: string): Promise<{
    credential: UserCredential
    profile: UserProfile
    preferences: UserPreferences
  }> {
    const credential = await createUserWithEmailAndPassword(auth, email, password)

    // Set profile name in Firebase Auth
    await firebaseUpdateProfile(credential.user, { displayName })

    const token = await credential.user.getIdToken()
    setSessionCookie(token)

    // Setup DB records
    const [profile, preferences] = await Promise.all([
      authRepository.createProfile(credential.user.uid, email, displayName),
      authRepository.createPreferences(credential.user.uid),
    ])

    return { credential, profile, preferences }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth)
    clearSessionCookie()
  },
}
