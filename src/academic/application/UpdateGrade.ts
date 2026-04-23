import { doc, runTransaction } from "firebase/firestore"
import { db } from "../../shared/firebase"
import type { EvaluationStatus } from "../domain/Evaluation"

function toEvalKey(type: "TP" | "Parcial", index: number): string {
  return `${type === "TP" ? "tp" : "parcial"}${index}`
}

export function parseEvalId(evalId: string): { studentUid: string; type: "TP" | "Parcial"; index: number } | null {
  const match = evalId.match(/^(.+)_(tp|parcial)(\d+)$/)
  if (!match) return null
  const [, studentUid, typeKey, indexStr] = match
  return {
    studentUid,
    type: typeKey === "tp" ? "TP" : "Parcial",
    index: parseInt(indexStr, 10),
  }
}

export class UpdateGrade {
  constructor() {}

  async execute(evalId: string, status: EvaluationStatus, score: number): Promise<void> {
    const meta = parseEvalId(evalId)
    if (!meta) throw new Error(`Invalid evalId format: ${evalId}`)

    const { studentUid, type, index } = meta
    const evalKey = toEvalKey(type, index)

    // Atomically update evaluation doc + gradesSummary in user doc
    await runTransaction(db, async (tx) => {
      const evalRef = doc(db, "evaluations", evalId)
      const userRef = doc(db, "users", studentUid)

      tx.set(evalRef, { studentUid, type, index, status, score }, { merge: true })
      tx.update(userRef, {
        [`gradesSummary.${evalKey}`]: { status, score },
      })
    })

  }
}
