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

const requestTimestamps = new Map<string, number[]>()

/**
 * Checks in-memory rate limit for a client identifier (user ID or IP).
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
  return true
}

/**
 * Parses and verifies basic JWT structure and claims safely without external deps.
 */
function parseAndValidateJwt(token: string): { valid: boolean; userId?: string } {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return { valid: false }

    const payloadBase64 = parts[1]
    if (!payloadBase64) return { valid: false }

    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
    const jsonStr = Buffer.from(normalized, "base64").toString("utf8")
    const payload = JSON.parse(jsonStr)

    const nowSec = Math.floor(Date.now() / 1000)
    // Check expiry if present
    if (payload.exp && typeof payload.exp === "number" && payload.exp < nowSec) {
      return { valid: false } // Expired token
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
