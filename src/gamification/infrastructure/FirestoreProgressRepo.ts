import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { PlayerProgress } from "../domain/PlayerProgress"

export class FirestoreProgressRepo {
  async getProgress(uid: string): Promise<PlayerProgress> {
    const snap = await getDoc(doc(db, "users", uid))
    const data = snap.data() as { xp: number; level: number }
    return new PlayerProgress(uid, data.xp, data.level)
  }

  async saveProgress(progress: PlayerProgress): Promise<void> {
    await updateDoc(doc(db, "users", progress.uid), {
      xp: progress.xp,
      level: progress.level,
    })
  }
}
