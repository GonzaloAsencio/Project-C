import { doc, runTransaction, query, collection, where, getDocs, writeBatch } from "firebase/firestore"
import { db } from "../../shared/firebase"

/**
 * DeleteStudent — Elimina un alumno y todos sus datos relacionados:
 * - Usuario
 * - Evaluaciones
 * - Registros de asistencia
 * - Entradas del outbox relacionadas
 */
export class DeleteStudent {
  async execute(studentUid: string): Promise<void> {
    // First, gather all data to delete in a transaction-safe way
    const [evaluations, attendanceRecords, outboxEntries] = await Promise.all([
      this._getStudentEvaluations(studentUid),
      this._getStudentAttendanceRecords(studentUid),
      this._getStudentOutboxEntries(studentUid),
    ])

    // Perform the deletion in a batch + transaction for safety
    await runTransaction(db, async (tx) => {
      // Delete user document
      const userRef = doc(db, "users", studentUid)
      tx.delete(userRef)

      // Delete all evaluation documents
      for (const evalId of evaluations) {
        const evalRef = doc(db, "evaluations", evalId)
        tx.delete(evalRef)
      }

      // Delete attendance records (remove student from presentStudents, or delete session if empty)
      for (const { classId, presentStudents } of attendanceRecords) {
        const attendanceRef = doc(db, "attendance", classId)
        const updatedPresent = presentStudents.filter((uid) => uid !== studentUid)
        // If the session becomes empty, delete it; otherwise just update the array
        if (updatedPresent.length === 0) {
          tx.delete(attendanceRef)
        } else {
          tx.update(attendanceRef, { presentStudents: updatedPresent })
        }
      }
    })

    // Delete outbox entries in a separate batch (not part of transaction due to size limits)
    if (outboxEntries.length > 0) {
      const batch = writeBatch(db)
      for (const outboxId of outboxEntries) {
        const outboxRef = doc(db, "outbox", outboxId)
        batch.delete(outboxRef)
      }
      await batch.commit()
    }
  }

  private async _getStudentEvaluations(studentUid: string): Promise<string[]> {
    const q = query(collection(db, "evaluations"), where("studentUid", "==", studentUid))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.id)
  }

  private async _getStudentAttendanceRecords(
    studentUid: string
  ): Promise<Array<{ classId: string; presentStudents: string[] }>> {
    const q = query(collection(db, "attendance"), where("presentStudents", "array-contains", studentUid))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({
      classId: d.id,
      presentStudents: d.data().presentStudents || [],
    }))
  }

  private async _getStudentOutboxEntries(studentUid: string): Promise<string[]> {
    // Outbox entries may have studentUid in their payload; this is a simple query
    // For now, we filter in-memory after fetching all outbox (since Firestore doesn't support deep field queries easily)
    const snap = await getDocs(collection(db, "outbox"))
    return snap.docs
      .filter((d) => {
        const payload = d.data().payload || {}
        return payload.studentUid === studentUid
      })
      .map((d) => d.id)
  }
}
