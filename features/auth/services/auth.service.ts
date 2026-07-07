import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
    document.cookie = `__session=${token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`
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
