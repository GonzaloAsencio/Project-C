import { doc, getDoc, runTransaction } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { PlayerProgress } from "../domain/PlayerProgress"

export class FirestoreProgressRepo {
  async getProgress(uid: string): Promise<PlayerProgress> {
    const snap = await getDoc(doc(db, "users", uid))
    if (!snap.exists()) throw new Error(`User document not found for uid: ${uid}`)
    const data = snap.data() as { xp: number; level: number }
    return new PlayerProgress(uid, data.xp ?? 0, data.level ?? 1)
  }

  async saveProgress(progress: PlayerProgress): Promise<void> {
    const xpToNextLevel = (progress.level * 100) - progress.xp
    await runTransaction(db, async (tx) => {
      const ref = doc(db, "users", progress.uid)
      tx.update(ref, {
        xp: progress.xp,
        level: progress.level,
        xpToNextLevel,
      })
    })
  }

  /**
   * Idempotent XP add: uses a Firestore transaction to check if evalId was
   * already processed before applying XP, preventing duplicates across sessions.
   */
  async addXPIdempotent(uid: string, xpReward: number, evalId: string): Promise<void> {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, "users", uid)
      const snap = await tx.get(ref)
      if (!snap.exists()) throw new Error(`User document not found for uid: ${uid}`)

      const data = snap.data() as {
        xp: number
        level: number
        processedEvalIds?: string[]
      }

      const processed = data.processedEvalIds ?? []
      if (processed.includes(evalId)) {
        console.log('[FirestoreProgressRepo] evalId already processed, skipping:', evalId)
        return
      }

      const progress = new PlayerProgress(uid, data.xp ?? 0, data.level ?? 1)
      progress.addXP(xpReward)
      const xpToNextLevel = (progress.level * 100) - progress.xp

      tx.update(ref, {
        xp: progress.xp,
        level: progress.level,
        xpToNextLevel,
        processedEvalIds: [...processed, evalId],
      })
    })
  }
}
