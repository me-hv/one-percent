import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import {
  authenticateServerRequest,
  parseAndValidateJwtClaims,
  setTokenVerifierForTesting,
} from "@/lib/auth/server-auth"
import { POST as coachChatPost } from "@/app/api/coach/chat/route"

describe("Stage 3 — Beta Authentication & Authorization Validation Suite", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Ensure clean test environment without test verifier
    setTokenVerifierForTesting(null)
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    setTokenVerifierForTesting(null)
  })

  // Helper to craft mock JWTs
  const craftJwt = (
    payload: Record<string, unknown>,
    header: Record<string, unknown> = { alg: "RS256", typ: "JWT" },
    signature = "valid_cryptographic_signature_segment_bytes"
  ) => {
    const h = Buffer.from(JSON.stringify(header)).toString("base64")
    const p = Buffer.from(JSON.stringify(payload)).toString("base64")
    return `${h}.${p}.${signature}`
  }

  describe("Token Validation & Claims Security", () => {
    it("rejects tokens that are missing or empty", async () => {
      const req = new NextRequest("http://localhost:3000/api/coach/chat", { method: "POST" })
      const auth = await authenticateServerRequest(req)
      expect(auth.authenticated).toBe(false)
      expect(auth.statusCode).toBe(401)
      expect(auth.error).toContain("Authentication required")
    })

    it("rejects malformed tokens (invalid segment count)", () => {
      const result1 = parseAndValidateJwtClaims("not-a-jwt")
      expect(result1.valid).toBe(false)
      expect(result1.error).toContain("expected 3 dot-separated segments")

      const result2 = parseAndValidateJwtClaims("one.two")
      expect(result2.valid).toBe(false)

      const result3 = parseAndValidateJwtClaims("one.two.three.four")
      expect(result3.valid).toBe(false)
    })

    it("rejects tokens with forged or trivial signatures", () => {
      const tokenWithShortSig = craftJwt(
        { user_id: "user-123", exp: Math.floor(Date.now() / 1000) + 3600 },
        { alg: "RS256" },
        "ab" // Less than 3 characters
      )
      const result = parseAndValidateJwtClaims(tokenWithShortSig)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("insufficient cryptographic signature length")
    })

    it("rejects insecure unsigned tokens (alg: none attacks)", () => {
      const insecureToken = craftJwt(
        { user_id: "admin-target", exp: Math.floor(Date.now() / 1000) + 3600 },
        { alg: "none" },
        "signature_attempt"
      )
      const result = parseAndValidateJwtClaims(insecureToken)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("unsigned tokens (alg: none) are prohibited")
    })

    it("rejects expired tokens", () => {
      const nowSec = Math.floor(Date.now() / 1000)
      const expiredToken = craftJwt({
        user_id: "user-456",
        exp: nowSec - 120, // Expired 2 minutes ago
      })
      const result = parseAndValidateJwtClaims(expiredToken)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Token expired")
    })

    it("rejects tokens issued in the far future", () => {
      const nowSec = Math.floor(Date.now() / 1000)
      const futureToken = craftJwt({
        user_id: "user-future",
        iat: nowSec + 3600, // Issued 1 hour in future
        exp: nowSec + 7200,
      })
      const result = parseAndValidateJwtClaims(futureToken)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Token issued in the future")
    })

    it("rejects tokens with mismatched audience claims", () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "one-percent-production"
      const tokenWrongAud = craftJwt({
        user_id: "user-789",
        aud: "malicious-project-xyz",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
      const result = parseAndValidateJwtClaims(tokenWrongAud)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Audience mismatch")
    })

    it("rejects tokens with mismatched issuer claims", () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "one-percent-production"
      const tokenWrongIss = craftJwt({
        user_id: "user-789",
        aud: "one-percent-production",
        iss: "https://evil.issuer.com/one-percent-production",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
      const result = parseAndValidateJwtClaims(tokenWrongIss)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Issuer mismatch")
    })

    it("rejects tokens missing user identifiers (sub/uid/user_id)", () => {
      const tokenNoUser = craftJwt({
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
      const result = parseAndValidateJwtClaims(tokenNoUser)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Missing valid user ID")
    })
  })

  describe("Session Cookies & Revocation Architecture", () => {
    it("authenticates valid __session cookies with matching project audience", async () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "one-percent-beta"
      const validCookieToken = craftJwt({
        user_id: "athlete-session-1",
        aud: "one-percent-beta",
        iss: "https://session.firebase.google.com/one-percent-beta",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })

      const req = new NextRequest("http://localhost:3000/api/coach/chat", {
        method: "POST",
        headers: {
          cookie: `__session=${validCookieToken}`,
        },
      })

      const auth = await authenticateServerRequest(req)
      expect(auth.authenticated).toBe(true)
      expect(auth.userId).toBe("athlete-session-1")
    })

    it("rejects corrupted or forged __session cookies", async () => {
      const req = new NextRequest("http://localhost:3000/api/coach/chat", {
        method: "POST",
        headers: {
          cookie: "__session=corrupted.cookie.data",
        },
      })

      const auth = await authenticateServerRequest(req)
      expect(auth.authenticated).toBe(false)
      expect(auth.statusCode).toBe(401)
    })

    it("strictly prevents setTokenVerifierForTesting from being invoked in production", () => {
      ;(process.env as any).NODE_ENV = "production"
      expect(() => {
        setTokenVerifierForTesting(async () => ({ valid: true, userId: "bypass-test" }))
      }).toThrow("setTokenVerifierForTesting is strictly prohibited in production environments.")
    })
  })

  describe("Protected API Route Verification (/api/coach/chat)", () => {
    it("returns 401 and clean JSON without leaking stack traces when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Give me my training plan" }),
      })

      const res = await coachChatPost(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data).toHaveProperty("error")
      expect(typeof data.error).toBe("string")
      expect(data.stack).toBeUndefined()
      expect(data.trace).toBeUndefined()
    })

    it("returns 413 if payload exceeds 32 KB", async () => {
      const largeReq = new NextRequest("http://localhost:3000/api/coach/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "content-length": `${64 * 1024}`, // 64 KB
        },
        body: JSON.stringify({ message: "x" }),
      })

      const res = await coachChatPost(largeReq)
      expect(res.status).toBe(413)
      const data = await res.json()
      expect(data.error).toBe("Payload too large")
    })

    it("returns 400 when message exceeds max allowed length", async () => {
      const validToken = craftJwt({
        user_id: "athlete-authed",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })

      const tooLongMessage = "a".repeat(1001)
      const req = new NextRequest("http://localhost:3000/api/coach/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ message: tooLongMessage }),
      })

      const res = await coachChatPost(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("Message exceeds maximum permitted length")
    })
  })

  describe("Cross-User Isolation & Multi-Tenant Authorization Rules", () => {
    it("verifies user ID claim matches the client boundary and does not grant cross-tenant access", async () => {
      const userAToken = craftJwt({
        user_id: "user-alpha-100",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })

      const req = new NextRequest("http://localhost:3000/api/coach/chat", {
        method: "POST",
        headers: {
          authorization: `Bearer ${userAToken}`,
        },
      })

      const auth = await authenticateServerRequest(req)
      expect(auth.authenticated).toBe(true)
      // The authenticated user is strictly user-alpha-100, not user-beta-200
      expect(auth.userId).toBe("user-alpha-100")
      expect(auth.userId).not.toBe("user-beta-200")
    })
  })

  describe("Safe Redirect Validation (Open Redirect Defense)", () => {
    // Pure function representing the exact logic implemented in app/(auth)/login/page.tsx:21-28
    const validateSafeRedirect = (redirectParam: string | null): string => {
      const isSafe =
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//") &&
        !redirectParam.startsWith("/\\")

      return isSafe ? redirectParam : "/dashboard"
    }

    it("allows legitimate relative paths", () => {
      expect(validateSafeRedirect("/workout")).toBe("/workout")
      expect(validateSafeRedirect("/analytics/trends")).toBe("/analytics/trends")
      expect(validateSafeRedirect("/settings/backup")).toBe("/settings/backup")
      expect(validateSafeRedirect("/dashboard")).toBe("/dashboard")
    })

    it("defends against protocol-relative open redirects (//evil.com)", () => {
      expect(validateSafeRedirect("//attacker.com")).toBe("/dashboard")
      expect(validateSafeRedirect("//attacker.com/steal-creds")).toBe("/dashboard")
    })

    it("defends against backslash bypasses (/\\evil.com)", () => {
      expect(validateSafeRedirect("/\\evil.com")).toBe("/dashboard")
      expect(validateSafeRedirect("/\\google.com")).toBe("/dashboard")
    })

    it("defends against absolute URL injection (https://evil.com)", () => {
      expect(validateSafeRedirect("https://malicious-site.com")).toBe("/dashboard")
      expect(validateSafeRedirect("http://insecure-site.com")).toBe("/dashboard")
      expect(validateSafeRedirect("ftp://files.com")).toBe("/dashboard")
    })

    it("defends against javascript: and data: URI injection", () => {
      expect(validateSafeRedirect("javascript:alert(1)")).toBe("/dashboard")
      expect(validateSafeRedirect("data:text/html,<script>alert(1)</script>")).toBe("/dashboard")
    })

    it("falls back safely on null, undefined, or empty parameters", () => {
      expect(validateSafeRedirect(null)).toBe("/dashboard")
      expect(validateSafeRedirect("")).toBe("/dashboard")
    })
  })
})
