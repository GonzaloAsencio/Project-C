import { useCallback, useEffect, useRef, useState } from "react"
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  query,
  startAfter,
  where,
} from "firebase/firestore"
import type { DocumentSnapshot, FirestoreError, QueryDocumentSnapshot } from "firebase/firestore"
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

const PAGE_SIZE = 20

export interface TeacherDataResult {
  students: StudentDocument[]
  filteredStudents: StudentDocument[]
  sessions: ClassSession[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  studentsError: string | null
  attendanceError: string | null
  filterText: string
  setFilterText: (v: string) => void
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

function docToStudent(d: QueryDocumentSnapshot): StudentDocument {
  return { uid: d.id, ...(d.data() as Omit<StudentDocument, "uid">) }
}

function sortByName(students: StudentDocument[]): StudentDocument[] {
  return [...students].sort((a, b) =>
    (a.displayName ?? a.email).localeCompare(b.displayName ?? b.email, "es")
  )
}

export function useTeacherData(materiaId: string): TeacherDataResult {
  const [students, setStudents] = useState<StudentDocument[]>([])
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [filterText, setFilterText] = useState("")

  const lastVisibleRef = useRef<DocumentSnapshot | null>(null)

  const baseQuery = useCallback(() =>
    query(
      collection(db, "users"),
      where("role", "==", "student"),
      where("materiaId", "==", materiaId),
      limit(PAGE_SIZE)
    ), [materiaId])

  const fetchFirstPage = useCallback(async () => {
    setLoading(true)
    setStudentsError(null)
    try {
      const snap = await getDocs(baseQuery())
      lastVisibleRef.current = snap.docs[snap.docs.length - 1] ?? null
      setStudents(sortByName(snap.docs.map(docToStudent)))
      setHasMore(snap.docs.length === PAGE_SIZE)
    } catch (err) {
      const fe = err as FirestoreError
      console.error("[useTeacherData] fetch error:", fe.code, fe.message)
      setStudentsError(
        fe.code === "permission-denied"
          ? "Sin permisos para ver los alumnos. Verificá tu rol."
          : "Error de conexión al cargar alumnos."
      )
    } finally {
      setLoading(false)
    }
  }, [baseQuery])

  const loadMore = useCallback(async () => {
    if (!lastVisibleRef.current || loadingMore) return
    setLoadingMore(true)
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("materiaId", "==", materiaId),
        startAfter(lastVisibleRef.current),
        limit(PAGE_SIZE)
      )
      const snap = await getDocs(q)
      lastVisibleRef.current = snap.docs[snap.docs.length - 1] ?? lastVisibleRef.current
      setStudents((prev) => sortByName([...prev, ...snap.docs.map(docToStudent)]))
      setHasMore(snap.docs.length === PAGE_SIZE)
    } catch (err) {
      const fe = err as FirestoreError
      console.error("[useTeacherData] loadMore error:", fe.code, fe.message)
      setStudentsError("Error al cargar más alumnos.")
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore])

  useEffect(() => { fetchFirstPage() }, [fetchFirstPage])

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "users"), where("role", "==", "student"), where("materiaId", "==", materiaId)),
      (snap) => {
        // Only applies updates to already-loaded students (no new pages fetched)
        setStudents((prev) => {
          if (prev.length === 0) return prev
          const updatedMap = new Map(snap.docs.map((d) => [d.id, docToStudent(d)]))
          return sortByName(prev.map((s) => updatedMap.get(s.uid) ?? s))
        })
      },
      (err: FirestoreError) => {
        console.error("[useTeacherData] realtime update error:", err.code)
      }
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = attendanceService.subscribeToSessions(
      materiaId,
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

  const filteredStudents = filterText.trim()
    ? students.filter((s) =>
        (s.displayName ?? "").toLowerCase().includes(filterText.toLowerCase()) ||
        s.email.toLowerCase().includes(filterText.toLowerCase())
      )
    : students

  return {
    students,
    filteredStudents,
    sessions,
    loading,
    loadingMore,
    hasMore,
    studentsError,
    attendanceError,
    filterText,
    setFilterText,
    loadMore,
    refresh: fetchFirstPage,
  }
}
