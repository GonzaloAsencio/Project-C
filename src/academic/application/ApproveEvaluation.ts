import { doc, runTransaction, getDoc } from "firebase/firestore"
import { db } from "../../shared/firebase"
import type { FirestoreEvalRepo } from "../infrastructure/FirestoreEvalRepo"
import type { OutboxService } from "../../shared/OutboxService"

export class ApproveEvaluation {
  private outbox: OutboxService

  constructor(_evalRepo: FirestoreEvalRepo, outbox: OutboxService) {
    this.outbox = outbox
  }

  async execute(evalId: string, score: number): Promise<void> {
    const evalData = await this._getEvalById(evalId)
    if (!evalData) throw new Error(`Evaluation ${evalId} not found`)

    const { studentUid, type, index } = evalData

    // Atomically update evaluation + gradesSummary in user document
    await runTransaction(db, async (tx) => {
      const evalRef = doc(db, "evaluations", evalId)
      const userRef = doc(db, "users", studentUid)

      tx.update(evalRef, { status: "Victory", score })

      const evalKey = `${type === "TP" ? "tp" : "parcial"}${index}`
      tx.update(userRef, {
        [`gradesSummary.${evalKey}`]: { status: "Victory", score },
      })
    })

    // Enqueue the domain event after successful write
    const xpReward = type === "TP" ? 70 : 200
    await this.outbox.enqueue({
      type: "EvaluationApproved",
      evalId,
      studentUid,
      evalType: type,
      evalIndex: index,
      score,
      xpReward,
    })
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
