import { describe, it, expect, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { authenticateServerRequest, checkRateLimit } from "../server-auth"

describe("server-auth — Server Authentication & Rate Limiting", () => {
  const createMockToken = (userId: string, expOffsetSec: number = 3600): string => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64")
    const payload = Buffer.from(
      JSON.stringify({
        user_id: userId,
        sub: userId,
        exp: Math.floor(Date.now() / 1000) + expOffsetSec,
      })
    ).toString("base64")
    const sig = "mock_signature_bytes"
    return `${header}.${payload}.${sig}`
  }

  it("rejects requests missing session cookie and Authorization header with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
    })

    const result = await authenticateServerRequest(req)
    expect(result.authenticated).toBe(false)
    expect(result.statusCode).toBe(401)
    expect(result.error).toContain("Authentication required")
  })

  it("rejects requests with malformed tokens with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: {
        authorization: "Bearer invalid_token_format",
      },
    })

    const result = await authenticateServerRequest(req)
    expect(result.authenticated).toBe(false)
    expect(result.statusCode).toBe(401)
  })

  it("rejects expired tokens with 401", async () => {
    const expiredToken = createMockToken("user-123", -3600) // Expired 1 hour ago
    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
    })

    const result = await authenticateServerRequest(req)
    expect(result.authenticated).toBe(false)
    expect(result.statusCode).toBe(401)
  })

  it("authenticates requests with a valid Bearer token", async () => {
    const validToken = createMockToken("athlete-999", 3600)
    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    })

    const result = await authenticateServerRequest(req)
    expect(result.authenticated).toBe(true)
    expect(result.userId).toBe("athlete-999")
  })

  it("authenticates requests with a valid __session cookie", async () => {
    const validToken = createMockToken("athlete-cookie-user", 3600)
    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: {
        cookie: `__session=${validToken}`,
      },
    })

    const result = await authenticateServerRequest(req)
    expect(result.authenticated).toBe(true)
    expect(result.userId).toBe("athlete-cookie-user")
  })

  it("enforces sliding-window rate limits (max 20 requests per minute)", () => {
    const client = "test-rate-limit-client"
    
    // First 20 requests should pass
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit(client)).toBe(true)
    }

    // 21st request should be rejected
    expect(checkRateLimit(client)).toBe(false)
  })

  it("rejects tokens missing cryptographic signature segment", async () => {
    // Unsigned token (only 2 parts or empty signature)
    const unsigned = "eyJhbGciOiJub25lIn0.eyJzdWIiOiJhdHRhY2tlciJ9."
    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: {
        authorization: `Bearer ${unsigned}`,
      },
    })

    const result = await authenticateServerRequest(req)
    expect(result.authenticated).toBe(false)
    expect(result.statusCode).toBe(401)
  })

  it("rejects tokens with mismatched audience claim", async () => {
    const originalProj = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "target-app-project"

    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64")
    const payload = Buffer.from(
      JSON.stringify({
        sub: "attacker",
        aud: "attacker-foreign-project",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64")
    const foreignToken = `${header}.${payload}.valid_length_signature_12345`

    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: {
        authorization: `Bearer ${foreignToken}`,
      },
    })

    const result = await authenticateServerRequest(req)
    expect(result.authenticated).toBe(false)
    expect(result.statusCode).toBe(401)

    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = originalProj
  })

  it("supports injecting a cryptographic test verifier to reject forged signatures", async () => {
    const { setTokenVerifierForTesting } = await import("../server-auth")

    // Mock verifier that enforces cryptographic validation
    setTokenVerifierForTesting(async (token: string) => {
      if (token.endsWith("valid_crypto_sig")) {
        return { valid: true, userId: "verified-athlete" }
      }
      return { valid: false, error: "Cryptographic signature mismatch" }
    })

    const forgedReq = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: { authorization: "Bearer token.with.forged_signature" },
    })
    const forgedResult = await authenticateServerRequest(forgedReq)
    expect(forgedResult.authenticated).toBe(false)
    expect(forgedResult.statusCode).toBe(401)
    expect(forgedResult.error).toContain("Cryptographic signature mismatch")

    const validReq = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: { authorization: "Bearer valid.token.valid_crypto_sig" },
    })
    const validResult = await authenticateServerRequest(validReq)
    expect(validResult.authenticated).toBe(true)
    expect(validResult.userId).toBe("verified-athlete")

    // Reset test verifier
    setTokenVerifierForTesting(null)
  })

  it("rejects tokens with future iat timestamp (clock skew > 60s)", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64")
    const payload = Buffer.from(
      JSON.stringify({
        sub: "time-traveler",
        iat: Math.floor(Date.now() / 1000) + 120, // 2 minutes in future
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64")
    const futureToken = `${header}.${payload}.valid_signature_123`

    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: { authorization: `Bearer ${futureToken}` },
    })

    const result = await authenticateServerRequest(req)
    expect(result.authenticated).toBe(false)
    expect(result.statusCode).toBe(401)
  })

  it("rejects tokens with missing sub or uid", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64")
    const payload = Buffer.from(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64")
    const emptySubToken = `${header}.${payload}.valid_signature_123`

    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: { authorization: `Bearer ${emptySubToken}` },
    })

    const result = await authenticateServerRequest(req)
    expect(result.authenticated).toBe(false)
    expect(result.statusCode).toBe(401)
  })
})
