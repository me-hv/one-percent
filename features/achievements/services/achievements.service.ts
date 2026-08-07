import type { WorkoutSession } from "@/lib/types/training.types"
import type { Goal } from "@/lib/types/goals.types"
import { extractAllPRs } from "@/features/training/services/pr.service"
import { formatDateKey, subDays } from "@/lib/utils/date"

export interface Achievement {
  id: string
  title: string
  description: string
  category: "sessions" | "sets" | "volume" | "prs" | "programs" | "consistency"
  unlocked: boolean
  progress: number // Current value
  target: number // Target needed to unlock
  unlockedAt?: string // "YYYY-MM-DD"
  iconName: string
}

/**
 * Evaluates GitHub-inspired monochrome milestone achievements based on user activity.
 * Pure deterministic calculation without gamification gimmicks.
 */
export function evaluateAchievements(
  sessions: WorkoutSession[] = [],
  goals: Goal[] = []
): Achievement[] {
  const completedSessions = sessions.filter((s) => s.status === "completed")
  const sessionCount = completedSessions.length

  const totalSets = completedSessions.reduce((acc, s) => acc + (s.totalSets || 0), 0)
  const totalVolume = completedSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0)

  const allPRs = extractAllPRs(completedSessions)
  const prCount = allPRs.length

  // Calculate current streak
  const sessionDatesSet = new Set(
    completedSessions.map((s) => {
      const d = s.completedAt?.toDate?.() ? s.completedAt.toDate() : new Date()
      return formatDateKey(d)
    })
  )

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = subDays(today, i)
    const key = formatDateKey(d)
    if (sessionDatesSet.has(key)) {
      streak += 1
    } else if (i > 0) {
      break
    }
  }

  const completedProgramsCount = goals.filter(
    (g) => g.category === "consistency" && g.autoUpdateKey === "program_completion" && g.status === "completed"
  ).length

  const rawAchievements: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
    // Sessions
    { id: "ach-sess-1", title: "First Workout Logged", description: "Logged your first completed training session.", category: "sessions", progress: sessionCount, target: 1, iconName: "Dumbbell" },
    { id: "ach-sess-10", title: "10 Workouts Executed", description: "Completed 10 structured training sessions.", category: "sessions", progress: sessionCount, target: 10, iconName: "Dumbbell" },
    { id: "ach-sess-50", title: "50 Workouts Milestone", description: "Reached 50 completed workouts in your log.", category: "sessions", progress: sessionCount, target: 50, iconName: "Dumbbell" },
    { id: "ach-sess-100", title: "Century Lifter (100 Sessions)", description: "Completed 100 dedicated workouts.", category: "sessions", progress: sessionCount, target: 100, iconName: "Dumbbell" },
    { id: "ach-sess-500", title: "Master Veteran (500 Sessions)", description: "Achieved 500 recorded training sessions.", category: "sessions", progress: sessionCount, target: 500, iconName: "Dumbbell" },

    // Sets
    { id: "ach-set-1000", title: "1,000 Sets Logged", description: "Accumulated 1,000 working sets across exercises.", category: "sets", progress: totalSets, target: 1000, iconName: "Layers" },
    { id: "ach-set-5000", title: "5,000 Sets Logged", description: "Recorded 5,000 hard working sets.", category: "sets", progress: totalSets, target: 5000, iconName: "Layers" },

    // Volume
    { id: "ach-vol-100k", title: "100,000 kg Shifted", description: "Lifted a total cumulative volume of 100,000 kg.", category: "volume", progress: totalVolume, target: 100000, iconName: "Scale" },
    { id: "ach-vol-1m", title: "1,000,000 kg Shifted", description: "Reached 1 Million kg total training volume.", category: "volume", progress: totalVolume, target: 1000000, iconName: "Scale" },

    // PRs
    { id: "ach-pr-10", title: "10 Personal Records Broken", description: "Achieved 10 weight or rep personal bests.", category: "prs", progress: prCount, target: 10, iconName: "Trophy" },
    { id: "ach-pr-50", title: "50 Personal Records Broken", description: "Broke 50 strength or volume milestones.", category: "prs", progress: prCount, target: 50, iconName: "Trophy" },

    // Programs
    { id: "ach-prog-1", title: "First Program Finished", description: "Completed your first multi-week training program.", category: "programs", progress: completedProgramsCount > 0 ? 1 : 0, target: 1, iconName: "BookOpen" },

    // Consistency
    { id: "ach-con-7", title: "7-Day Active Streak", description: "Maintained active training consistency for 7 days.", category: "consistency", progress: streak, target: 7, iconName: "Flame" },
    { id: "ach-con-30", title: "30-Day Discipline Streak", description: "30 consecutive days of workout & habit logging.", category: "consistency", progress: streak, target: 30, iconName: "Flame" },
    { id: "ach-con-100", title: "100-Day Iron Discipline", description: "100 consecutive days of unwavering consistency.", category: "consistency", progress: streak, target: 100, iconName: "Flame" },
    { id: "ach-con-365", title: "365-Day Iron Will", description: "Maintained 1% daily improvement for a full year.", category: "consistency", progress: streak, target: 365, iconName: "Flame" },
  ]

  return rawAchievements.map((item) => {
    const unlocked = item.progress >= item.target
    return {
      ...item,
      unlocked,
      unlockedAt: unlocked ? formatDateKey(today) : undefined,
    }
  })
}
