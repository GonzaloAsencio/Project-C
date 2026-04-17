import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore"
import { db } from "../../shared/firebase"
import { FirestoreProgressRepo } from "../../gamification/infrastructure/FirestoreProgressRepo"

export interface ClassSession {
  id: string
  date: Date
  createdBy: string
  presentStudents: string[]
}

const ATTENDANCE_XP = 20

export class AttendanceService {
  private progressRepo: FirestoreProgressRepo

  constructor(progressRepo: FirestoreProgressRepo) {
    this.progressRepo = progressRepo
  }

  /** Creates a new class session document for the given classId (course). */
  async createSession(teacherUid: string): Promise<string> {
    const ref = await addDoc(collection(db, "attendance"), {
      date: Timestamp.now(),
      createdBy: teacherUid,
      presentStudents: [],
    })
    return ref.id
  }

  /**
   * Marks a student as present in a session and awards +20 XP idempotently.
   * evalId = `{classId}_{studentUid}` ensures no duplicate XP.
   */
  async markPresent(classId: string, studentUid: string): Promise<void> {
    const sessionRef = doc(db, "attendance", classId)
    const snap = await getDoc(sessionRef)
    if (!snap.exists()) throw new Error(`Session ${classId} not found`)

    const present: string[] = snap.data().presentStudents ?? []
    if (!present.includes(studentUid)) {
      await updateDoc(sessionRef, {
        presentStudents: [...present, studentUid],
      })
    }

    // Idempotent XP: evalId = classId_studentUid
    const evalId = `${classId}_${studentUid}`
    await this.progressRepo.addXPIdempotent(studentUid, ATTENDANCE_XP, evalId)
  }

  /**
   * Marks a student as absent (removes from presentStudents).
   * XP is NOT revoked — idempotency prevents re-awarding if re-checked.
   */
  async markAbsent(classId: string, studentUid: string): Promise<void> {
    const sessionRef = doc(db, "attendance", classId)
    const snap = await getDoc(sessionRef)
    if (!snap.exists()) return

    const present: string[] = snap.data().presentStudents ?? []
    await updateDoc(sessionRef, {
      presentStudents: present.filter((uid) => uid !== studentUid),
    })
  }

  /** Subscribe to all sessions ordered by date descending. */
  subscribeToSessions(
    onUpdate: (sessions: ClassSession[]) => void
  ): () => void {
    const q = query(collection(db, "attendance"), orderBy("date", "desc"))
    return onSnapshot(q, (snap) => {
      const sessions: ClassSession[] = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          date: (data.date as Timestamp).toDate(),
          createdBy: data.createdBy as string,
          presentStudents: (data.presentStudents as string[]) ?? [],
        }
      })
      onUpdate(sessions)
    })
  }
}
