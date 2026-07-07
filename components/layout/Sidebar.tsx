"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Dumbbell,
  Utensils,
  Scale,
  Moon,
  CheckSquare,
  Target,
  BarChart2,
  MessageSquare,
  Award,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useUIStore } from "@/lib/store/ui.store"
import { useAuthStore } from "@/lib/store/auth.store"
import { ROUTES } from "@/lib/constants/ROUTES"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase/auth"
import { toast } from "sonner"

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { profile } = useAuthStore()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      // Clear cookie for middleware auth checks
      document.cookie = "__session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
      toast.success("Signed out successfully")
    } catch (error) {
      toast.error("Error signing out")
    }
  }

  const navItems = [
    { name: "Dashboard", href: ROUTES.dashboard, icon: BarChart2 },
    { name: "Training", href: ROUTES.training.root, icon: Dumbbell },
    { name: "Nutrition", href: ROUTES.nutrition.root, icon: Utensils },
    { name: "Body", href: ROUTES.body.root, icon: Scale },
    { name: "Recovery", href: ROUTES.recovery.root, icon: Moon },
    { name: "Habits", href: ROUTES.habits.root, icon: CheckSquare },
    { name: "Goals", href: ROUTES.goals.root, icon: Target },
    { name: "AI Coach", href: ROUTES.coach.root, icon: Sparkles, highlight: true },
    { name: "Achievements", href: ROUTES.achievements.root, icon: Award },
  ]

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-0 z-40 hidden border-r border-border-subtle bg-bg-surface transition-all duration-200 ease-in-out lg:flex lg:flex-col",
        sidebarCollapsed ? "w-16" : "w-60",
      )}
    >
      {/* ─── Logo / Brand lockup ────────────────────────────────────── */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-border-subtle">
        <Link href={ROUTES.dashboard} className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent text-bg-base font-mono font-bold text-lg">
            1%
          </div>
          {!sidebarCollapsed && (
            <span className="font-mono text-sm font-semibold tracking-wider text-primary">
              ONE PERCENT
            </span>
          )}
        </Link>

        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="rounded p-1 hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors duration-150"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ─── Sidebar Navigation Items ───────────────────────────────── */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 relative",
                isActive
                  ? "bg-bg-elevated text-primary border-l-2 border-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-primary",
                item.highlight && !isActive && "text-accent/80 hover:text-accent",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-150 group-hover:scale-105",
                  isActive ? "text-accent" : "text-text-placeholder group-hover:text-primary",
                  item.highlight && "text-accent",
                )}
              />
              {!sidebarCollapsed && (
                <span className="ml-3 truncate">{item.name}</span>
              )}
              {sidebarCollapsed && (
                <span className="absolute left-14 z-50 hidden rounded-md bg-bg-elevated border border-border-default px-2 py-1 text-xs text-primary shadow-md group-hover:block whitespace-nowrap">
                  {item.name}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ─── Profile / Settings Footer ──────────────────────────────── */}
      <div className="border-t border-border-subtle p-3 space-y-1">
        <Link
          href={ROUTES.settings.root}
          className={cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 relative",
            pathname.startsWith(ROUTES.settings.root)
              ? "bg-bg-elevated text-primary"
              : "text-text-secondary hover:bg-bg-elevated hover:text-primary",
          )}
        >
          <Settings className="h-5 w-5 text-text-placeholder group-hover:text-primary" />
          {!sidebarCollapsed && <span className="ml-3 truncate">Settings</span>}
          {sidebarCollapsed && (
            <span className="absolute left-14 z-50 hidden rounded-md bg-bg-elevated border border-border-default px-2 py-1 text-xs text-primary shadow-md group-hover:block whitespace-nowrap">
              Settings
            </span>
          )}
        </Link>

        {sidebarCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center rounded-md py-2 hover:bg-bg-elevated text-text-placeholder hover:text-primary transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between p-2 mt-2 bg-bg-base/30 rounded-lg border border-border-subtle/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-elevated border border-border-subtle text-primary font-semibold text-xs">
                {profile?.displayName?.slice(0, 2).toUpperCase() || "OP"}
              </div>
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-xs font-semibold text-primary truncate leading-tight">
                  {profile?.displayName || "Athlete"}
                </span>
                <span className="text-[10px] text-text-placeholder truncate">
                  {profile?.email || ""}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded hover:bg-bg-elevated text-text-placeholder hover:text-negative transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
