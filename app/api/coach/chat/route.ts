import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, history, contextSummary } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing required query" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.includes("xxxxxxxx")) {
      // No valid server-side LLM configured; return 404 so client cleanly falls back to deterministic engine
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

    const promptText = `${systemPrompt}\n\nUser Question: ${message}`

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
