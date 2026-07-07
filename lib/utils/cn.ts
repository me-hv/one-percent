import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn — className utility
 *
 * Merges Tailwind classes intelligently:
 * - clsx handles conditional and array class syntax
 * - twMerge resolves Tailwind conflicts (last write wins)
 *
 * Usage:
 *   cn("px-4 py-2", isActive && "bg-accent", className)
 *   cn(["base-class", condition && "conditional-class"])
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
