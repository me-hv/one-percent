"use client"

import { useEffect } from "react"
import { AlertOctagon, RotateCcw } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console or monitoring system (e.g. Sentry)
    console.error("[One Percent App Error Boundary]:", error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-base px-6 text-center">
      <div className="max-w-md space-y-6">
        {/* Error icon wrapper with warning tint */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-negative-bg border border-negative-border text-negative">
          <AlertOctagon className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-sm tracking-widest text-negative uppercase">
            Runtime Error
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            Something went wrong
          </h1>
        </div>

        <p className="text-secondary text-sm font-mono bg-bg-surface border border-border-subtle p-3 rounded-md max-h-40 overflow-auto text-left">
          {error.message || "An unexpected application error occurred."}
          {error.digest && (
            <span className="block mt-2 text-xs text-text-placeholder">
              Digest: {error.digest}
            </span>
          )}
        </p>

        <p className="text-secondary text-sm">
          Try reloading the page. If the issue persists, please contact our
          support channels.
        </p>

        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg-base hover:bg-accent-hover active:bg-accent-pressed transition-colors duration-150"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
