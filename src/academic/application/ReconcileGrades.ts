import { collection, doc, getDocs, query, runTransaction, where } from "firebase/firestore"
import { db } from "../../shared/firebase"
import type { EvaluationStatus } from "../domain/Evaluation"

interface GradeEntry { status: EvaluationStatus; score: number }

function evalIdToKey(type: "TP" | "Parcial", index: number): string {
  return `${type === "TP" ? "tp" : "parcial"}${index}`
}

/**
 * Rebuilds gradesSummary from the evaluations collection for a given student.
 * Column-agnostic: derives all keys from the actual evaluation documents found.
 */
export class ReconcileGrades {
  async execute(studentUid: string): Promise<void> {
    const evalSnap = await getDocs(
      query(collection(db, "evaluations"), where("studentUid", "==", studentUid))
    )

    if (evalSnap.empty) return

    const rebuilt: Record<string, GradeEntry> = {}
    for (const d of evalSnap.docs) {
      const data = d.data() as { type: "TP" | "Parcial"; index: number; status: EvaluationStatus; score: number }
      const key = evalIdToKey(data.type, data.index)
      rebuilt[key] = { status: data.status, score: data.score ?? 0 }
    }

    await runTransaction(db, async (tx) => {
      const userRef = doc(db, "users", studentUid)
      const userSnap = await tx.get(userRef)
      if (!userSnap.exists()) return

      const current = (userSnap.data().gradesSummary ?? {}) as Record<string, GradeEntry>
      const keys = Object.keys(rebuilt)

      const hasDiff = keys.some(
        (k) =>
          current[k]?.status !== rebuilt[k]?.status ||
          current[k]?.score !== rebuilt[k]?.score
      )

      if (!hasDiff) return

      console.log("[ReconcileGrades] Patching gradesSummary for", studentUid)
      tx.update(userRef, { gradesSummary: rebuilt })
    })
  }
}
