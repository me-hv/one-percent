"use client"

import dynamic from "next/dynamic"

const CoachDashboard = dynamic(
  () => import("@/features/coach/components/CoachDashboard").then((m) => m.CoachDashboard),
  { ssr: false }
)

export default function CoachPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CoachDashboard />
    </div>
  )
}
