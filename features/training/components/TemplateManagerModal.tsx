"use client"

import { useState } from "react"
import { X, FileUp, FileDown, Plus, Trash2, Copy, Star, Bookmark } from "lucide-react"
import type { WorkoutTemplate, TemplateCategory } from "@/lib/types/training.types"
import { useProgramsStore } from "../store/programs.store"
import { cn } from "@/lib/utils/cn"

interface TemplateManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate?: (template: WorkoutTemplate) => void
}

const CATEGORIES: TemplateCategory[] = [
  "Powerlifting",
  "Bodybuilding",
  "Push Pull Legs",
  "Upper Lower",
  "Full Body",
  "Custom",
]

export function TemplateManagerModal({ isOpen, onClose, onSelectTemplate }: TemplateManagerModalProps) {
  const {
    templates,
    deleteTemplate,
    duplicateTemplate,
    toggleTemplateFavorite,
    importTemplate,
    createTemplate,
  } = useProgramsStore()

  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all")
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newCat, setNewCat] = useState<TemplateCategory>("Custom")

  if (!isOpen) return null

  const filteredTemplates = templates.filter(
    (t) => selectedCategory === "all" || t.category === selectedCategory
  )

  const handleExport = (template: WorkoutTemplate) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2))
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `${template.name.toLowerCase().replace(/\s+/g, "_")}_template.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        if (json.name && Array.isArray(json.exercises)) {
          importTemplate(json)
        } else {
          alert("Invalid template JSON format")
        }
      } catch (err) {
        alert("Failed to parse JSON file")
      }
    }
    reader.readAsText(file)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    createTemplate({
      name: newTitle.trim(),
      category: newCat,
      exercises: [],
    })

    setNewTitle("")
    setIsCreating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex h-[80dvh] w-full max-w-2xl flex-col rounded-xl border border-border-subtle bg-bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-bg-base/40 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent-cyan/10 p-1.5 text-accent-cyan">
              <Bookmark className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Workout Templates</h3>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-border-subtle bg-bg-base/40 px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-bg-base transition-colors">
              <FileUp className="h-3.5 w-3.5 text-accent-cyan" /> Import JSON
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 rounded-lg bg-accent-gold px-3 py-1.5 text-xs font-bold text-bg-base hover:bg-accent-gold-hover transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> New Template
            </button>
            <button
              onClick={onClose}
              className="rounded p-1.5 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Create inline modal/section */}
        {isCreating && (
          <form onSubmit={handleCreate} className="border-b border-border-subtle bg-bg-base/30 p-4 space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
              Create New Template
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Template Name (e.g. Upper Body Hypertrophy)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="rounded-lg border border-border-subtle bg-bg-base/60 px-3 py-1.5 text-xs text-text-primary focus:border-accent-gold focus:outline-none"
              />
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as TemplateCategory)}
                className="rounded-lg border border-border-subtle bg-bg-base/60 px-3 py-1.5 text-xs text-text-primary focus:border-accent-gold focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-md border border-border-subtle px-3 py-1 text-xs font-medium text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-accent-gold px-3.5 py-1 text-xs font-bold text-bg-base hover:bg-accent-gold-hover"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Category Pills */}
        <div className="border-b border-border-subtle bg-bg-base/20 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              selectedCategory === "all"
                ? "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/40 font-semibold"
                : "bg-bg-base/40 text-text-muted border-border-subtle/40 hover:text-text-primary"
            )}
          >
            All Templates
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                selectedCategory === cat
                  ? "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/40 font-semibold"
                  : "bg-bg-base/40 text-text-muted border-border-subtle/40 hover:text-text-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List of templates */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted space-y-2">
              <Bookmark className="h-8 w-8 text-text-placeholder opacity-50" />
              <p className="text-xs">No workout templates found in this category.</p>
            </div>
          ) : (
            filteredTemplates.map((t) => (
              <div
                key={t.id}
                className="group flex items-center justify-between rounded-xl border border-border-subtle/60 bg-bg-base/30 p-3.5 hover:border-border-subtle transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">{t.name}</span>
                    {t.category && (
                      <span className="rounded bg-accent-gold/10 px-2 py-0.5 text-[10px] font-semibold text-accent-gold">
                        {t.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {t.exercises?.length || 0} exercises • Est. {t.estimatedDurationMinutes || 45} mins
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {onSelectTemplate && (
                    <button
                      onClick={() => {
                        onSelectTemplate(t)
                        onClose()
                      }}
                      className="rounded-lg bg-accent-gold/10 px-3 py-1.5 text-xs font-semibold text-accent-gold hover:bg-accent-gold/20 transition-colors"
                    >
                      Use Template
                    </button>
                  )}
                  <button
                    onClick={() => toggleTemplateFavorite(t.id)}
                    className="rounded p-1.5 text-text-placeholder hover:text-accent-gold transition-colors"
                    title="Toggle Favorite"
                  >
                    <Star className={cn("h-4 w-4", t.isFavorite && "fill-accent-gold text-accent-gold")} />
                  </button>
                  <button
                    onClick={() => handleExport(t)}
                    className="rounded p-1.5 text-text-placeholder hover:text-accent-cyan transition-colors"
                    title="Export JSON"
                  >
                    <FileDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => duplicateTemplate(t.id)}
                    className="rounded p-1.5 text-text-placeholder hover:text-text-primary transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="rounded p-1.5 text-text-placeholder hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
