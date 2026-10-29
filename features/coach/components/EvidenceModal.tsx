"use client"

import { X, CheckCircle, HelpCircle } from "lucide-react"
import type { SupportingEvidence } from "../types/coach.types"

interface EvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  evidence: SupportingEvidence[]
  dataCompletenessPct?: number
}

export function EvidenceModal({
  isOpen,
  onClose,
  title,
  evidence,
  dataCompletenessPct,
}: EvidenceModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-xl border border-border-default bg-bg-surface p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
              Verifiable Evidence
            </span>
            <h3 className="text-base font-semibold text-primary">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-placeholder hover:text-primary transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Data Completeness */}
        {dataCompletenessPct !== undefined && (
          <div className="rounded-lg border border-border-subtle bg-bg-base p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-primary">Data Completeness Score</span>
              <p className="text-[11px] text-text-secondary">
                Calculated across your workouts, recovery check-ins, and nutrition logs
              </p>
            </div>
            <div className="font-mono font-bold text-sm text-accent">
              {dataCompletenessPct}%
            </div>
          </div>
        )}

        {/* Evidence List */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono tracking-widest text-text-placeholder uppercase">
            Observed Metrics
          </h4>

          {evidence.length === 0 ? (
            <p className="text-xs text-text-placeholder italic py-2">
              No specific telemetry recorded for this recommendation.
            </p>
          ) : (
            evidence.map((ev, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border-subtle bg-bg-base/70 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-accent" />
                    {ev.metric}
                  </span>
                  <span className="font-mono text-accent text-[11px] font-medium">
                    {ev.observedValue} {ev.unit || ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary pt-1 border-t border-border-subtle/50">
                  {ev.baselineOrTarget && (
                    <div>
                      <span className="text-text-placeholder">Target:</span> {ev.baselineOrTarget}
                    </div>
                  )}
                  {ev.threshold && (
                    <div>
                      <span className="text-text-placeholder">Threshold:</span> {ev.threshold}
                    </div>
                  )}
                  <div>
                    <span className="text-text-placeholder">Window:</span> {ev.timeframe}
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed bg-bg-surface/50 p-2 rounded border border-border-subtle/30">
                  {ev.interpretation}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-bg-elevated hover:bg-border-default text-primary text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
