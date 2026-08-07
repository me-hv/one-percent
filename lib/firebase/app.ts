/**
 * Firebase App Singleton
 *
 * Initializes Firebase once using the modular SDK.
 * All feature modules import from this file — never initialize Firebase elsewhere.
 * The compat SDK is explicitly NOT used (tree-shaking requires modular imports).
 */
import { getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { env } from "@/lib/env"

const firebaseConfig = {
  apiKey:            env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// ─── Singleton Pattern ─────────────────────────────────────────────
// getApps() returns existing apps — prevents re-initialization during
// Next.js hot module replacement in development.
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0]!
  }
  const app = initializeApp(firebaseConfig)
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    console.log(`[Firebase] Initialized with Project ID: ${firebaseConfig.projectId}`)
  }
  return app
}

export const firebaseApp = getFirebaseApp()

