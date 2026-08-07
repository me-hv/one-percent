"use client"

import { useState } from "react"
import { Download, Upload, ShieldCheck, AlertCircle, FileCheck, X, Database } from "lucide-react"
import {
  downloadBackupFile,
  validateBackupSchema,
  restoreAppDataBackup,
  type BackupPayload,
  type ValidationResult,
} from "@/lib/services/backup.service"
import { toast } from "sonner"
import { cn } from "@/lib/utils/cn"

interface DataBackupModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DataBackupModal({ isOpen, onClose }: DataBackupModalProps) {
  const [importedFile, setImportedFile] = useState<BackupPayload | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [restoreMode, setRestoreMode] = useState<"merge" | "full">("merge")

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        const result = validateBackupSchema(json)
        setValidation(result)
        if (result.valid) {
          setImportedFile(json as BackupPayload)
          toast.success("Backup file validated successfully!")
        } else {
          setImportedFile(null)
          toast.error("Invalid backup file schema.")
        }
      } catch {
        setValidation({ valid: false, errors: ["Failed to parse file. Ensure it is valid JSON."], warnings: [] })
        setImportedFile(null)
        toast.error("Corrupted JSON file.")
      }
    }
    reader.readAsText(file)
  }

  const handleRestore = () => {
    if (!importedFile || !validation?.valid) return
    restoreAppDataBackup(importedFile, restoreMode)
    toast.success("Application state restored successfully! Refreshing...")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg card p-6 space-y-5 border border-accent/40 bg-bg-surface shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" />
            <h3 className="text-base font-bold text-primary">Data Backup & Disaster Recovery</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-elevated text-text-placeholder hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section 1: Export */}
        <div className="p-4 rounded-xl border border-border-subtle bg-bg-base/40 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 font-mono">
              <Download className="h-4 w-4 text-accent" /> Export Application Snapshot
            </h4>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Download your complete workouts, templates, goals, body logs, and habits into a single portable JSON file.
            </p>
          </div>
          <button
            onClick={downloadBackupFile}
            className="h-9 px-4 rounded bg-accent text-bg-base font-bold text-xs hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Download Backup JSON
          </button>
        </div>

        {/* Section 2: Import */}
        <div className="p-4 rounded-xl border border-border-subtle bg-bg-base/40 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 font-mono">
              <Upload className="h-4 w-4 text-amber-400" /> Restore from JSON Backup
            </h4>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Upload a previously exported One Percent JSON file to restore your training state.
            </p>
          </div>

          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="block w-full text-xs text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-bg-elevated file:text-primary hover:file:bg-border-default cursor-pointer"
          />

          {/* Validation Feedback */}
          {validation && (
            <div
              className={cn(
                "p-3 rounded border text-xs font-mono space-y-1.5",
                validation.valid ? "border-accent/30 bg-accent/10 text-accent" : "border-red-500/30 bg-red-500/10 text-red-400"
              )}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {validation.valid ? <FileCheck className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{validation.valid ? "Valid Backup File Ready" : "Validation Errors Detected"}</span>
              </div>

              {validation.valid && validation.entityCounts && (
                <div className="text-[10px] text-text-muted grid grid-cols-2 gap-1 pt-1 border-t border-accent/20">
                  <span>Workouts: {validation.entityCounts.workouts}</span>
                  <span>Programs: {validation.entityCounts.programs}</span>
                  <span>Goals: {validation.entityCounts.goals}</span>
                  <span>Weight Logs: {validation.entityCounts.weightLogs}</span>
                </div>
              )}

              {validation.errors.map((err, i) => (
                <p key={i} className="text-[10px] text-red-300">• {err}</p>
              ))}
            </div>
          )}

          {/* Restore Mode Selector */}
          {importedFile && validation?.valid && (
            <div className="space-y-2 pt-2 border-t border-border-subtle font-mono text-xs">
              <label className="text-[10px] text-text-placeholder uppercase font-bold">Restore Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRestoreMode("merge")}
                  className={cn(
                    "p-2 rounded border text-left text-[11px] transition-colors",
                    restoreMode === "merge" ? "border-accent bg-accent/10 text-accent font-bold" : "border-border-subtle text-text-secondary"
                  )}
                >
                  Merge Restore (Deduplicate)
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreMode("full")}
                  className={cn(
                    "p-2 rounded border text-left text-[11px] transition-colors",
                    restoreMode === "full" ? "border-red-500/50 bg-red-500/10 text-red-400 font-bold" : "border-border-subtle text-text-secondary"
                  )}
                >
                  Full Replace (Overwrite)
                </button>
              </div>

              <button
                onClick={handleRestore}
                className="w-full h-9 mt-2 rounded bg-amber-500 text-bg-base font-bold text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="h-4 w-4" /> Execute Restore
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
