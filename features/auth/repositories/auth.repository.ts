import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firestore"
import type { UserProfile, UserPreferences } from "@/lib/types/user.types"
import { Timestamp } from "firebase/firestore"

export const authRepository = {
  /**
   * Retrieves a user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", userId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    return snap.data() as UserProfile
  },

  /**
   * Creates or updates a user profile document
   */
  async createProfile(userId: string, email: string, displayName: string): Promise<UserProfile> {
    const profile: UserProfile = {
      id: userId,
      uid: userId,
      email,
      displayName,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      onboardingCompleted: false,
      plan: "free",
      planStatus: "active",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      locale: typeof navigator !== "undefined" ? navigator.language : "en-US",
      features: {},
    }

    await setDoc(doc(db, "users", userId), profile)
    return profile
  },

  /**
   * Updates an existing user profile partially
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, "users", userId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  },

  /**
   * Retrieves user preferences by ID
   */
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const docRef = doc(db, "preferences", userId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    return snap.data() as UserPreferences
  },

  /**
   * Creates default preferences document for a user
   */
  async createPreferences(userId: string): Promise<UserPreferences> {
    const preferences: UserPreferences = {
      userId,
      units: {
        weight: "kg",
        distance: "km",
        height: "cm",
        length: "cm",
      },
      theme: "dark",
      startOfWeek: 1, // Monday
      dashboardWidgets: [
        { id: "widget-briefing", type: "coach_briefing", position: 0, visible: true },
        { id: "widget-streak", type: "streak", position: 1, visible: true },
        { id: "widget-training", type: "training_summary", position: 2, visible: true },
        { id: "widget-nutrition", type: "todays_nutrition", position: 3, visible: true },
      ],
      sidebarCollapsed: false,
      notifications: {
        workoutReminders: true,
        workoutReminderTime: "08:00",
        habitReminders: true,
        weeklyDigest: true,
        prAlerts: true,
        goalUpdates: true,
        coachMessages: true,
        streakAlerts: true,
      },
    }

    await setDoc(doc(db, "preferences", userId), preferences)
    return preferences
  },

  /**
   * Updates user preferences partially
   */
  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<void> {
    const docRef = doc(db, "preferences", userId)
    await updateDoc(docRef, updates)
  },
}
