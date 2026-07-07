/**
 * Firebase Auth Instance
 * Exports a singleton auth instance connected to the Firebase app.
 * Configures emulator connection in development.
 */
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { firebaseApp } from "./app"
import { env } from "@/lib/env"

export const auth = getAuth(firebaseApp)

// ─── Emulator Configuration ────────────────────────────────────────
if (env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR && typeof window !== "undefined") {
  // Only connect emulator in browser context (not SSR)
  // Guard prevents re-connection on HMR
  if (!(auth as unknown as { _isEmulator?: boolean })._isEmulator) {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true })
  }
}
