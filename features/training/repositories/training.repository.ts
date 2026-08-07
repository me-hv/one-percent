import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/firestore"
import type { WorkoutSession, PersonalRecord } from "@/lib/types/training.types"

export const trainingRepository = {
  /**
   * Saves a completed workout session to Firestore
   */
  async saveCompletedSession(userId: string, session: WorkoutSession): Promise<void> {
    const sessionRef = doc(db, "users", userId, "sessions", session.id)
    
    // Ensure timestamps are correctly converted if needed
    const finalSession = {
      ...session,
      userId,
      updatedAt: Timestamp.now(),
    }

    await setDoc(sessionRef, finalSession)
  },

  /**
   * Retrieves workout history for a user ordered by date descending
   */
  async getWorkoutHistory(userId: string, limitCount = 50): Promise<WorkoutSession[]> {
    const sessionsRef = collection(db, "users", userId, "sessions")
    const q = query(
      sessionsRef,
      where("status", "==", "completed"),
      orderBy("completedAt", "desc"),
      limit(limitCount)
    )
    
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as WorkoutSession)
  },

  /**
   * Saves a batch of personal records to Firestore
   */
  async savePersonalRecords(userId: string, prs: PersonalRecord[]): Promise<void> {
    if (prs.length === 0) return

    const batch = writeBatch(db)
    
    prs.forEach((pr) => {
      const prRef = doc(db, "users", userId, "prs", pr.id)
      batch.set(prRef, pr)
    })

    await batch.commit()
  },

  /**
   * Retrieves all personal records for a user
   */
  async getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    const prRef = collection(db, "users", userId, "prs")
    const snap = await getDocs(prRef)
    return snap.docs.map((d) => d.data() as PersonalRecord)
  },

  /**
   * Retrieves personal records for a specific exercise
   */
  async getPersonalRecordsByExercise(userId: string, exerciseId: string): Promise<PersonalRecord[]> {
    const prRef = collection(db, "users", userId, "prs")
    const q = query(prRef, where("exerciseId", "==", exerciseId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as PersonalRecord)
  },

  /**
   * Saves or updates a program in Firestore
   */
  async saveProgram(userId: string, program: any): Promise<void> {
    if (!userId) return
    const programRef = doc(db, "users", userId, "programs", program.id)
    await setDoc(programRef, { ...program, userId, updatedAt: Timestamp.now() }, { merge: true })
  },

  /**
   * Fetches user programs from Firestore
   */
  async getUserPrograms(userId: string): Promise<any[]> {
    if (!userId) return []
    const progRef = collection(db, "users", userId, "programs")
    const snap = await getDocs(progRef)
    return snap.docs.map((d) => d.data())
  },

  /**
   * Saves or updates a template in Firestore
   */
  async saveTemplate(userId: string, template: any): Promise<void> {
    if (!userId) return
    const templateRef = doc(db, "users", userId, "templates", template.id)
    await setDoc(templateRef, { ...template, userId, updatedAt: Timestamp.now() }, { merge: true })
  },

  /**
   * Fetches user templates from Firestore
   */
  async getUserTemplates(userId: string): Promise<any[]> {
    if (!userId) return []
    const tmplRef = collection(db, "users", userId, "templates")
    const snap = await getDocs(tmplRef)
    return snap.docs.map((d) => d.data())
  }
}
