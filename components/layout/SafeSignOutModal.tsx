"use client"

import React, { useState } from "react"
import { AlertTriangle, WifiOff, RefreshCw, X, LogOut, CheckCircle2 } from "lucide-react"
import { syncQueueService } from "@/lib/services/sync-queue.service"
import { toast } from "sonner"

export interface SafeSignOutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmSignOut: () => Promise<void>
  isOffline: boolean
  pendingChangesCount: number
}

export function SafeSignOutModal({
  isOpen,
  onClose,
  onConfirmSignOut,
  isOffline,
  pendingChangesCount,
}: SafeSignOutModalProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!isOpen) return null

  const handleRetrySync = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("Device is still offline. Please connect to the internet to sync.")
      return
    }

    setIsSyncing(true)
    try {
      await syncQueueService.flushQueue()
      const remaining = syncQueueService
        .getQueue()
        .filter((op) => op.status === "pending" || op.status === "processing" || op.status === "failed")

      if (remaining.length === 0) {
        toast.success("All data synchronized successfully! Proceeding with sign-out...")
        await onConfirmSignOut()
      } else {
        toast.warning(`${remaining.length} items still failed to sync. Check network connection.`)
      }
    } catch (err) {
      toast.error("Failed to flush sync queue.")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleForceSignOut = async () => {
    setIsSigningOut(true)
    try {
      await onConfirmSignOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-out-warning-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md rounded-xl border border-border-default bg-bg-surface p-6 shadow-2xl space-y-5 text-left">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-negative/10 text-negative border border-negative/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-negative uppercase font-bold">
                Data Protection Warning
              </span>
              <h3 id="sign-out-warning-title" className="text-base font-semibold text-primary">
                Unsaved Data at Risk
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSyncing || isSigningOut}
            className="rounded p-1 text-text-placeholder hover:text-primary transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="space-y-3">
          {isOffline && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-bg-base border border-border-subtle text-xs text-text-secondary">
              <WifiOff className="h-4 w-4 text-negative flex-shrink-0" />
              <span>
                You are currently <strong className="text-primary">offline</strong>. Your device cannot reach the sync server.
              </span>
            </div>
          )}

          {pendingChangesCount > 0 && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-bg-base border border-border-subtle text-xs text-text-secondary">
              <RefreshCw className="h-4 w-4 text-accent flex-shrink-0" />
              <span>
                You have <strong className="text-primary">{pendingChangesCount}</strong> unsynchronized mutation
                {pendingChangesCount > 1 ? "s" : ""} waiting in the offline queue.
              </span>
            </div>
          )}

          <p className="text-xs text-text-secondary leading-relaxed">
            Signing out now will clear local browser storage to protect your account. Any data that has not
            been synchronized to the cloud will be <strong className="text-negative font-medium">permanently erased</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing || isSigningOut}
            className="flex-1 py-2 px-3 rounded-lg border border-border-default bg-bg-elevated hover:bg-bg-elevated/80 text-primary font-medium text-xs transition-colors"
          >
            Cancel & Keep Data
          </button>

          {!isOffline && pendingChangesCount > 0 && (
            <button
              type="button"
              onClick={handleRetrySync}
              disabled={isSyncing || isSigningOut}
              className="flex-1 py-2 px-3 rounded-lg bg-accent text-bg-base hover:opacity-90 font-medium text-xs flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sync Now
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleForceSignOut}
            disabled={isSyncing || isSigningOut}
            className="py-2 px-3 rounded-lg border border-negative/30 bg-negative/10 hover:bg-negative/20 text-negative font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isSigningOut ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="h-3.5 w-3.5" />
                Sign Out Anyway
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
