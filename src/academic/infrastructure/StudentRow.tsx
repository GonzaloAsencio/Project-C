import type { EvaluationStatus } from "../domain/Evaluation"
import type { StudentDocument } from "./useTeacherData"
import type { EvalKey } from "./TeacherPanel"
import GradeCell, { type CellState } from "./GradeCell"
import styles from "./TeacherPanel.module.css"

const EVAL_KEYS = ["tp1", "tp2", "parcial1", "parcial2"] as const
const EVAL_LABELS: Record<EvalKey, string> = {
  tp1: "TP 1", tp2: "TP 2", parcial1: "Parcial 1", parcial2: "Parcial 2",
}
const HIDDEN_SM: Record<EvalKey, boolean> = {
  tp1: false, tp2: true, parcial1: true, parcial2: true,
}

interface StudentRowProps {
  student: StudentDocument
  cellStates: Record<string, CellState>
  onCellChange: (uid: string, evalKey: EvalKey, status: EvaluationStatus, score: number) => void
}

export default function StudentRow({ student, cellStates, onCellChange }: StudentRowProps) {
  const grades = student.gradesSummary ?? {}
  const initials = (student.displayName || student.email).slice(0, 2).toUpperCase()

  return (
    <tr>
      <td>
        <div className={styles.studentInfo}>
          <div className={styles.studentAvatar}>{initials}</div>
          <div>
            <div className={styles.studentName}>{student.displayName || student.email}</div>
            <div className={styles.studentEmail}>{student.email}</div>
          </div>
        </div>
      </td>
      <td><span className={styles.levelBadge}>⭐ {student.level ?? 1}</span></td>
      <td><span className={styles.xpValue}>{student.xp ?? 0} XP</span></td>
      {EVAL_KEYS.map((key) => (
        <td key={key} className={HIDDEN_SM[key] ? styles.colSmHidden : undefined}>
          <GradeCell
            studentUid={student.uid}
            evalKey={key}
            entry={grades[key]}
            cellState={cellStates[`${student.uid}-${key}`]}
            onCellChange={onCellChange}
          />
        </td>
      ))}
    </tr>
  )
}

export { EVAL_KEYS, EVAL_LABELS, HIDDEN_SM }
