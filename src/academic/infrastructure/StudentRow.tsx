import type { EvaluationStatus } from "../domain/Evaluation"
import type { StudentDocument } from "./useTeacherData"
import type { EvalColumn } from "../../shared/useEvalColumns"
import GradeCell, { type CellState } from "./GradeCell"
import styles from "./TeacherPanel.module.css"

interface StudentRowProps {
  student: StudentDocument
  columns: EvalColumn[]
  cellStates: Record<string, CellState>
  onCellChange: (uid: string, evalKey: string, status: EvaluationStatus, score: number) => void
  onViewDetails: (student: StudentDocument) => void
}

export default function StudentRow({ student, columns, cellStates, onCellChange, onViewDetails }: StudentRowProps) {
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
      {columns.map((col) => (
        <td key={col.key}>
          <GradeCell
            studentUid={student.uid}
            evalKey={col.key}
            entry={grades[col.key]}
            cellState={cellStates[`${student.uid}-${col.key}`]}
            onCellChange={onCellChange}
          />
        </td>
      ))}
      <td>
        <button className={styles.detailBtn} onClick={() => onViewDetails(student)}>
          Ver detalles
        </button>
      </td>
    </tr>
  )
}
