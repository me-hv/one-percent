/**
 * Firebase Storage Instance
 * Exports a singleton Storage instance for file operations.
 * Used for progress photos, exported data files, etc.
 */
import { getStorage, connectStorageEmulator } from "firebase/storage"
import { firebaseApp } from "./app"
import { env } from "@/lib/env"

export const storage = getStorage(firebaseApp)

// ─── Emulator Configuration ────────────────────────────────────────
if (env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR && typeof window !== "undefined") {
  connectStorageEmulator(storage, "localhost", 9199)
}
