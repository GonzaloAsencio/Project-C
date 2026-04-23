import type { EvaluationStatus } from "../../academic/domain/Evaluation"

export const STUDENT_EVAL_SEED = [
  { key: "tp1", type: "TP", index: 1 },
  { key: "tp2", type: "TP", index: 2 },
  { key: "parcial1", type: "Parcial", index: 1 },
  { key: "parcial2", type: "Parcial", index: 2 },
] as const

export interface BaseUserDoc {
  displayName: string
  email: string
  level: number
  xp: number
  xpToNextLevel: number
  gradesSummary: Record<string, { status: EvaluationStatus; score: number }>
  processedEvalIds: string[]
}

export function buildStudentUserDoc(input: { displayName: string; email: string }) {
  const { displayName, email } = input
  return {
    displayName,
    email,
    role: "student" as const,
    avatarClass: null,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    gradesSummary: {},
    processedEvalIds: [],
  }
}

export function buildTeacherUserDoc(input: { displayName: string; email: string }) {
  const { displayName, email } = input
  return {
    displayName,
    email,
    role: "teacher" as const,
    avatarClass: null,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    gradesSummary: {},
    processedEvalIds: [],
  }
}

export function buildStudentEvaluationDocs(uid: string) {
  return STUDENT_EVAL_SEED.map((ev) => ({
    id: `${uid}_${ev.key}`,
    data: {
      studentUid: uid,
      type: ev.type,
      index: ev.index,
      status: "Pending" as const,
      score: 0,
    },
  }))
}

export function isValidTemporaryPassword(password: string): boolean {
  return password.trim().length >= 6
}
