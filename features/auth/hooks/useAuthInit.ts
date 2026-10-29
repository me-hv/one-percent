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

            let profileData: UserProfile | null = null
            let prefsData: UserPreferences | null = null

            try {
              const profileSnap = await getDoc(profileRef)
              if (profileSnap.exists()) {
                profileData = profileSnap.data() as UserProfile
              }
            } catch (pErr: any) {
              console.warn("[useAuthInit] Failed to fetch user profile doc:", pErr?.message || pErr)
            }

            try {
              const prefsSnap = await getDoc(prefsRef)
              if (prefsSnap.exists()) {
                prefsData = prefsSnap.data() as UserPreferences
              }
            } catch (prErr: any) {
              console.warn("[useAuthInit] Failed to fetch user preferences doc:", prErr?.message || prErr)
            }

            setProfile(profileData)
            setPreferences(prefsData)
          } else {
            setUser(null)
            setProfile(null)
            setPreferences(null)
            if (typeof document !== "undefined") {
              document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax"
            }
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
