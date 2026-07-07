"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthInit } from "@/features/auth/hooks/useAuthInit"
import { useAuthStore } from "@/lib/store/auth.store"
import { ROUTES } from "@/lib/constants/ROUTES"
import { Sparkles } from "lucide-react"

export default function RootPage() {
  useAuthInit()
  const { user, loading, initialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !loading) {
      if (user) {
        router.replace(ROUTES.dashboard)
      } else {
        router.replace(ROUTES.auth.login)
      }
    }
  }, [user, loading, initialized, router])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-base text-center">
      <div className="space-y-4 animate-pulse">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-bg-base font-mono font-bold text-2xl mx-auto">
          1%
        </div>
        <div className="flex items-center gap-1.5 justify-center text-xs font-mono tracking-widest text-text-placeholder uppercase">
          <Sparkles className="h-3 w-3 text-accent" />
          Get 1% Better Every Day
        </div>
      </div>
    </div>
  )
}
