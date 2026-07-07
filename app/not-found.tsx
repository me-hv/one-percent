import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-base px-6 text-center">
      <div className="max-w-md space-y-6">
        {/* Monospace 404 tag */}
        <p className="font-mono text-sm tracking-widest text-accent uppercase">
          404 // Error
        </p>

        {/* Clean, negative-tracked heading */}
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          Page Not Found
        </h1>

        {/* Desaturated description */}
        <p className="text-secondary text-base">
          The view or metric you are looking for does not exist, has been archived,
          or belongs to another account.
        </p>

        {/* Button container */}
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-border-default bg-transparent px-4 py-2 text-sm font-medium text-primary hover:bg-bg-elevated transition-colors duration-200"
          >
            <ArrowLeft className="h-4 / w-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
