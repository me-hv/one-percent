/**
 * TanStack Query Client Configuration
 *
 * Single QueryClient instance shared across the app.
 * Configured with sensible defaults — individual queries can override.
 */
import { QueryClient } from "@tanstack/react-query"
import { CACHE_CONFIG } from "@/lib/constants/CACHE_CONFIG"

let queryClientInstance: QueryClient | null = null

export function getQueryClient(): QueryClient {
  if (queryClientInstance) return queryClientInstance

  queryClientInstance = new QueryClient({
    defaultOptions: {
      queries: {
        // ─── Staleness ─────────────────────────────────────────
        staleTime: CACHE_CONFIG.staleTime.medium,
        gcTime:    CACHE_CONFIG.gcTime.medium,

        // ─── Network Behavior ──────────────────────────────────
        refetchOnWindowFocus: true,
        refetchOnReconnect:   true,
        refetchOnMount:       true,

        // ─── Retry Strategy ────────────────────────────────────
        retry: CACHE_CONFIG.retry.count,
        retryDelay: CACHE_CONFIG.retry.delay,

        // ─── Error Handling ────────────────────────────────────
        // Throw errors in production for error boundaries to catch
        throwOnError: false,
      },
      mutations: {
        // ─── Mutation Retry ────────────────────────────────────
        retry: 1,
        retryDelay: 1000,
      },
    },
  })

  return queryClientInstance
}

// Named export for use in providers
export const queryClient = getQueryClient()
