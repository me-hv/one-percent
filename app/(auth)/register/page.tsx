"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getFirebaseAuthErrorMessage } from "@/features/auth/utils/auth-errors"
import { authService } from "@/features/auth/services/auth.service"
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton"
import { useAuthStore } from "@/lib/store/auth.store"
import { ROUTES } from "@/lib/constants/ROUTES"
import { toast } from "sonner"
import { ArrowRight, Loader2, AlertCircle } from "lucide-react"
import type { UserCredential } from "firebase/auth"
import type { UserProfile, UserPreferences } from "@/lib/types/user.types"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { setUser, setProfile, setPreferences } = useAuthStore()

  const handleGoogleSuccess = ({
    credential,
    profile,
    preferences,
  }: {
    credential: UserCredential
    profile: UserProfile
    preferences: UserPreferences
  }) => {
    setUser(credential.user)
    setProfile(profile)
    setPreferences(preferences)
    toast.success("Account ready — Welcome to One Percent")
    router.push(ROUTES.dashboard)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!name || !email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const { credential, profile, preferences } = await authService.signUp(email, password, name)
      setUser(credential.user)
      setProfile(profile)
      setPreferences(preferences)

      toast.success("Account created successfully")
      router.push(ROUTES.dashboard)
    } catch (err: any) {
      console.error("[Register Error]", err)
      const message = getFirebaseAuthErrorMessage(err)
      setFormError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          Create an account
        </h1>
        <p className="text-sm text-text-secondary">
          Enter your details below or use Google to set up your fitness operating system.
        </p>
      </div>

      {/* ─── Error Alert Banner ────────────────────────────────────── */}
      {formError && (
        <div className="p-3 text-xs rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{formError}</span>
        </div>
      )}

      {/* ─── Continue with Google ──────────────────────────────────── */}
      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={(msg) => setFormError(msg)}
        disabled={loading}
        text="Continue with Google"
      />

      {/* ─── Divider ──────────────────────────────────────────────── */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-default" />
        </div>
        <div className="relative flex justify-center text-[10px] font-mono tracking-widest uppercase">
          <span className="bg-base px-2.5 text-text-placeholder">
            Or sign up with email
          </span>
        </div>
      </div>

      {/* ─── Form ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="text-xs font-mono tracking-widest text-text-placeholder uppercase"
          >
            Display Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full h-10 px-3 rounded-md border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent focus:shadow-focus transition-all duration-150 text-sm outline-none"
            required
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-xs font-mono tracking-widest text-text-placeholder uppercase"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full h-10 px-3 rounded-md border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent focus:shadow-focus transition-all duration-150 text-sm outline-none"
            required
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-xs font-mono tracking-widest text-text-placeholder uppercase"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full h-10 px-3 rounded-md border border-border-default bg-bg-base text-primary placeholder-text-placeholder focus:border-accent focus:shadow-focus transition-all duration-150 text-sm outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-md bg-accent text-bg-base font-medium hover:bg-accent-hover active:bg-accent-pressed disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2 text-sm mt-6"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign Up <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* ─── Footer Link ───────────────────────────────────────────── */}
      <p className="text-center text-xs text-text-secondary lg:text-left">
        Already have an account?{" "}
        <Link
          href={ROUTES.auth.login}
          className="font-medium text-accent hover:text-accent-hover transition-colors duration-150"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
