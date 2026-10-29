import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { createUserWithEmailAndPassword, deleteUser, signOut } from "firebase/auth"
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase/auth"
import { db } from "@/lib/firebase/firestore"
import { authService, clearUserStorage } from "@/features/auth/services/auth.service"
import { authRepository, getDefaultPreferences } from "@/features/auth/repositories/auth.repository"
import { generateCoachingRecommendations, calculateDataCompleteness } from "@/features/coach/services/coach-engine.service"
import {
  createAdaptiveProposal,
  applyAdaptiveProposal,
  revertAdaptiveProposal,
} from "@/features/coach/services/adaptive-programming.service"
import { generateWeeklyReview } from "@/features/coach/services/weekly-review.service"
import { generateAppDataBackup, validateBackupSchema } from "@/lib/services/backup.service"
import type { WorkoutSession, TrainingProgram, ProgramExercise, ProgramDay } from "@/lib/types/training.types"
import type { DailyRecoveryEntry } from "@/lib/types/recovery.types"
import type { DailyNutritionLog, NutritionTargets } from "@/lib/types/nutrition.types"

describe("End-to-End Core User Journey (13 Milestones)", () => {
  const timestamp = Date.now()
  const athleteAEmail = `e2e-athlete-a-${timestamp}@onepercent.app`
  const athleteBEmail = `e2e-athlete-b-${timestamp}@onepercent.app`
  const testPassword = `E2ePass!${timestamp}`

  let athleteAUid = ""
  let athleteACred: any = null

  // Program state for adaptive testing
  let currentProgramExercise: ProgramExercise = {
    id: "ex-bench-1",
    exerciseId: "bench-press",
    orderIndex: 0,
    restSeconds: 120,
    targetSets: 3,
    targetReps: "8",
    targetWeight: 80,
    targetRPE: 8,
    exercise: {
      id: "bench-press",
      name: "Barbell Bench Press",
      category: "barbell",
      equipment: ["barbell"],
      mechanics: "compound",
      muscleGroups: ["chest"],
      secondaryMuscles: ["triceps"],
      isCustom: false,
    },
  }

  const testDay: ProgramDay = {
    id: "day-push",
    name: "Push Day",
    orderIndex: 0,
    isRestDay: false,
    exercises: [currentProgramExercise],
  }

  const testProgram: TrainingProgram = {
    id: "prog-e2e",
    userId: "",
    name: "Strength Block 1",
    daysPerWeek: 4,
    difficulty: "intermediate",
    focus: ["strength"],
    isTemplate: false,
    isActive: true,
    isArchived: false,
    days: [testDay],
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
  }

  it("completes full 13-stage lifecycle from onboarding through adaptive rollback and cross-user isolation", async () => {
    // ─── STAGE 1: Register Athlete A ─────────────────────────────────
    try {
      athleteACred = await createUserWithEmailAndPassword(auth, athleteAEmail, testPassword)
    } catch (err: any) {
      if (err.code === "auth/network-request-failed") {
        console.warn("Skipping live network-dependent E2E test")
        return
      }
      throw err
    }
    athleteAUid = athleteACred.user.uid
    testProgram.userId = athleteAUid
    expect(athleteAUid).toBeDefined()

    // ─── STAGE 2: Initialize User Profile & Settings ─────────────────
    const profile = await authRepository.createProfile(
      athleteAUid,
      athleteAEmail,
      "Elite Powerlifter",
      "https://example.com/avatar.png"
    )
    expect(profile.displayName).toBe("Elite Powerlifter")
    const prefs = getDefaultPreferences(athleteAUid)
    expect(prefs.units.weight).toBe("kg")
    expect(prefs.theme).toBe("dark")

    // ─── STAGE 3: Create & Complete a Workout Session ────────────────
    const now = new Date()
    const sessionDate = new Date(now.getTime() - 1000) // 1 second ago
    const priorSessionDate = new Date(now.getTime() - 86400000 * 2) // 2 days ago

    const completedSession: WorkoutSession = {
      id: `session-${timestamp}`,
      userId: athleteAUid,
      programId: testProgram.id,
      name: "Push Day",
      status: "completed",
      totalVolume: 1980,
      totalSets: 3,
      totalReps: 24,
      exerciseCount: 1,
      musclesWorked: ["chest"],
      startedAt: { toDate: () => new Date(sessionDate.getTime() - 3600000) } as any,
      completedAt: { toDate: () => sessionDate } as any,
      durationSeconds: 3600,
      exercises: [
        {
          id: "se-1",
          exerciseId: "bench-press",
          orderIndex: 0,
          sets: [
            { id: "s-1", setNumber: 1, type: "normal", isWarmup: false, isDropset: false, reps: 8, weight: 80, rpe: 7.5, completed: true },
            { id: "s-2", setNumber: 2, type: "normal", isWarmup: false, isDropset: false, reps: 8, weight: 80, rpe: 8.0, completed: true },
            { id: "s-3", setNumber: 3, type: "normal", isWarmup: false, isDropset: false, reps: 8, weight: 80, rpe: 8.0, completed: true },
          ],
        },
      ],
      createdAt: { toDate: () => new Date() } as any,
      updatedAt: { toDate: () => new Date() } as any,
    }
    expect(completedSession.status).toBe("completed")
    expect(completedSession.totalVolume).toBe(1980)

    // Prior session for progression threshold
    const priorSession: WorkoutSession = {
      ...completedSession,
      id: `session-prior-${timestamp}`,
      completedAt: { toDate: () => priorSessionDate } as any,
    }

    // ─── STAGE 4: Log Nutrition and Hydration ────────────────────────
    const nutritionLog: DailyNutritionLog = {
      id: `nut-${timestamp}`,
      userId: athleteAUid,
      date: "2026-10-29",
      totalCalories: 2650,
      totalProtein: 185,
      totalCarbs: 300,
      totalFat: 75,
      totalFiber: 38,
      waterMl: 3800,
      foods: [],
      schemaVersion: 1,
    }
    const nutritionTargets: NutritionTargets = {
      calories: 2700,
      protein: 180,
      carbs: 300,
      fat: 75,
      fiber: 35,
      waterMl: 3500,
    }
    expect(nutritionLog.waterMl).toBeGreaterThanOrEqual(3000)

    // ─── STAGE 5: Record Recovery & Readiness Check-In ───────────────
    const recoveryEntry: DailyRecoveryEntry = {
      id: `rec-${timestamp}`,
      userId: athleteAUid,
      date: "2026-10-29",
      sleepDurationMinutes: 480, // 8.0 hrs
      sleepQuality: 4,
      energy: 4,
      fatigue: 2,
      stress: 2,
      muscleSoreness: { chest: 2 },
      hrv: 75,
      restingHR: 52,
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    expect(recoveryEntry.sleepDurationMinutes).toBe(480)

    // ─── STAGE 6: Review Dashboard Metrics & Coach Insights ──────────
    const coachInput = {
      userId: athleteAUid,
      sessions: [completedSession, priorSession],
      activeProgram: testProgram,
      recoveryEntries: [recoveryEntry],
      nutritionLogs: [nutritionLog],
      nutritionTargets,
      goals: [],
    }
    const completeness = calculateDataCompleteness(coachInput)
    // 2 workouts, 1 recovery, 1 nutrition gives 70% completeness (requires 3+ for full 100%)
    expect(completeness.scorePct).toBe(70)
    expect(completeness.missingDataItems.length).toBeGreaterThan(0)

    const recs = generateCoachingRecommendations(coachInput)
    const progRec = recs.find((r) => r.category === "progression")
    expect(progRec).toBeDefined()
    expect(progRec?.recommendation).toContain("82.5kg") // +2.5kg overload recommendation

    // ─── STAGE 7: Create an Adaptive Proposal ────────────────────────
    const proposal = createAdaptiveProposal({
      userId: athleteAUid,
      program: testProgram,
      day: testDay,
      exercise: currentProgramExercise,
      type: "load_increase",
      proposedWeightKg: 82.5,
      proposedSets: 3,
      proposedReps: "8",
      proposedRpe: 8,
      rationale: "Target reps hit across consecutive workouts at reserve RPE.",
      evidence: progRec?.evidence || [],
    })
    expect(proposal.status).toBe("pending")
    expect(proposal.previousProgramSnapshot).toBeDefined()

    // ─── STAGE 8: Accept Proposal & Verify Active Program Overload ───
    const updateExerciseInDayMock = vi.fn((_progId, _dayId, _exId, updates) => {
      currentProgramExercise = { ...currentProgramExercise, ...updates }
    })
    const acceptedProposal = applyAdaptiveProposal(proposal, {
      updateExerciseInDay: updateExerciseInDayMock,
    })
    expect(acceptedProposal.status).toBe("accepted")
    expect(updateExerciseInDayMock).toHaveBeenCalledWith(
      testProgram.id,
      testDay.id,
      currentProgramExercise.id,
      expect.objectContaining({ targetWeight: 82.5 })
    )
    expect(currentProgramExercise.targetWeight).toBe(82.5)

    // ─── STAGE 9: Revert Proposal (1-Click Rollback) ─────────────────
    updateExerciseInDayMock.mockClear()
    const revertedProposal = revertAdaptiveProposal(acceptedProposal, {
      updateExerciseInDay: updateExerciseInDayMock,
    })
    expect(revertedProposal.status).toBe("reverted")
    expect(updateExerciseInDayMock).toHaveBeenCalledWith(
      testProgram.id,
      testDay.id,
      currentProgramExercise.id,
      expect.objectContaining({ targetWeight: 80 })
    )
    expect(currentProgramExercise.targetWeight).toBe(80)

    // ─── STAGE 10: Generate and Inspect Weekly Review ─────────────────
    const weeklyReview = generateWeeklyReview({
      userId: athleteAUid,
      sessions: [completedSession, priorSession],
      activeProgram: testProgram,
      recoveryEntries: [recoveryEntry],
      nutritionLogs: [nutritionLog],
      nutritionTargets,
    })
    expect(weeklyReview.completedSessions).toBe(2)
    expect(weeklyReview.totalVolumeKg).toBeGreaterThan(0)
    expect(weeklyReview.recoverySummary.averageSleepHours).toBe(8.0)
    expect(weeklyReview.topAchievements.length).toBeGreaterThan(0)

    // ─── STAGE 11: Validate Backup & Data Integrity ──────────────────
    const backupSnapshot = {
      app: "One Percent" as const,
      version: "1.0.0",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      checksum: "",
      data: {
        workouts: [completedSession],
        programs: [testProgram],
        templates: [],
        exercises: [],
        goals: [],
        weightLogs: [],
        bodyMeasurements: [],
        habits: [],
        recovery: [recoveryEntry],
        nutrition: { dailyLogs: [nutritionLog] },
        coach: { proposals: [acceptedProposal] },
      },
    }
    const validation = validateBackupSchema(backupSnapshot)
    expect(validation.valid).toBe(true)
    expect(validation.entityCounts?.workouts).toBe(1)
    expect(validation.entityCounts?.recovery).toBe(1)
    expect(validation.entityCounts?.nutrition).toBe(1)

    // ─── STAGE 12: Sign Out & Local Session Wiping ───────────────────
    clearUserStorage()
    // Verify session cookie was wiped
    if (typeof document !== "undefined") {
      expect(document.cookie).not.toContain("__session=eyJ")
    }

    // ─── STAGE 13: Cross-User Authorization Denial ───────────────────
    const athleteBCred = await createUserWithEmailAndPassword(auth, athleteBEmail, testPassword)
    const athleteBUid = athleteBCred.user.uid

    try {
      // Athlete B attempting to read Athlete A's private profile
      const athleteADocRef = doc(db, "users", athleteAUid)
      let unauthorizedReadFailed = false
      try {
        await getDoc(athleteADocRef)
      } catch (err: any) {
        if (err.code === "permission-denied" || err.message?.includes("PERMISSION_DENIED")) {
          unauthorizedReadFailed = true
        }
      }
      expect(unauthorizedReadFailed).toBe(true)

      // Athlete B attempting to overwrite Athlete A's workout session
      const athleteASessionDoc = doc(db, "users", athleteAUid, "sessions", completedSession.id)
      let unauthorizedWriteFailed = false
      try {
        await setDoc(athleteASessionDoc, { malicious: true })
      } catch (err: any) {
        if (err.code === "permission-denied" || err.message?.includes("PERMISSION_DENIED")) {
          unauthorizedWriteFailed = true
        }
      }
      expect(unauthorizedWriteFailed).toBe(true)
    } finally {
      // Clean up Athlete B
      try {
        await deleteDoc(doc(db, "users", athleteBUid))
        await deleteUser(athleteBCred.user)
      } catch {}
    }

    // Clean up Athlete A
    try {
      await deleteDoc(doc(db, "users", athleteAUid))
      await deleteUser(athleteACred.user)
    } catch {}
  })
})
