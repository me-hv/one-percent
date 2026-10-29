/**
 * Firebase Admin SDK — SERVER ONLY
 *
 * ⚠️  NEVER import this file in client components or client-side code.
 * ⚠️  This file must only be used in:
 *       - app/api/** route handlers
 *       - Server Components (async RSC)
 *       - Server Actions
 *
 * The Admin SDK has full database access and bypasses security rules.
 * It is initialized with service account credentials (server secrets).
 */
import { cert, getApps, initializeApp, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"
import { getFirestore, type Firestore } from "firebase-admin/firestore"
import { getStorage, type Storage } from "firebase-admin/storage"

// ─── Guard: Fail loudly if imported client-side ────────────────────
if (typeof window !== "undefined") {
  throw new Error(
    "❌ Firebase Admin SDK was imported in a client-side context. " +
    "This is a critical security error. Only import from API routes and Server Components.",
  )
}

// ─── Safe Status Helper ───────────────────────────────────────────
export function isFirebaseAdminConfigured(): boolean {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

  if (!projectId || !privateKey || !clientEmail) return false
  if (projectId.includes("placeholder") || projectId.includes("dummy") || projectId.includes("your-")) return false
  if (
    privateKey.includes("placeholder") ||
    privateKey.includes("dummy") ||
    privateKey.includes("your-") ||
    privateKey.length < 100
  ) {
    return false
  }

  return getAdminAuth() !== null
}

// ─── Initialize Admin App (Lazy & Resilient) ───────────────────────
function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0]!
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

  if (!projectId || !privateKey || !clientEmail) {
    return null
  }

  try {
    return initializeApp({
      credential: cert({
        projectId,
        privateKey,
        clientEmail,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  } catch (err) {
    console.warn("[Firebase Admin] Initialization failed:", err)
    return null
  }
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp()
  return app ? getAuth(app) : null
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp()
  return app ? getFirestore(app) : null
}

export function getAdminStorage(): Storage | null {
  const app = getAdminApp()
  return app ? getStorage(app) : null
}

// ─── Exports with Proxy Fallbacks ──────────────────────────────────
export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    const authInstance = getAdminAuth()
    if (!authInstance) {
      throw new Error(
        "❌ Firebase Admin credentials are not configured. " +
        "Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, and " +
        "FIREBASE_ADMIN_CLIENT_EMAIL environment variables."
      )
    }
    return (authInstance as any)[prop]
  },
})

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    const dbInstance = getAdminDb()
    if (!dbInstance) {
      throw new Error(
        "❌ Firebase Admin credentials are not configured. " +
        "Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, and " +
        "FIREBASE_ADMIN_CLIENT_EMAIL environment variables."
      )
    }
    return (dbInstance as any)[prop]
  },
})

export const adminStorage = new Proxy({} as Storage, {
  get(_target, prop) {
    const storageInstance = getAdminStorage()
    if (!storageInstance) {
      throw new Error(
        "❌ Firebase Admin credentials are not configured. " +
        "Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, and " +
        "FIREBASE_ADMIN_CLIENT_EMAIL environment variables."
      )
    }
    return (storageInstance as any)[prop]
  },
})

// ─── Helper: Verify ID Token ───────────────────────────────────────
// Cryptographically verifies ID token signature, issuer, audience, and expiration.
// Optional checkRevoked parameter queries Firebase backend to ensure token has not been revoked.
export async function verifyIdToken(token: string, checkRevoked = false) {
  const authInstance = getAdminAuth()
  if (!authInstance) {
    throw new Error("Firebase Admin credentials are not configured.")
  }
  return authInstance.verifyIdToken(token, checkRevoked)
}

// ─── Helper: Get session from request headers ──────────────────────
export async function getSessionFromCookie(sessionCookie: string, checkRevoked = false) {
  const authInstance = getAdminAuth()
  if (!authInstance) {
    throw new Error("Firebase Admin credentials are not configured.")
  }
  return authInstance.verifySessionCookie(sessionCookie, checkRevoked)
}
