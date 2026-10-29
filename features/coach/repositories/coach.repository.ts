import { collection, doc, setDoc, getDocs, getDoc, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/firestore"
import type { AdaptiveProposal, WeeklyCoachingReview, CoachingRecommendation } from "../types/coach.types"

export const coachRepository = {
  /**
   * Saves an adaptive programming proposal to Firestore
   */
  async saveProposal(userId: string, proposal: AdaptiveProposal): Promise<void> {
    if (!userId) return
    const docRef = doc(db, "users", userId, "proposals", proposal.id)
    await setDoc(docRef, proposal, { merge: true })
  },

  /**
   * Retrieves past adaptive proposals for an athlete
   */
  async getProposals(userId: string, limitCount = 20): Promise<AdaptiveProposal[]> {
    if (!userId) return []
    const colRef = collection(db, "users", userId, "proposals")
    const q = query(colRef, orderBy("createdAt", "desc"), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as AdaptiveProposal)
  },

  /**
   * Saves a weekly coaching review document
   */
  async saveWeeklyReview(userId: string, review: WeeklyCoachingReview): Promise<void> {
    if (!userId) return
    const docRef = doc(db, "users", userId, "weeklyReviews", review.id)
    await setDoc(docRef, review, { merge: true })
  },

  /**
   * Retrieves saved weekly reviews
   */
  async getWeeklyReviews(userId: string, limitCount = 12): Promise<WeeklyCoachingReview[]> {
    if (!userId) return []
    const colRef = collection(db, "users", userId, "weeklyReviews")
    const q = query(colRef, orderBy("weekEndDate", "desc"), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as WeeklyCoachingReview)
  },
}
