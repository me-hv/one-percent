import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type {
  CoachingRecommendation,
  AdaptiveProposal,
  AdaptiveProposalStatus,
  WeeklyCoachingReview,
  CoachChatMessage,
  CoachAuditEvent,
} from "../types/coach.types"
import { STORE_PERSIST_KEYS, CURRENT_SCHEMA_VERSION } from "@/lib/constants/VERSION"

interface CoachState {
  recommendations: CoachingRecommendation[]
  proposals: AdaptiveProposal[]
  weeklyReviews: WeeklyCoachingReview[]
  chatMessages: CoachChatMessage[]
  dismissedRecommendationIds: string[]
  completedRecommendationIds: string[]
  auditEvents: CoachAuditEvent[]

  // Recommendation Actions
  setRecommendations: (recs: CoachingRecommendation[]) => void
  dismissRecommendation: (id: string) => void
  completeRecommendation: (id: string) => void
  setFeedback: (id: string, feedback: "helpful" | "not_helpful" | "inaccurate") => void

  // Proposal Actions
  addProposal: (proposal: AdaptiveProposal) => void
  updateProposalStatus: (id: string, status: AdaptiveProposalStatus) => void
  getProposalById: (id: string) => AdaptiveProposal | undefined

  // Review Actions
  saveWeeklyReview: (review: WeeklyCoachingReview) => void

  // Chat Actions
  addChatMessage: (message: CoachChatMessage) => void
  clearChat: () => void

  // Reset
  resetCoachStore: () => void
}

const INITIAL_GREETING: CoachChatMessage = {
  id: "msg-init-0",
  sender: "coach",
  text: "Welcome to your AI Coach. I analyze your completed workouts, daily recovery readiness, and nutrition logs to guide progressive overload and injury prevention. How can I help you today?",
  timestamp: new Date().toISOString(),
  suggestedQuestions: [
    "What should I focus on today?",
    "How is my program consistency?",
    "How did this week compare to last week?",
    "What should I review before increasing a lift?",
  ],
  source: "deterministic",
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set, get) => ({
      recommendations: [],
      proposals: [],
      weeklyReviews: [],
      chatMessages: [INITIAL_GREETING],
      dismissedRecommendationIds: [],
      completedRecommendationIds: [],
      auditEvents: [],

      setRecommendations: (recs) => {
        set({ recommendations: recs })
      },

      dismissRecommendation: (id) => {
        const { dismissedRecommendationIds, auditEvents } = get()
        set({
          dismissedRecommendationIds: Array.from(new Set([...dismissedRecommendationIds, id])),
          recommendations: get().recommendations.filter((r) => r.id !== id),
          auditEvents: [
            ...auditEvents,
            {
              id: `aud-${Date.now()}`,
              timestamp: new Date().toISOString(),
              eventType: "recommendation_dismissed",
              entityId: id,
            },
          ],
        })
      },

      completeRecommendation: (id) => {
        const { completedRecommendationIds, auditEvents } = get()
        set({
          completedRecommendationIds: Array.from(new Set([...completedRecommendationIds, id])),
          recommendations: get().recommendations.map((r) =>
            r.id === id ? { ...r, status: "completed" as const } : r
          ),
          auditEvents: [
            ...auditEvents,
            {
              id: `aud-${Date.now()}`,
              timestamp: new Date().toISOString(),
              eventType: "recommendation_accepted",
              entityId: id,
            },
          ],
        })
      },

      setFeedback: (id, feedback) => {
        set({
          recommendations: get().recommendations.map((r) =>
            r.id === id ? { ...r, userFeedback: feedback } : r
          ),
        })
      },

      addProposal: (proposal) => {
        const { proposals, auditEvents } = get()
        const existingIndex = proposals.findIndex((p) => p.id === proposal.id)
        let updated: AdaptiveProposal[]

        if (existingIndex >= 0) {
          updated = [...proposals]
          updated[existingIndex] = proposal
        } else {
          updated = [proposal, ...proposals]
        }

        set({
          proposals: updated,
          auditEvents: [
            ...auditEvents,
            {
              id: `aud-${Date.now()}`,
              timestamp: new Date().toISOString(),
              eventType: "proposal_generated",
              entityId: proposal.id,
              details: { type: proposal.type, exercise: proposal.exerciseName },
            },
          ],
        })
      },

      updateProposalStatus: (id, status) => {
        const { proposals, auditEvents } = get()
        const eventMap = {
          accepted: "proposal_accepted" as const,
          rejected: "proposal_rejected" as const,
          reverted: "proposal_reverted" as const,
          pending: "proposal_generated" as const,
        }

        set({
          proposals: proposals.map((p) =>
            p.id === id ? { ...p, status, reviewedAt: new Date().toISOString() } : p
          ),
          auditEvents: [
            ...auditEvents,
            {
              id: `aud-${Date.now()}`,
              timestamp: new Date().toISOString(),
              eventType: eventMap[status],
              entityId: id,
            },
          ],
        })
      },

      getProposalById: (id) => {
        return get().proposals.find((p) => p.id === id)
      },

      saveWeeklyReview: (review) => {
        const { weeklyReviews, auditEvents } = get()
        const existingIndex = weeklyReviews.findIndex((r) => r.id === review.id)
        let updated: WeeklyCoachingReview[]

        if (existingIndex >= 0) {
          updated = [...weeklyReviews]
          updated[existingIndex] = review
        } else {
          updated = [review, ...weeklyReviews]
        }

        set({
          weeklyReviews: updated,
          auditEvents: [
            ...auditEvents,
            {
              id: `aud-${Date.now()}`,
              timestamp: new Date().toISOString(),
              eventType: "review_generated",
              entityId: review.id,
            },
          ],
        })
      },

      addChatMessage: (message) => {
        set({ chatMessages: [...get().chatMessages, message] })
      },

      clearChat: () => {
        set({ chatMessages: [INITIAL_GREETING] })
      },

      resetCoachStore: () => {
        set({
          recommendations: [],
          proposals: [],
          weeklyReviews: [],
          chatMessages: [INITIAL_GREETING],
          dismissedRecommendationIds: [],
          completedRecommendationIds: [],
          auditEvents: [],
        })
      },
    }),
    {
      name: STORE_PERSIST_KEYS.coach,
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_SCHEMA_VERSION,
    }
  )
)
