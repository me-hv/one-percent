import { create } from "zustand"
import type { User } from "firebase/auth"
import type { UserProfile, UserPreferences } from "@/lib/types/user.types"

interface AuthState {
  user: User | null
  profile: UserProfile | null
  preferences: UserPreferences | null
  initialized: boolean
  loading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setPreferences: (preferences: UserPreferences | null) => void
  setInitialized: (initialized: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  preferences: null,
  initialized: false,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setPreferences: (preferences) => set({ preferences }),
  setInitialized: (initialized) => set({ initialized }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ user: null, profile: null, preferences: null, loading: false }),
}))
