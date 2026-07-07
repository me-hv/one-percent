import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Providers } from "./providers"
import { Toaster } from "sonner"
import "./globals.css"

// ─── Metadata ──────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "One Percent",
    template: "%s | One Percent",
  },
  description: "Get 1% Better Every Day. A premium Fitness Operating System built for consistency, repetition, and long-term discipline.",
  applicationName: "One Percent",
  authors: [{ name: "One Percent Engineering" }],
  generator: "Next.js",
  keywords: [
    "fitness",
    "workout tracker",
    "fitness operating system",
    "strength training",
    "hypertrophy",
    "nutrition tracker",
    "habit builder",
    "ai fitness coach",
  ],
  referrer: "origin-when-cross-origin",
  creator: "One Percent Inc.",
  publisher: "One Percent Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://onepercent.fit"),
  openGraph: {
    title: "One Percent — Fitness Operating System",
    description: "Get 1% better every day. Minimal, premium, and data-driven training platform.",
    url: "https://onepercent.fit",
    siteName: "One Percent",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

// ─── Viewport ──────────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// ─── Root Layout ───────────────────────────────────────────────────
interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-base min-h-dvh antialiased text-secondary selection:bg-accent/25 selection:text-primary">
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--color-bg-surface)",
                borderColor: "var(--color-border-subtle)",
                color: "var(--color-text-primary)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
