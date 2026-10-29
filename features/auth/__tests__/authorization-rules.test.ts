import { describe, it, expect } from "vitest"
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword, deleteUser, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase/auth"
import { db } from "@/lib/firebase/firestore"

describe("Firestore Security Rules & User Data Isolation", () => {
  it("denies access when user A attempts to read or write user B's data", async () => {
    const userAEmail = `athlete-a-${Date.now()}@onepercent.app`
    const userBEmail = `athlete-b-${Date.now()}@onepercent.app`
    const password = `SecurePass123!${Date.now()}`

    let userACred
    try {
      userACred = await createUserWithEmailAndPassword(auth, userAEmail, password)
    } catch (err: any) {
      if (err.code === "auth/network-request-failed") {
        console.warn("Skipping live security test: network unreachable")
        return
      }
      throw err
    }

    const uidA = userACred.user.uid
    const fakeUidB = `target-victim-athlete-${Date.now()}`

    try {
      // 1. User A writing to their own record is ALLOWED
      const userAOwnDoc = doc(db, "users", uidA)
      await setDoc(userAOwnDoc, { email: userAEmail, role: "athlete", userId: uidA }, { merge: true })
      const ownSnap = await getDoc(userAOwnDoc)
      expect(ownSnap.exists()).toBe(true)

      // 2. User A writing to User B's profile document MUST BE DENIED
      const userBDoc = doc(db, "users", fakeUidB)
      let writeDenied = false
      try {
        await setDoc(userBDoc, { email: "malicious@override.com", userId: fakeUidB })
      } catch (err: any) {
        if (err.code === "permission-denied" || err.message?.includes("PERMISSION_DENIED")) {
          writeDenied = true
        }
      }
      expect(writeDenied).toBe(true)

      // 3. User A writing to User B's subcollection (sessions/proposals) MUST BE DENIED
      const userBSubDoc = doc(db, "users", fakeUidB, "proposals", "prop-hacked-1")
      let subWriteDenied = false
      try {
        await setDoc(userBSubDoc, { status: "accepted", proposedWeight: 999 })
      } catch (err: any) {
        if (err.code === "permission-denied" || err.message?.includes("PERMISSION_DENIED")) {
          subWriteDenied = true
        }
      }
      expect(subWriteDenied).toBe(true)

      // 4. User A reading User B's private documents MUST BE DENIED
      let readDenied = false
      try {
        await getDoc(userBDoc)
      } catch (err: any) {
        if (err.code === "permission-denied" || err.message?.includes("PERMISSION_DENIED")) {
          readDenied = true
        }
      }
      expect(readDenied).toBe(true)
    } finally {
      // Clean up User A
      try {
        await deleteDoc(doc(db, "users", uidA))
        await deleteUser(userACred.user)
      } catch {
        // Ignore cleanup errors
      }
    }
  })
})
