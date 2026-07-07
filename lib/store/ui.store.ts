import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface UIState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  activeWorkoutCollapsed: boolean
  activeWorkoutModalOpen: boolean
  theme: "dark" | "light" | "system"

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleMobileSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
  toggleActiveWorkoutCollapse: () => void
  setActiveWorkoutCollapsed: (collapsed: boolean) => void
  setActiveWorkoutModalOpen: (open: boolean) => void
  setTheme: (theme: "dark" | "light" | "system") => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      activeWorkoutCollapsed: false,
      activeWorkoutModalOpen: false,
      theme: "dark",

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      toggleActiveWorkoutCollapse: () =>
        set((state) => ({ activeWorkoutCollapsed: !state.activeWorkoutCollapsed })),
      setActiveWorkoutCollapsed: (activeWorkoutCollapsed) => set({ activeWorkoutCollapsed }),
      setActiveWorkoutModalOpen: (activeWorkoutModalOpen) => set({ activeWorkoutModalOpen }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "one-percent-ui-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
)
