"use client"

import { useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase/auth"
import { db } from "@/lib/firebase/firestore"
import { useAuthStore } from "@/lib/store/auth.store"
import type { UserProfile, UserPreferences } from "@/lib/types/user.types"

export function useAuthInit() {
  const { setUser, setProfile, setPreferences, setInitialized, setLoading, setError } =
    useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          if (user) {
            setUser(user)

            // Refresh session cookie for middleware
            const token = await user.getIdToken()
            const isHttps = typeof window !== "undefined" && window.location.protocol === "https:"
            document.cookie = `__session=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${isHttps ? "; Secure" : ""}`

            // ─── Fetch Profile and Preferences from Firestore ──────────────
            const profileRef = doc(db, "users", user.uid)
            const prefsRef = doc(db, "preferences", user.uid)

            const [profileSnap, prefsSnap] = await Promise.all([
              getDoc(profileRef),
              getDoc(prefsRef),
            ])

            if (profileSnap.exists()) {
              setProfile(profileSnap.data() as UserProfile)
            } else {
              setProfile(null)
            }

            if (prefsSnap.exists()) {
              setPreferences(prefsSnap.data() as UserPreferences)
            } else {
              setPreferences(null)
            }
          } else {
            setUser(null)
            setProfile(null)
            setPreferences(null)
          }
        } catch (error: any) {
          console.error("[useAuthInit] Error loading auth details:", error)
          setError(error.message || "Failed to sync user profile")
        } finally {
          setLoading(false)
          setInitialized(true)
        }
      },
      (error) => {
        console.error("[useAuthInit] Auth state observer error:", error)
        setError(error.message)
        setLoading(false)
        setInitialized(true)
      },
    )

    return () => unsubscribe()
  }, [setUser, setProfile, setPreferences, setInitialized, setLoading, setError])
}
export default useAuthInit
