import { describe, it, expect, vi } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "../route"

describe("POST /api/coach/chat — Route Protection & Input Validation", () => {
  const createMockToken = (userId: string): string => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64")
    const payload = Buffer.from(
      JSON.stringify({
        user_id: userId,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64")
    return `${header}.${payload}.sig`
  }

  it("returns 401 Unauthorized when request lacks authentication", async () => {
    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What should I focus on?" }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toContain("Authentication required")
  })

  it("returns 413 Payload Too Large when Content-Length exceeds 32 KB", async () => {
    const validToken = createMockToken("user-1")
    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${validToken}`,
        "content-length": "40000", // > 32KB
      },
      body: JSON.stringify({ message: "Hello" }),
    })

    const res = await POST(req)
    expect(res.status).toBe(413)
  })

  it("returns 400 Bad Request when message is missing or empty", async () => {
    const validToken = createMockToken("user-1")
    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ message: "   " }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("Missing required query")
  })

  it("returns 400 Bad Request when message exceeds 1,000 characters", async () => {
    const validToken = createMockToken("user-1")
    const longMessage = "a".repeat(1001)
    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ message: longMessage }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("exceeds maximum permitted length")
  })

  it("returns 404 when external LLM is not configured (triggering deterministic fallback)", async () => {
    const validToken = createMockToken("user-unconfigured-llm")
    const originalEnv = process.env.GEMINI_API_KEY
    process.env.GEMINI_API_KEY = "AIzaSy-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" // Placeholder

    const req = new NextRequest("http://localhost:3000/api/coach/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ message: "What should I focus on today?" }),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe("LLM endpoint not configured")

    process.env.GEMINI_API_KEY = originalEnv
  })
})
