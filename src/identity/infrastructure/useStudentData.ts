import { useEffect, useRef, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import type { FirestoreError } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { useAuth } from "../../shared/AuthContext"
import type { AvatarClass } from "../domain/User"
import type { EvaluationStatus } from "../../academic/domain/Evaluation"

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

export const EVAL_KEYS = ["tp1", "tp2", "parcial1", "parcial2"] as const
export type EvalKey = typeof EVAL_KEYS[number]

export const EVAL_LABELS: Record<EvalKey, string> = {
  tp1: "TP 1", tp2: "TP 2", parcial1: "Parcial 1", parcial2: "Parcial 2",
}

export interface StudentDataResult {
  userData: UserDocument | null
  grades: Record<string, GradeEntry>
  overlay: { type: "victory" | "defeat"; label: string } | null
  setOverlay: (v: { type: "victory" | "defeat"; label: string } | null) => void
  victoryAnim: boolean
  setVictoryAnim: (v: boolean) => void
  snapshotError: string | null
}

export function useStudentData(): StudentDataResult {
  const { user } = useAuth()
  const [userData, setUserData] = useState<UserDocument | null>(null)
  const [victoryAnim, setVictoryAnim] = useState(false)
  const [overlay, setOverlay] = useState<{ type: "victory" | "defeat"; label: string } | null>(null)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const prevGradesRef = useRef<Record<string, GradeEntry>>({})

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          const newData = snap.data() as UserDocument
          const prev = prevGradesRef.current
          const next = newData.gradesSummary ?? {}

          for (const key of EVAL_KEYS) {
            const prevStatus = prev[key]?.status
            const nextStatus = next[key]?.status
            if (prevStatus === "Pending" && nextStatus === "Victory") {
              setOverlay({ type: "victory", label: EVAL_LABELS[key] })
              import("canvas-confetti").then((m) =>
                m.default({ particleCount: 180, spread: 100, origin: { y: 0.5 } })
              )
              break
            }
            if (prevStatus === "Pending" && nextStatus === "Defeat") {
              setOverlay({ type: "defeat", label: EVAL_LABELS[key] })
              break
            }
          }

          prevGradesRef.current = next
          setUserData(newData)
          setSnapshotError(null)
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
  }, [user])

  const rawGrades = userData?.gradesSummary ?? {}
  const grades: Record<string, GradeEntry> =
    Object.keys(rawGrades).length === 0
      ? Object.fromEntries(EVAL_KEYS.map((k) => [k, { status: "Pending" as EvaluationStatus, score: 0 }]))
      : rawGrades

  return { userData, grades, overlay, setOverlay, victoryAnim, setVictoryAnim, snapshotError }
}
