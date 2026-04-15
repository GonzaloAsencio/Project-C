import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { Evaluation } from "../domain/Evaluation"
import type { EvaluationStatus } from "../domain/Evaluation"

interface EvaluationDocument {
  studentUid: string
  type: "TP" | "Parcial"
  index: number
  status: EvaluationStatus
  score: number
}

export class FirestoreEvalRepo {
  async getEvaluations(studentUid: string): Promise<Evaluation[]> {
    const q = query(
      collection(db, "evaluations"),
      where("studentUid", "==", studentUid)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => {
      const data = d.data() as EvaluationDocument
      return new Evaluation(d.id, data.studentUid, data.type, data.index, data.status, data.score)
    })
  }

  async updateEvaluation(
    evalId: string,
    update: { status: EvaluationStatus; score: number }
  ): Promise<void> {
    await updateDoc(doc(db, "evaluations", evalId), {
      status: update.status,
      score: update.score,
    })
  }
}
