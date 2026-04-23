import { doc, runTransaction, getDoc } from "firebase/firestore"
import { db } from "../../shared/firebase"
import type { FirestoreEvalRepo } from "../infrastructure/FirestoreEvalRepo"

export class ApproveEvaluation {
  constructor(_evalRepo: FirestoreEvalRepo) {}

  async execute(evalId: string, score: number): Promise<void> {
    const evalData = await this._getEvalById(evalId)
    if (!evalData) throw new Error(`Evaluation ${evalId} not found`)

    const { studentUid, type, index } = evalData

    // Atomically update evaluation + gradesSummary in user document
    await runTransaction(db, async (tx) => {
      const evalRef = doc(db, "evaluations", evalId)
      const userRef = doc(db, "users", studentUid)

      // Use set+merge so it works even if the eval doc doesn't exist yet
      tx.set(evalRef, { status: "Victory", score }, { merge: true })

      const evalKey = `${type === "TP" ? "tp" : "parcial"}${index}`
      tx.update(userRef, {
        [`gradesSummary.${evalKey}`]: { status: "Victory", score },
      })
    })

    // Enqueue the domain event after successful write
  }

  private async _getEvalById(
    evalId: string
  ): Promise<{ studentUid: string; type: "TP" | "Parcial"; index: number } | null> {
    const snap = await getDoc(doc(db, "evaluations", evalId))
    if (!snap.exists()) return null
    const data = snap.data() as { studentUid: string; type: "TP" | "Parcial"; index: number }
    return { studentUid: data.studentUid, type: data.type, index: data.index }
  }
}
