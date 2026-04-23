import { useEffect, useRef, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import type { FirestoreError } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { useAuth } from "../../shared/AuthContext"
import { ReconcileGrades } from "../../academic/application/ReconcileGrades"
import { useEvalColumns } from "../../shared/useEvalColumns"
import type { EvalColumn } from "../../shared/useEvalColumns"
import type { AvatarClass } from "../domain/User"
import type { EvaluationStatus } from "../../academic/domain/Evaluation"

const reconcileGrades = new ReconcileGrades()

export interface GradeEntry { status: EvaluationStatus; score: number }

export interface UserDocument {
  displayName: string
  email: string
  role: "student" | "teacher"
  avatarClass: AvatarClass
  level: number
  xp: number
  xpToNextLevel: number
  gradesSummary: Record<string, GradeEntry>
}

export interface StudentDataResult {
  userData: UserDocument | null
  grades: Record<string, GradeEntry>
  columns: EvalColumn[]
  snapshotError: string | null
  xpGainEvent: { gain: number; seq: number } | null
  levelUpEvent: { prevLevel: number; nextLevel: number } | null
}

export function useStudentData(): StudentDataResult {
  const { user } = useAuth()
  const { columns } = useEvalColumns()
  const [userData, setUserData] = useState<UserDocument | null>(null)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const [xpGainEvent, setXpGainEvent] = useState<{ gain: number; seq: number } | null>(null)
  const [levelUpEvent, setLevelUpEvent] = useState<{ prevLevel: number; nextLevel: number } | null>(null)
  const prevXpRef = useRef<number | null>(null)
  const prevLevelRef = useRef<number | null>(null)
  const xpSeqRef = useRef(0)
  const reconciling = useRef(false)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          const newData = snap.data() as UserDocument
          const next = newData.gradesSummary ?? {}

          const newXp = newData.xp ?? 0
          if (prevXpRef.current !== null && newXp > prevXpRef.current) {
            xpSeqRef.current += 1
            setXpGainEvent({ gain: newXp - prevXpRef.current, seq: xpSeqRef.current })
          }
          prevXpRef.current = newXp

          const newLevel = newData.level ?? 1
          if (prevLevelRef.current !== null && newLevel > prevLevelRef.current) {
            setLevelUpEvent({ prevLevel: prevLevelRef.current, nextLevel: newLevel })
          }
          prevLevelRef.current = newLevel

          setUserData(newData)
          setSnapshotError(null)

          const summaryEmpty = Object.keys(next).length === 0
          const hasProgress = (newData.xp ?? 0) > 0
          if (summaryEmpty && hasProgress && !reconciling.current) {
            reconciling.current = true
            reconcileGrades.execute(snap.id).catch((err) =>
              console.error("[useStudentData] reconcile failed:", err)
            )
          }
        }
      },
      (err: FirestoreError) => {
        console.error("[useStudentData] onSnapshot error:", err.code, err.message)
        setSnapshotError(
          err.code === "permission-denied"
            ? "Sin permisos para acceder a tu perfil. Intentá cerrar sesión y volver a entrar."
            : "Error de conexión. Verificá tu internet e intentá de nuevo."
        )
      }
    )
    return unsub
  }, [user, columns])

  const rawGrades = userData?.gradesSummary ?? {}
  const grades: Record<string, GradeEntry> =
    Object.keys(rawGrades).length === 0
      ? Object.fromEntries(columns.map((c) => [c.key, { status: "Waiting" as EvaluationStatus, score: 0 }]))
      : rawGrades

  return { userData, grades, columns, snapshotError, xpGainEvent, levelUpEvent }
}
