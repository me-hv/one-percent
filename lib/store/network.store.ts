import { create } from "zustand"
import type { NetworkStatus } from "@/lib/types/common.types"

interface NetworkState {
  status: NetworkStatus
  isOnline: boolean
  offlineQueueLength: number

  // Actions
  setStatus: (status: NetworkStatus) => void
  setIsOnline: (isOnline: boolean) => void
  setOfflineQueueLength: (length: number) => void
  incrementOfflineQueue: () => void
  decrementOfflineQueue: () => void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  status: "online",
  isOnline: true,
  offlineQueueLength: 0,

  setStatus: (status) => set({ status, isOnline: status === "online" || status === "slow" }),
  setIsOnline: (isOnline) => set({ isOnline, status: isOnline ? "online" : "offline" }),
  setOfflineQueueLength: (offlineQueueLength) => set({ offlineQueueLength }),
  incrementOfflineQueue: () =>
    set((state) => ({ offlineQueueLength: state.offlineQueueLength + 1 })),
  decrementOfflineQueue: () =>
    set((state) => ({
      offlineQueueLength: Math.max(0, state.offlineQueueLength - 1),
    })),
}))
