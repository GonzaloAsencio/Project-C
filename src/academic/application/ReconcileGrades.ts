import { collection, doc, getDocs, query, runTransaction, where } from "firebase/firestore"
import { db } from "../../shared/firebase"
import type { EvaluationStatus } from "../domain/Evaluation"

interface GradeEntry { status: EvaluationStatus; score: number }

const EVAL_KEYS = ["tp1", "tp2", "parcial1", "parcial2"] as const

function evalIdToKey(type: "TP" | "Parcial", index: number): string {
  return `${type === "TP" ? "tp" : "parcial"}${index}`
}

/**
 * Rebuilds gradesSummary from the evaluations collection for a given student.
 * Only runs if a discrepancy is detected (empty summary but XP > 0, or
 * evaluations exist that aren't reflected in the summary).
 */
export class ReconcileGrades {
  async execute(studentUid: string): Promise<void> {
    // Fetch all evaluation docs for this student
    const evalSnap = await getDocs(
      query(collection(db, "evaluations"), where("studentUid", "==", studentUid))
    )

    if (evalSnap.empty) return

    // Build the expected gradesSummary from evaluations collection
    const rebuilt: Record<string, GradeEntry> = Object.fromEntries(
      EVAL_KEYS.map((k) => [k, { status: "Pending" as EvaluationStatus, score: 0 }])
    )

    for (const d of evalSnap.docs) {
      const data = d.data() as { type: "TP" | "Parcial"; index: number; status: EvaluationStatus; score: number }
      const key = evalIdToKey(data.type, data.index)
      if (key in rebuilt) {
        rebuilt[key] = { status: data.status, score: data.score ?? 0 }
      }
    }

    // Compare with current gradesSummary and patch if different
    await runTransaction(db, async (tx) => {
      const userRef = doc(db, "users", studentUid)
      const userSnap = await tx.get(userRef)
      if (!userSnap.exists()) return

      const current = (userSnap.data().gradesSummary ?? {}) as Record<string, GradeEntry>

      const hasDiff = EVAL_KEYS.some(
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
