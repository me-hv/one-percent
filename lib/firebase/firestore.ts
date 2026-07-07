/**
 * Cloud Firestore Instance
 *
 * Exports a singleton Firestore instance with offline persistence enabled.
 * Offline persistence uses IndexedDB — works in all modern browsers.
 *
 * Architecture decision: Offline persistence is enabled globally.
 * This means ALL Firestore queries automatically work offline.
 * Write operations are queued and synced on reconnect by the SDK.
 */
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  type Firestore,
} from "firebase/firestore"
import { firebaseApp } from "./app"
import { env } from "@/lib/env"

let firestoreInstance: Firestore | null = null
let persistenceEnabled = false

function getFirestoreInstance(): Firestore {
  if (firestoreInstance) return firestoreInstance

  const db = getFirestore(firebaseApp)

  // ─── Emulator Configuration ────────────────────────────────────
  if (env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR && typeof window !== "undefined") {
    connectFirestoreEmulator(db, "localhost", 8080)
  }

  // ─── Offline Persistence ───────────────────────────────────────
  // Only enable in browser context (not SSR), and only once.
  if (typeof window !== "undefined" && !persistenceEnabled) {
    persistenceEnabled = true
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === "failed-precondition") {
        // Multiple tabs open — persistence available in one tab only.
        // This is expected behavior when multiple tabs are open.
        console.warn(
          "[Firestore] Offline persistence unavailable: multiple tabs open. " +
          "Persistence will be available when only one tab is open.",
        )
      } else if (err.code === "unimplemented") {
        // Browser doesn't support IndexedDB (very rare, old browsers)
        console.warn(
          "[Firestore] Offline persistence unavailable: browser not supported.",
        )
      }
    })
  }

  firestoreInstance = db
  return db
}

export const db = getFirestoreInstance()
