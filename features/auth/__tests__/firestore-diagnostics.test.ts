import { describe, it, expect } from "vitest"
import { doc, deleteDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth"
import { auth } from "@/lib/firebase/auth"
import { db } from "@/lib/firebase/firestore"
import { authRepository } from "../repositories/auth.repository"

describe("Live Firestore End-to-End Auth & Rules Verification", () => {
  it("successfully creates and reads user profile with resilient preferences on live Firebase", async () => {
    const testEmail = `live-e2e-${Date.now()}@onepercent.app`
    const testPassword = `SecurePass123!${Date.now()}`

    let userCred
    try {
      userCred = await createUserWithEmailAndPassword(auth, testEmail, testPassword)
    } catch (err: any) {
      if (err.code === "auth/network-request-failed") {
        console.warn("Skipping live test: network unreachable")
        return
      }
      throw err
    }

    const uid = userCred.user.uid

    try {
      // 1. Initial getProfile should be null
      const initialProfile = await authRepository.getProfile(uid)
      expect(initialProfile).toBeNull()

      // 2. createProfile writes to users/{uid}
      const created = await authRepository.createProfile(
        uid,
        testEmail,
        "Live Verified Athlete",
        "https://lh3.googleusercontent.com/avatar"
      )
      expect(created.displayName).toBe("Live Verified Athlete")
      expect(created.photoURL).toBe("https://lh3.googleusercontent.com/avatar")

      // 3. getProfile should now return the created profile
      const retrieved = await authRepository.getProfile(uid)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.displayName).toBe("Live Verified Athlete")
      expect(retrieved?.photoURL).toBe("https://lh3.googleusercontent.com/avatar")

      // 4. getPreferences should safely return preferences (from Firestore or default fallback)
      const prefs = await authRepository.getPreferences(uid)
      expect(prefs).not.toBeNull()
      expect(prefs?.userId).toBe(uid)
      expect(prefs?.units.weight).toBe("kg")

      // 5. createPreferences should safely return preferences without crashing
      const createdPrefs = await authRepository.createPreferences(uid)
      expect(createdPrefs.userId).toBe(uid)
      expect(createdPrefs.theme).toBe("dark")
    } finally {
      // Clean up Firestore documents and Auth user
      try {
        await deleteDoc(doc(db, "users", uid))
        await deleteDoc(doc(db, "preferences", uid))
      } catch (e) {}
      try {
        await deleteUser(userCred.user)
      } catch (e) {}
    }
  })
})
