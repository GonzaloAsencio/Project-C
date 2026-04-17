import { useEffect, useState } from "react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import type { FirestoreError } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { attendanceService } from "../../shared/services"
import type { EvaluationStatus } from "../domain/Evaluation"
import type { ClassSession } from "../application/AttendanceService"

export interface GradeEntry { status: EvaluationStatus; score: number }

export interface StudentDocument {
  uid: string
  displayName: string
  email: string
  level: number
  xp: number
  gradesSummary: Record<string, GradeEntry>
}

export interface TeacherDataResult {
  students: StudentDocument[]
  sessions: ClassSession[]
  loading: boolean
  studentsError: string | null
  attendanceError: string | null
}

export function useTeacherData(): TeacherDataResult {
  const [students, setStudents] = useState<StudentDocument[]>([])
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [loading, setLoading] = useState(true)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "student"))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setStudents(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<StudentDocument, "uid">) })))
        setLoading(false)
        setStudentsError(null)
      },
      (err: FirestoreError) => {
        console.error("[useTeacherData] students error:", err.code, err.message)
        setLoading(false)
        setStudentsError(
          err.code === "permission-denied"
            ? "Sin permisos para ver los alumnos. Verificá tu rol."
            : "Error de conexión al cargar alumnos."
        )
      }
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = attendanceService.subscribeToSessions(
      (s) => { setSessions(s); setAttendanceError(null) },
      (err: FirestoreError) => {
        console.error("[useTeacherData] attendance error:", err.code, err.message)
        setAttendanceError(
          err.code === "permission-denied"
            ? "Sin permisos para ver las clases."
            : "Error de conexión al cargar asistencia."
        )
      }
    )
    return unsub
  }, [])

  return { students, sessions, loading, studentsError, attendanceError }
}
