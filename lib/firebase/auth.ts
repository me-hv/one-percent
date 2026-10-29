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
    const rawHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099"
    const hostWithProtocol = rawHost.startsWith("http") ? rawHost : `http://${rawHost}`
    connectAuthEmulator(auth, hostWithProtocol, { disableWarnings: true })
    if (process.env.NODE_ENV === "development") {
      console.info(`[Firebase Auth] Connected to local emulator at ${hostWithProtocol}`)
    }
  }
}
