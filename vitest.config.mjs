import { defineConfig } from "vitest/config"
import path from "node:path"
import fs from "node:fs"

// Load .env.local if present
try {
  const envPath = path.resolve(import.meta.dirname, ".env.local")
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n")
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=")
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  }
} catch {
  // Ignore in environments without .env.local
}

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
})
