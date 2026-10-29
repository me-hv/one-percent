"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Trash2, HelpCircle, Sparkles } from "lucide-react"
import { useCoachStore } from "../store/coach.store"
import { resolveCoachChatQuery } from "../services/coach-chat.service"
import type { SupportingEvidence, CoachChatMessage } from "../types/coach.types"
import { EvidenceModal } from "./EvidenceModal"
import { useProgramsStore } from "@/features/training/store/programs.store"
import { useRecoveryStore } from "@/features/recovery/store/recovery.store"
import { useNutritionStore } from "@/features/nutrition/store/nutrition.store"
import { useGoalsStore } from "@/features/goals/store/goals.store"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { useAuthStore } from "@/lib/store/auth.store"
import { calculateReadinessScore } from "@/features/recovery/services/readiness.service"
import { DEFAULT_RECOVERY_CONFIG } from "@/features/recovery/repository/recovery.repository"
import { cn } from "@/lib/utils/cn"

const SUGGESTED_PROMPTS = [
  "What should I focus on today?",
  "How is my program consistency?",
  "How did this week compare to last week?",
  "Why am I stalling on my bench press?",
  "What should I review before increasing a lift?",
]

export function CoachChatView() {
  const { user } = useAuthStore()
  const { chatMessages, addChatMessage, clearChat } = useCoachStore()
  const { programs } = useProgramsStore()
  const { entries: recoveryEntries } = useRecoveryStore()
  const { dailyLogs: nutritionLogs, targets: nutritionTargets } = useNutritionStore()
  const { goals } = useGoalsStore()
  const { data: sessions = [] } = useWorkoutHistory(user?.uid || "")

  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [evidenceModalData, setEvidenceModalData] = useState<{
    isOpen: boolean
    title: string
    evidence: SupportingEvidence[]
  }>({
    isOpen: false,
    title: "",
    evidence: [],
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeProgram = programs.find((p) => p.isActive && !p.isArchived) || null

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim()
    if (!trimmed || isSending) return

    const userMsg: CoachChatMessage = {
      id: `msg-usr-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
      source: "deterministic",
    }
    addChatMessage(userMsg)
    setInput("")
    setIsSending(true)

    try {
      const coachInput = {
        userId: user?.uid || "",
        sessions,
        activeProgram,
        recoveryEntries,
        nutritionLogs,
        nutritionTargets,
        goals,
      }

      // First attempt server-side LLM if configured; fallback directly to deterministic engine
      let reply: CoachChatMessage | null = null

      try {
        const res = await fetch("/api/coach/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: chatMessages.slice(-6),
            contextSummary: {
              activeProgramName: activeProgram?.name,
              completedSessionsCount: sessions.filter((s) => s.status === "completed").length,
              latestReadiness: recoveryEntries[0]
                ? calculateReadinessScore(recoveryEntries[0], DEFAULT_RECOVERY_CONFIG).score ?? 80
                : undefined,
            },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data && data.text) {
            reply = {
              id: `msg-coach-${Date.now()}`,
              sender: "coach",
              text: data.text,
              timestamp: new Date().toISOString(),
              source: "llm_enhanced",
              suggestedQuestions: data.suggestedQuestions,
              evidence: data.evidence,
            }
          }
        }
      } catch {
        // Fallback silently to deterministic query resolver
      }

      // If no server LLM reply, resolve deterministically
      if (!reply) {
        reply = resolveCoachChatQuery(trimmed, coachInput)
      }

      addChatMessage(reply)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[650px] rounded-xl border border-border-subtle bg-bg-surface overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-bg-base/50">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary flex items-center gap-1.5">
              <span>Coaching Conversation</span>
              <span className="text-[10px] font-mono text-accent uppercase tracking-wider bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                Data-Grounded
              </span>
            </h3>
            <p className="text-[11px] text-text-placeholder">
              Strictly grounded in your training, recovery, and nutrition logs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearChat}
          title="Clear Conversation"
          aria-label="Clear chat"
          className="p-1.5 text-text-placeholder hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg) => {
          const isUser = msg.sender === "user"

          return (
            <div
              key={msg.id}
              className={cn("flex items-start gap-3 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs",
                  isUser
                    ? "bg-accent text-bg-base font-bold"
                    : "bg-bg-base border border-border-subtle text-accent"
                )}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              {/* Message Content */}
              <div
                className={cn(
                  "rounded-xl p-4 text-xs leading-relaxed space-y-2.5",
                  isUser
                    ? "bg-accent text-bg-base font-medium shadow-sm"
                    : "bg-bg-base border border-border-subtle text-primary shadow-sm"
                )}
              >
                {/* Body Markdown formatted text */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Evidence trigger */}
                {msg.evidence && msg.evidence.length > 0 && (
                  <div className="pt-2 border-t border-border-subtle/50">
                    <button
                      type="button"
                      onClick={() =>
                        setEvidenceModalData({
                          isOpen: true,
                          title: "Grounding Evidence",
                          evidence: msg.evidence || [],
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-accent hover:text-accent/80 transition-colors"
                    >
                      <HelpCircle className="h-3 w-3" />
                      <span>Verifiable Evidence ({msg.evidence.length} signals)</span>
                    </button>
                  </div>
                )}

                {/* Suggested follow-up prompt chips */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="pt-2 border-t border-border-subtle/50 space-y-1.5">
                    <span className="text-[10px] font-mono text-text-placeholder uppercase tracking-wider block">
                      Suggested Inquiries
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(q)}
                          className="text-[11px] px-2 py-1 rounded bg-bg-surface border border-border-subtle hover:border-accent/40 text-text-secondary hover:text-primary transition-colors text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Meta */}
                <div className="flex items-center justify-between text-[10px] text-text-placeholder pt-1 opacity-70">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {!isUser && (
                    <span className="font-mono">
                      {msg.source === "llm_enhanced" ? "⚡ AI Enhanced" : "⚙ Deterministic"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-border-subtle/60 bg-bg-base/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <Sparkles className="h-3.5 w-3.5 text-accent shrink-0 ml-1" />
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={isSending}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-bg-surface border border-border-subtle hover:border-accent/40 text-text-secondary hover:text-primary transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage(input)
        }}
        className="p-3 border-t border-border-subtle bg-bg-base/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach anything about your training, recovery, or targets..."
          disabled={isSending}
          className="flex-1 bg-bg-surface border border-border-subtle rounded-lg px-3.5 py-2 text-xs text-primary placeholder:text-text-placeholder focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="p-2 rounded-lg bg-accent text-bg-base hover:bg-accent/90 transition-colors disabled:opacity-40 shrink-0"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={evidenceModalData.isOpen}
        onClose={() => setEvidenceModalData({ ...evidenceModalData, isOpen: false })}
        title={evidenceModalData.title}
        evidence={evidenceModalData.evidence}
      />
    </div>
  )
}
