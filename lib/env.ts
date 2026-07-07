import { z } from "zod"

// ─── Client-Side Environment Schema ───────────────────────────────
// Only NEXT_PUBLIC_* variables are safe to validate client-side.
// Server-side variables are validated in lib/env.server.ts
const clientEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, "Firebase API key is required"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, "Firebase Auth domain is required"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, "Firebase Project ID is required"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, "Firebase Storage bucket is required"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, "Firebase Messaging Sender ID is required"),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, "Firebase App ID is required"),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: z
    .string()
    .optional()
    .transform((v) => v === "true")
    .default(false),
})

// ─── Server-Side Environment Schema ───────────────────────────────
// Only imported in server-side code (API routes, Server Components)
const serverEnvSchema = clientEnvSchema.extend({
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1, "Firebase Admin project ID is required"),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1, "Firebase Admin private key is required"),
  FIREBASE_ADMIN_CLIENT_EMAIL: z
    .string()
    .email("Firebase Admin client email must be valid"),
  GEMINI_API_KEY: z.string().min(1, "Gemini API key is required"),
  RESEND_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  WHOOP_CLIENT_ID: z.string().optional(),
  WHOOP_CLIENT_SECRET: z.string().optional(),
  OURA_CLIENT_ID: z.string().optional(),
  OURA_CLIENT_SECRET: z.string().optional(),
})

// ─── Validate and Export ───────────────────────────────────────────

function validateClientEnv() {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_USE_FIREBASE_EMULATOR: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
  })

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    throw new Error(
      `❌ Missing or invalid environment variables:\n\n${errors}\n\nCopy .env.example to .env.local and fill in the required values.`,
    )
  }

  return result.data
}

// Export validated client env — safe to use anywhere
export const env = validateClientEnv()

// Export server env validator — only call in server contexts
export function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    throw new Error(
      `❌ Missing or invalid server environment variables:\n\n${errors}\n\nEnsure all required server variables are set in your .env.local or Vercel dashboard.`,
    )
  }

  return result.data
}

// ─── Type Exports ──────────────────────────────────────────────────
export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>
