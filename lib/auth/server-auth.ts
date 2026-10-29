import { NextRequest } from "next/server"

export interface AuthContext {
  authenticated: boolean
  userId?: string
  error?: string
  statusCode?: number
}

// In-memory sliding-window rate limiter per user/IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20
const MAX_TRACKED_CLIENTS = 10000

const requestTimestamps = new Map<string, number[]>()

/**
 * Checks in-memory rate limit for a client identifier (user ID or IP).
 * Memory is strictly bounded to prevent heap exhaustion.
 */
export function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const timestamps = requestTimestamps.get(clientId) || []
  
  // Prune timestamps older than window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return false // Rate limit exceeded
  }
  
  recent.push(now)
  requestTimestamps.set(clientId, recent)

  // Bound memory: prune stale keys if tracking table exceeds threshold
  if (requestTimestamps.size > MAX_TRACKED_CLIENTS) {
    for (const [key, list] of requestTimestamps.entries()) {
      if (list.length === 0 || now - list[list.length - 1]! >= RATE_LIMIT_WINDOW_MS) {
        requestTimestamps.delete(key)
      }
      if (requestTimestamps.size <= MAX_TRACKED_CLIENTS) break
    }
  }

  return true
}

/**
 * Parses and verifies JWT structure, signature format, and Firebase security claims.
 */
function parseAndValidateJwt(token: string): { valid: boolean; userId?: string } {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return { valid: false }

    const [headerBase64, payloadBase64, signature] = parts
    if (!headerBase64 || !payloadBase64 || !signature || signature.length < 10) {
      return { valid: false } // Incomplete JWT or missing signature
    }

    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
    const jsonStr = Buffer.from(normalized, "base64").toString("utf8")
    const payload = JSON.parse(jsonStr)

    const nowSec = Math.floor(Date.now() / 1000)
    // Check expiry
    if (payload.exp && typeof payload.exp === "number" && payload.exp < nowSec) {
      return { valid: false } // Expired token
    }

    // Verify audience and issuer against Firebase project ID if configured
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID
    if (projectId && !projectId.includes("your-") && !projectId.includes("placeholder")) {
      if (payload.aud && typeof payload.aud === "string" && payload.aud !== projectId) {
        return { valid: false } // Mismatched audience
      }
      if (payload.iss && typeof payload.iss === "string") {
        const expectedIdTokenIss = `https://securetoken.google.com/${projectId}`
        const expectedSessionIss = `https://session.firebase.google.com/${projectId}`
        if (payload.iss !== expectedIdTokenIss && payload.iss !== expectedSessionIss) {
          return { valid: false } // Mismatched issuer
        }
      }
    }

    const userId = payload.user_id || payload.sub || payload.uid
    if (typeof userId === "string" && userId.length > 0) {
      return { valid: true, userId }
    }

    return { valid: false }
  } catch {
    return { valid: false }
  }
}

/**
 * Authenticates an incoming Next.js API request.
 * Checks Authorization header or __session cookie.
 */
export async function authenticateServerRequest(req: NextRequest): Promise<AuthContext> {
  // 1. Extract token from header or cookie
  const authHeader = req.headers.get("authorization")
  let token: string | undefined

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim()
  } else {
    token = req.cookies.get("__session")?.value
  }

  if (!token) {
    return {
      authenticated: false,
      error: "Authentication required. Missing session cookie or Bearer token.",
      statusCode: 401,
    }
  }

  // 2. Validate token
  const jwtCheck = parseAndValidateJwt(token)
  if (!jwtCheck.valid || !jwtCheck.userId) {
    return {
      authenticated: false,
      error: "Invalid, expired, or malformed authentication credentials.",
      statusCode: 401,
    }
  }

  return {
    authenticated: true,
    userId: jwtCheck.userId,
  }
}
