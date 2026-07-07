"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart2, Dumbbell, Utensils, CheckSquare, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { ROUTES } from "@/lib/constants/ROUTES"

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: ROUTES.dashboard, icon: BarChart2 },
    { name: "Training", href: ROUTES.training.root, icon: Dumbbell },
    { name: "Coach", href: ROUTES.coach.root, icon: Sparkles, highlight: true },
    { name: "Nutrition", href: ROUTES.nutrition.root, icon: Utensils },
    { name: "Habits", href: ROUTES.habits.root, icon: CheckSquare },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 border-t border-border-subtle bg-bg-surface/90 backdrop-blur-md items-center justify-around px-2 pb-safe lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 py-1 text-center"
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-full p-1 transition-all duration-150",
                isActive
                  ? "bg-bg-elevated text-accent"
                  : "text-text-secondary hover:text-primary",
                item.highlight && !isActive && "text-accent",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span
              className={cn(
                "text-[10px] font-medium mt-0.5 tracking-wider transition-colors duration-150",
                isActive ? "text-primary" : "text-text-placeholder",
              )}
            >
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
