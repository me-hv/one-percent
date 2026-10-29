"use client"

import { useState } from "react"
import { authService } from "../services/auth.service"
import { getFirebaseAuthErrorMessage } from "../utils/auth-errors"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { UserCredential } from "firebase/auth"
import type { UserProfile, UserPreferences } from "@/lib/types/user.types"

interface GoogleSignInButtonProps {
  onSuccess: (result: {
    credential: UserCredential
    profile: UserProfile
    preferences: UserPreferences
  }) => void
  onError?: (errorMessage: string) => void
  disabled?: boolean
  text?: string
  className?: string
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  text = "Continue with Google",
  className = "",
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    if (loading || disabled) return
    setLoading(true)

    try {
      const result = await authService.signInWithGoogle()
      onSuccess(result)
    } catch (err: any) {
      // If the user deliberately closed the popup window, do not show a failure toast
      if (err?.code === "auth/popup-closed-by-user") {
        console.info("[Google Auth] Popup closed by user before sign-in completed.")
        return
      }

      console.error("[Google Auth Error]", err)
      const message = getFirebaseAuthErrorMessage(err)
      if (onError) {
        onError(message)
      }
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
      aria-label={text}
      className={`w-full h-10 px-4 rounded-md border border-border-default bg-bg-base hover:bg-bg-subtle active:bg-border-default text-primary font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          {/* Official Google G Logo SVG */}
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{text}</span>
        </>
      )}
    </button>
  )
}
