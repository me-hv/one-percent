"use client"

import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ROUTES } from "@/lib/constants/ROUTES"
import { useAuthStore } from "@/lib/store/auth.store"

export function CoachBriefing() {
  const { profile } = useAuthStore()
  const firstName = profile?.displayName?.split(" ")[0] || "Athlete"

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-bg-surface p-5 md:p-6 shadow-sm">
      {/* Decorative background flare */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/5 blur-2xl" />

      <div className="flex items-start gap-4">
        {/* Sparkle icon indicator */}
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent">
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="space-y-3 flex-1">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
              AI Coach // Daily Briefing
            </span>
            <h3 className="text-base font-semibold text-primary">
              Good morning, {firstName}.
            </h3>
          </div>

          <p className="text-text-secondary text-sm leading-relaxed">
            Your readiness score is <strong className="text-primary font-semibold">88% (High)</strong> today. Heart Rate Variability is up 12% at <code className="font-mono text-xs text-primary">74ms</code>, and sleep quality was optimal. Today is a green light for your scheduled <strong className="text-primary font-semibold">Lower Body Power</strong> session. Keep training intensity high.
          </p>

          <div className="pt-2">
            <Link
              href={ROUTES.coach.root}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              Consult Coach <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
export default CoachBriefing
