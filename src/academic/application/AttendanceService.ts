import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore"
import type { FirestoreError } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { FirestoreProgressRepo } from "../../gamification/infrastructure/FirestoreProgressRepo"

export interface ClassSession {
  id: string
  date: Date
  createdBy: string
  presentStudents: string[]
  selfRegistration: boolean
  windowStart?: Date
  windowEnd?: Date
}

const ATTENDANCE_XP = 20

function mapSession(d: { id: string; data: () => Record<string, unknown> }): ClassSession {
  const data = d.data()
  return {
    id: d.id,
    date: (data.date as Timestamp).toDate(),
    createdBy: data.createdBy as string,
    presentStudents: (data.presentStudents as string[]) ?? [],
    selfRegistration: (data.selfRegistration as boolean) ?? false,
    windowStart: data.windowStart ? (data.windowStart as Timestamp).toDate() : undefined,
    windowEnd: data.windowEnd ? (data.windowEnd as Timestamp).toDate() : undefined,
  }
}

export class AttendanceService {
  private progressRepo: FirestoreProgressRepo

  constructor(progressRepo: FirestoreProgressRepo) {
    this.progressRepo = progressRepo
  }

  async createSession(
    teacherUid: string,
    sessionDate: Date,
    selfRegistration = false,
    windowStart?: Date,
    windowEnd?: Date,
  ): Promise<string> {
    const payload: Record<string, unknown> = {
      date: Timestamp.fromDate(sessionDate),
      createdBy: teacherUid,
      presentStudents: [],
      selfRegistration,
    }
    if (selfRegistration && windowStart && windowEnd) {
      payload.windowStart = Timestamp.fromDate(windowStart)
      payload.windowEnd = Timestamp.fromDate(windowEnd)
    }
    const ref = await addDoc(collection(db, "attendance"), payload)
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

  /** Marks all given students as present and awards XP idempotently to each. */
  async markAllPresent(classId: string, studentUids: string[]): Promise<void> {
    await updateDoc(doc(db, "attendance", classId), {
      presentStudents: studentUids,
    })
    await Promise.all(
      studentUids.map((uid) =>
        this.progressRepo.addXPIdempotent(uid, ATTENDANCE_XP, `${classId}_${uid}`),
      ),
    )
  }

  /** Clears presentStudents to []. XP is NOT revoked. */
  async clearAllPresent(classId: string): Promise<void> {
    await updateDoc(doc(db, "attendance", classId), { presentStudents: [] })
  }

  /** Deletes the session document entirely. XP is NOT revoked. */
  async deleteSession(classId: string): Promise<void> {
    await deleteDoc(doc(db, "attendance", classId))
  }

  /**
   * Called from the student's client to self-register attendance.
   * Uses arrayUnion to avoid a read-before-write.
   */
  async markSelfPresent(classId: string, studentUid: string): Promise<void> {
    await updateDoc(doc(db, "attendance", classId), {
      presentStudents: arrayUnion(studentUid),
    })
    await this.progressRepo.addXPIdempotent(studentUid, ATTENDANCE_XP, `${classId}_${studentUid}`)
  }

  /** Subscribe to all sessions ordered by date descending. */
  subscribeToSessions(
    onUpdate: (sessions: ClassSession[]) => void,
    onError?: (err: FirestoreError) => void,
  ): () => void {
    const q = query(collection(db, "attendance"), orderBy("date", "desc"))
    return onSnapshot(
      q,
      (snap) => {
        onUpdate(snap.docs.map(mapSession))
      },
      (err) => {
        console.error("[AttendanceService] onSnapshot error:", err.code, err.message)
        onError?.(err)
      },
    )
  }

  /**
   * Subscribes to today's session that has selfRegistration enabled.
   * Filters client-side to avoid a composite Firestore index.
   */
  subscribeToTodayActiveSession(
    onUpdate: (session: ClassSession | null) => void,
    onError?: (err: FirestoreError) => void,
  ): () => void {
    // Query only selfRegistration sessions so the security rule (selfRegistration == true)
    // is provably satisfied for every returned document — avoids a Firestore query rejection.
    // Date filtering is done client-side.
    const q = query(
      collection(db, "attendance"),
      where("selfRegistration", "==", true),
    )

    return onSnapshot(
      q,
      (snap) => {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        const active =
          snap.docs
            .map(mapSession)
            .find((s) => s.date >= startOfDay && s.date <= endOfDay) ?? null
        onUpdate(active)
      },
      (err) => {
        console.error("[AttendanceService] subscribeToTodayActiveSession error:", err.code, err.message)
        onError?.(err)
      },
    )
  }
}
