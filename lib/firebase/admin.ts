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
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"

// ─── Guard: Fail loudly if imported client-side ────────────────────
if (typeof window !== "undefined") {
  throw new Error(
    "❌ Firebase Admin SDK was imported in a client-side context. " +
    "This is a critical security error. Only import from API routes and Server Components.",
  )
}

// ─── Initialize Admin App ──────────────────────────────────────────
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error(
      "❌ Firebase Admin credentials are missing. " +
      "Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, and " +
      "FIREBASE_ADMIN_CLIENT_EMAIL environment variables.",
    )
  }

  return initializeApp({
    credential: cert({
      projectId,
      privateKey,
      clientEmail,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}

const adminApp = getAdminApp()

// ─── Exports ───────────────────────────────────────────────────────
export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
export const adminStorage = getStorage(adminApp)

// ─── Helper: Verify ID Token ───────────────────────────────────────
// Use in API route handlers to authenticate requests
export async function verifyIdToken(token: string) {
  return adminAuth.verifyIdToken(token)
}

// ─── Helper: Get session from request headers ──────────────────────
export async function getSessionFromCookie(sessionCookie: string) {
  return adminAuth.verifySessionCookie(sessionCookie, true)
}
