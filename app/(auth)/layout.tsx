import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Auth | One Percent",
  description: "Sign in to access your Fitness Operating System.",
}

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-12 bg-base">
      {/* ─── Sidebar / Philosophy Brand Panel ───────────────────────── */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between border-r border-border-subtle bg-bg-surface p-8 xl:p-12 relative overflow-hidden">
        {/* Subtle grid lines background overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent text-bg-base font-mono font-bold text-lg">
            1%
          </div>
          <span className="font-mono text-sm font-semibold tracking-wider text-primary">
            ONE PERCENT
          </span>
        </div>

        <div className="space-y-6 relative z-10 max-w-sm">
          <h2 className="text-xl font-medium text-primary leading-snug">
            "Get 1% Better Every Day."
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            One Percent is not another workout tracker. It is a complete Fitness
            Operating System built for consistency, repetition, measurable
            progress, and long-term discipline.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-mono tracking-widest text-text-placeholder uppercase">
            © 2026 One Percent. All rights reserved.
          </p>
        </div>
      </div>

      {/* ─── Main Form Panel ────────────────────────────────────────── */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-sm space-y-8">
          {children}
        </div>
      </div>
    </div>
  )
}
