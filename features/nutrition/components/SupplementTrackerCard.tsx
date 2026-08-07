"use client"

import { useState, useMemo } from "react"
import { ShieldCheck, CheckSquare, Square, Plus, Pill, X } from "lucide-react"
import { useNutritionStore } from "@/features/nutrition/store/nutrition.store"
import type { SupplementItem } from "@/lib/types/nutrition.types"
import { cn } from "@/lib/utils/cn"
import { toast } from "sonner"

interface SupplementTrackerCardProps {
  selectedDateStr: string
}

const DEFAULT_SUPPLEMENTS: SupplementItem[] = [
  { id: "supp-001", name: "Creatine Monohydrate", dosage: "5g", timing: "Post-Workout / Morning" },
  { id: "supp-002", name: "100% Whey Protein Isolate", dosage: "1 scoop (30g)", timing: "Post-Workout" },
  { id: "supp-003", name: "Omega-3 Fish Oil", dosage: "2 softgels", timing: "Morning with Meal" },
  { id: "supp-004", name: "Vitamin D3", dosage: "5,000 IU", timing: "Morning" },
  { id: "supp-005", name: "Magnesium Glycinate", dosage: "400mg", timing: "Night Before Bed" },
  { id: "supp-006", name: "Daily Multivitamin", dosage: "1 tablet", timing: "Morning" },
  { id: "supp-007", name: "Electrolytes Complex", dosage: "1 packet", timing: "Intra-Workout" },
]

export function SupplementTrackerCard({ selectedDateStr }: SupplementTrackerCardProps) {
  const { supplementLogs, toggleSupplementLog, customSupplements } = useNutritionStore()
  const [showAddCustomModal, setShowAddCustomModal] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customDosage, setCustomDosage] = useState("1 serving")
  const [customTiming, setCustomTiming] = useState("Anytime")

  const allSupplements = useMemo(() => {
    return [...DEFAULT_SUPPLEMENTS, ...customSupplements]
  }, [customSupplements])

  const todayLogs = useMemo(() => {
    return supplementLogs.filter((l) => l.date === selectedDateStr && l.taken)
  }, [supplementLogs, selectedDateStr])

  const adherencePct = useMemo(() => {
    if (allSupplements.length === 0) return 100
    return Math.round((todayLogs.length / allSupplements.length) * 100)
  }, [todayLogs, allSupplements])

  const handleToggle = (id: string, name: string) => {
    toggleSupplementLog(selectedDateStr, id)
    const wasTaken = todayLogs.some((l) => l.supplementId === id)
    if (!wasTaken) {
      toast.success(`Taken: ${name}`)
    }
  }

  return (
    <div className="card p-5 space-y-4 border border-border-subtle bg-bg-surface hover:border-border-default transition-all font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <Pill className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary font-sans">Supplements & Schedule</h3>
            <span className="text-[10px] text-text-placeholder">Daily Protocol Adherence</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-extrabold text-emerald-400 font-mono block">
            {adherencePct}% <span className="text-xs text-text-placeholder">Taken</span>
          </span>
          <span className="text-[10px] text-text-muted">{todayLogs.length} of {allSupplements.length} Supplements Logged</span>
        </div>
      </div>

      {/* Supplement Items List */}
      <div className="space-y-2 border-t border-border-subtle pt-3">
        {allSupplements.map((supp) => {
          const isTaken = todayLogs.some((l) => l.supplementId === supp.id)
          return (
            <div
              key={supp.id}
              onClick={() => handleToggle(supp.id, supp.name)}
              className={cn(
                "p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between",
                isTaken
                  ? "border-emerald-500/40 bg-emerald-500/10 text-primary"
                  : "border-border-subtle bg-bg-base/30 text-text-secondary hover:border-border-default"
              )}
            >
              <div className="flex items-center gap-2.5">
                {isTaken ? (
                  <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-text-placeholder shrink-0" />
                )}
                <div>
                  <span className={cn("font-bold font-sans block text-xs", isTaken && "line-through text-text-muted")}>
                    {supp.name}
                  </span>
                  <span className="text-[10px] text-text-placeholder block">
                    {supp.dosage} · {supp.timing}
                  </span>
                </div>
              </div>

              <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded border", isTaken ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-bg-base border-border-subtle text-text-placeholder")}>
                {isTaken ? "Taken" : "Pending"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
