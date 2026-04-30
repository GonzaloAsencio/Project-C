import type { EvaluationStatus } from "../domain/Evaluation"
import { Eye, Trash2 } from "lucide-react"
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
  onDeleteStudent: (student: StudentDocument) => void
}

export default function StudentRow({ student, columns, cellStates, onCellChange, onViewDetails, onDeleteStudent }: StudentRowProps) {
  const grades = student.gradesSummary ?? {}

  return (
    <tr>
      <td>
        <div className={styles.studentInfo}>
          <div>
            <div className={styles.studentName}>{student.displayName || student.email}</div>
            <div className={styles.studentEmail}>{student.email}</div>
          </div>
        </div>
      </td>
      <td><span className={styles.levelBadge}>{student.level ?? 1}</span></td>
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
        <div className={styles.actionButtons}>
          <button
            className={styles.actionIconBtn}
            onClick={() => onViewDetails(student)}
            aria-label={`Ver detalles de ${student.displayName || student.email}`}
            data-tooltip="Ver detalles"
          >
            <Eye size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            className={styles.actionIconBtn}
            onClick={() => onDeleteStudent(student)}
            aria-label={`Eliminar ${student.displayName || student.email}`}
            data-tooltip="Eliminar alumno"
          >
            <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  )
}
