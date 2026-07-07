import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { trainingRepository } from "../repositories/training.repository"
import { trainingService } from "../services/training.service"
import { QUERY_KEYS } from "@/lib/constants/QUERY_KEYS"
import type { WorkoutSession } from "@/lib/types/training.types"

/**
 * Hook to retrieve workout sessions history
 */
export function useWorkoutHistory(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.training.sessions(userId),
    queryFn: () => trainingRepository.getWorkoutHistory(userId),
    enabled: !!userId,
  })
}

/**
 * Hook to retrieve personal records (PRs)
 */
export function usePersonalRecords(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.training.prs(userId),
    queryFn: () => trainingRepository.getPersonalRecords(userId),
    enabled: !!userId,
  })
}

/**
 * Mutation to complete a workout session and invalidate related caches
 */
export function useCompleteWorkoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, session }: { userId: string; session: WorkoutSession }) =>
      trainingService.completeWorkoutSession(userId, session),
    onSuccess: (_, { userId }) => {
      // Invalidate workout sessions cache
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.training.sessions(userId),
      })
      // Invalidate personal records cache
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.training.prs(userId),
      })
      // Invalidate dashboard summaries if any
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.user.profile(userId),
      })
    },
  })
}
