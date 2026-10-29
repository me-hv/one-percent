import { NextRequest, NextResponse } from "next/server"
import { authenticateServerRequest, checkRateLimit } from "@/lib/auth/server-auth"

// 32 KB maximum request payload size
const MAX_PAYLOAD_SIZE = 32 * 1024
const MAX_MESSAGE_LENGTH = 1000

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce content-length limits
    const contentLength = req.headers.get("content-length")
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 })
    }

    // 2. Authenticate request (verifies session cookie or Bearer token)
    const authContext = await authenticateServerRequest(req)
    if (!authContext.authenticated || !authContext.userId) {
      return NextResponse.json(
        { error: authContext.error || "Authentication required" },
        { status: 401 }
      )
    }

    // 3. Enforce rate limiting
    const clientIdentifier = authContext.userId
    if (!checkRateLimit(clientIdentifier)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment before sending more messages." },
        { status: 429 }
      )
    }

    // 4. Validate input payload
    const body = await req.json()
    const { message, contextSummary } = body

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Missing required query" }, { status: 400 })
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message exceeds maximum permitted length of ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 }
      )
    }

    // 5. Check if external LLM is configured
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.includes("xxxxxxxx")) {
      // Clean 404 indicates LLM is not configured, triggering instant client-side deterministic fallback
      return NextResponse.json({ error: "LLM endpoint not configured" }, { status: 404 })
    }

    const systemPrompt = `You are the AI Coach for "One Percent" — a high-performance strength and conditioning operating system.
Philosophy: Small improvements, repeated consistently.
Style: Minimal, professional, data-dense, objective, like Linear/GitHub. No emojis, no fake excitement, no gamification gimmicks.
Context:
Active Program: ${contextSummary?.activeProgramName || "None"}
Completed Sessions: ${contextSummary?.completedSessionsCount || 0}
Readiness Score: ${contextSummary?.latestReadiness || "N/A"}/100

Guidelines:
1. Ground advice strictly in strength training principles (progressive overload, fatigue management, deload weeks, sleep recovery, protein adequacy).
2. Answer the user's specific inquiry directly and concisely.
3. Suggest 2-3 specific follow-up questions.`

    const promptText = `${systemPrompt}\n\nUser Question: ${message.trim()}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
          },
        }),
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({ error: "LLM generation failed" }, { status: 502 })
    }

    const data = await response.json()
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to parse response from coach intelligence."

    return NextResponse.json({
      text: replyText,
      suggestedQuestions: [
        "What should I focus on today?",
        "How is my program consistency?",
        "How did this week compare to last week?",
      ],
      evidence: [],
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error during chat query" }, { status: 500 })
  }
}
