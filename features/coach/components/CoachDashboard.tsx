"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Bot,
  Sliders,
  CalendarCheck,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Filter,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { useCoachRecommendations } from "../hooks/useCoachRecommendations"
import { useAdaptiveProgramming } from "../hooks/useAdaptiveProgramming"
import { useCoachStore } from "../store/coach.store"
import { RecommendationCard } from "./RecommendationCard"
import { AdaptiveProposalCard } from "./AdaptiveProposalCard"
import { WeeklyReviewCard } from "./WeeklyReviewCard"
import { CoachChatView } from "./CoachChatView"
import { generateWeeklyReview } from "../services/weekly-review.service"
import { useAuthStore } from "@/lib/store/auth.store"
import { useWorkoutHistory } from "@/features/training/hooks/useWorkoutQueries"
import { useRecoveryStore } from "@/features/recovery/store/recovery.store"
import { useNutritionStore } from "@/features/nutrition/store/nutrition.store"
import { useGoalsStore } from "@/features/goals/store/goals.store"
import type { RecommendationAction, RecommendationCategory } from "../types/coach.types"
import { cn } from "@/lib/utils/cn"

type CoachTab = "overview" | "adaptive" | "review" | "chat"

export function CoachDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<CoachTab>("overview")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const {
    recommendations,
    completeness,
    activeProgram,
    dismissRecommendation,
    completeRecommendation,
    setFeedback,
  } = useCoachRecommendations()

  const { proposals, acceptProposal, rejectProposal, revertProposal } = useAdaptiveProgramming(
    user?.uid || ""
  )

  const { weeklyReviews, saveWeeklyReview } = useCoachStore()
  const { entries: recoveryEntries } = useRecoveryStore()
  const { dailyLogs: nutritionLogs, targets: nutritionTargets } = useNutritionStore()
  const { goals } = useGoalsStore()
  const { data: sessions = [] } = useWorkoutHistory(user?.uid || "")

  // Current or generated weekly review
  const currentWeeklyReview = useMemo(() => {
    if (weeklyReviews.length > 0) return weeklyReviews[0]!
    return generateWeeklyReview({
      userId: user?.uid || "",
      sessions,
      activeProgram,
      recoveryEntries,
      nutritionLogs,
      nutritionTargets,
    })
  }, [weeklyReviews, user?.uid, sessions, activeProgram, recoveryEntries, nutritionLogs, nutritionTargets])

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    if (selectedCategory === "all") return recommendations
    return recommendations.filter((r) => r.category === selectedCategory)
  }, [recommendations, selectedCategory])

  const pendingProposalsCount = useMemo(
    () => proposals.filter((p) => p.status === "pending").length,
    [proposals]
  )

  const handleAction = (action: RecommendationAction) => {
    if (action.type === "adaptive_proposal") {
      setActiveTab("adaptive")
    } else if (action.url) {
      router.push(action.url)
    }
  }

  const handleRefreshReview = () => {
    const freshReview = generateWeeklyReview({
      userId: user?.uid || "",
      sessions,
      activeProgram,
      recoveryEntries,
      nutritionLogs,
      nutritionTargets,
    })
    saveWeeklyReview(freshReview)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-accent uppercase flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Intelligence Layer
            </span>
            <span className="text-[10px] font-mono text-text-placeholder uppercase bg-bg-surface px-2 py-0.5 rounded border border-border-subtle">
              Phase 7.7
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
            AI Coach & Adaptive Programming
          </h1>
          <p className="text-xs text-text-secondary max-w-2xl">
            Deterministic, evidence-grounded insights for progressive overload and recovery optimization.
            No gimmicks, no random advice, no silent program mutations.
          </p>
        </div>

        {/* Data Completeness Score Widget */}
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 min-w-[260px] space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-text-placeholder">
              Data Completeness
            </span>
            <span className="text-xs font-mono font-bold text-accent">
              {completeness.scorePct}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-subtle/50">
            <div
              className="bg-accent h-full transition-all duration-500 rounded-full"
              style={{ width: `${completeness.scorePct}%` }}
            />
          </div>
          {completeness.missingDataItems.length > 0 ? (
            <p className="text-[10px] text-amber-400/90 leading-tight flex items-start gap-1">
              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
              <span>Missing: {completeness.missingDataItems.join(", ")}</span>
            </p>
          ) : (
            <p className="text-[10px] text-emerald-400 leading-tight flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span>Full telemetry available across all streams</span>
            </p>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
            activeTab === "overview"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-text-secondary hover:text-primary"
          )}
        >
          <Bot className="h-4 w-4" />
          <span>Coaching Insights</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-bg-surface border border-border-subtle">
            {recommendations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("adaptive")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap relative",
            activeTab === "adaptive"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-text-secondary hover:text-primary"
          )}
        >
          <Sliders className="h-4 w-4" />
          <span>Adaptive Plan</span>
          {pendingProposalsCount > 0 && (
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {pendingProposalsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("review")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
            activeTab === "review"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-text-secondary hover:text-primary"
          )}
        >
          <CalendarCheck className="h-4 w-4" />
          <span>Weekly Debrief</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
            activeTab === "chat"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-text-secondary hover:text-primary"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Coach Conversation</span>
        </button>
      </div>

      {/* Tab 1: Overview & Recommendations */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-placeholder font-mono flex items-center gap-1 mr-1">
              <Filter className="h-3 w-3" />
              Filter:
            </span>
            {[
              { id: "all", label: "All Insights" },
              { id: "progression", label: "Progression" },
              { id: "recovery", label: "Recovery" },
              { id: "consistency", label: "Consistency" },
              { id: "nutrition", label: "Nutrition" },
              { id: "goal_alignment", label: "Goals" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "text-xs px-3 py-1 rounded-lg border transition-colors",
                  selectedCategory === cat.id
                    ? "bg-accent/15 border-accent/40 text-accent font-medium"
                    : "bg-bg-surface border-border-subtle text-text-secondary hover:text-primary"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recommendations List */}
          {filteredRecommendations.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-bg-surface p-12 text-center space-y-3">
              <ShieldCheck className="h-10 w-10 text-accent mx-auto opacity-70" />
              <h3 className="text-base font-semibold text-primary">All Systems Green</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                No active recommendations pending. As you log more workouts, recovery check-ins, and
                meals, your coach will generate new evidence-grounded insights.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onDismiss={dismissRecommendation}
                  onComplete={completeRecommendation}
                  onFeedback={setFeedback}
                  onActionClick={handleAction}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Adaptive Programming Plan */}
      {activeTab === "adaptive" && (
        <div className="space-y-6 animate-fade-in">
          {/* Informational Banner */}
          <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-accent uppercase tracking-wider">
                Safety Guarantee
              </span>
              <h3 className="text-sm font-semibold text-primary">
                Explicit Athlete Approval Required
              </h3>
              <p className="text-xs text-text-secondary">
                Your programs are never altered silently. Every proposed load or volume change
                must be reviewed, accepted, and can be reverted with 1 click.
              </p>
            </div>
            {activeProgram && (
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-text-placeholder uppercase block">
                  Active Program
                </span>
                <span className="text-xs font-semibold text-primary font-mono">
                  {activeProgram.name}
                </span>
              </div>
            )}
          </div>

          {/* Proposals List */}
          {proposals.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-bg-surface p-12 text-center space-y-3">
              <Sliders className="h-10 w-10 text-text-placeholder mx-auto opacity-50" />
              <h3 className="text-base font-semibold text-primary">No Pending Adjustments</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                When you hit target reps across multiple consecutive sessions or experience
                prolonged fatigue, your coach will formulate an adaptive proposal for your review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <AdaptiveProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onAccept={acceptProposal}
                  onReject={rejectProposal}
                  onRevert={revertProposal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Weekly Debrief & Review */}
      {activeTab === "review" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRefreshReview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-base text-xs font-medium text-text-secondary hover:text-primary transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Regenerate Debrief</span>
            </button>
          </div>
          {currentWeeklyReview && <WeeklyReviewCard review={currentWeeklyReview} />}
        </div>
      )}

      {/* Tab 4: Coach Conversation */}
      {activeTab === "chat" && (
        <div className="animate-fade-in">
          <CoachChatView />
        </div>
      )}
    </div>
  )
}
