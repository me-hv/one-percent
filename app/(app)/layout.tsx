"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { MobileNav } from "@/components/layout/MobileNav"
import { ActiveWorkoutModal } from "@/components/layout/ActiveWorkoutModal"
import { useAuthInit } from "@/features/auth/hooks/useAuthInit"
import { useAuthStore } from "@/lib/store/auth.store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sparkles } from "lucide-react"

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  useAuthInit()
  const { user, loading, initialized } = useAuthStore()
  const router = useRouter()

  // ─── Client-side redirect if unauthenticated ──────────────────────
  // The middleware handles this edge-side, but client-side redirect
  // provides a smooth fallback during route transitions.
  useEffect(() => {
    if (initialized && !user && !loading) {
      router.push("/login")
    }
  }, [user, loading, initialized, router])

  // ─── Loading State / Splash Screen ───────────────────────────────
  if (loading || !initialized) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-base text-center">
        <div className="space-y-4 animate-pulse">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-bg-base font-mono font-bold text-2xl mx-auto">
            1%
          </div>
          <div className="flex items-center gap-1.5 justify-center text-xs font-mono tracking-widest text-text-placeholder uppercase">
            <Sparkles className="h-3 w-3 text-accent" />
            Optimizing Performance
          </div>
        </div>
      </div>
    )
  }

  // ─── Render Authenticated App Shell ─────────────────────────────
  return (
    <div className="min-h-dvh bg-base">
      <Sidebar />
      <div className="flex flex-col lg:pl-60 transition-all duration-200 ease-in-out min-h-dvh">
        <TopBar />
        <main className="flex-1 pb-20 lg:pb-6 overflow-x-hidden">
          {children}
        </main>
        <MobileNav />
      </div>
      <ActiveWorkoutModal />
    </div>
  )
}
