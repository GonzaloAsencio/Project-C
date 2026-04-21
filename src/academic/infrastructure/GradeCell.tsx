import { useEffect, useRef, useState } from "react"
import type { EvaluationStatus } from "../domain/Evaluation"
import type { GradeEntry } from "./useTeacherData"
import styles from "./TeacherPanel.module.css"

const STATUS_OPTIONS: EvaluationStatus[] = ["Waiting", "Pending", "Victory", "Defeat"]
const STATUS_LABELS: Record<EvaluationStatus, string> = {
  Victory: "Victoria", Defeat: "Derrota", Pending: "Pendiente", Waiting: "Sin rendir",
}
const STATUS_COLORS: Record<EvaluationStatus, { bg: string; text: string }> = {
  Victory: { bg: "#dcfce7", text: "#15803d" },
  Defeat:  { bg: "#fee2e2", text: "#b91c1c" },
  Pending: { bg: "#fef9c3", text: "#854d0e" },
  Waiting: { bg: "#f1f5f9", text: "#64748b" },
}

export interface CellState {
  saving: boolean
  error: boolean
  pendingStatus?: EvaluationStatus
  pendingScore?: number
}

interface GradeCellProps {
  studentUid: string
  evalKey: string
  entry: GradeEntry | undefined
  cellState: CellState | undefined
  onCellChange: (uid: string, evalKey: string, status: EvaluationStatus, score: number) => void
}

export default function GradeCell({ studentUid, evalKey, entry, cellState, onCellChange }: GradeCellProps) {
  const saving = cellState?.saving ?? false
  const error = cellState?.error ?? false
  const committedStatus: EvaluationStatus = entry?.status ?? "Waiting"
  const committedScore = entry?.score ?? 0
  const [localScore, setLocalScore] = useState(committedScore)
  const prevScore = useRef(committedScore)

  useEffect(() => {
    if (committedScore !== prevScore.current) {
      setLocalScore(committedScore)
      prevScore.current = committedScore
    }
  }, [committedScore])

  const displayStatus: EvaluationStatus =
    saving && cellState?.pendingStatus ? cellState.pendingStatus : committedStatus
  const colors = STATUS_COLORS[displayStatus]

  return (
    <div className={styles.gradeCell}>
      {saving ? (
        <span className={styles.saving}>⏳ Guardando…</span>
      ) : error ? (
        <span className={styles.error}>⚠️ Error al guardar</span>
      ) : null}

      <div className={styles.gradeCellRow}>
        <input
          type="number"
          className={styles.scoreInput}
          min={0} max={10} step={0.5}
          value={localScore}
          disabled={saving}
          aria-label={`Puntaje de ${evalKey}`}
          onChange={(e) => setLocalScore(Number(e.target.value))}
          onBlur={() => {
            if (localScore !== committedScore) {
              const autoStatus: EvaluationStatus = localScore >= 4 ? "Victory" : "Defeat"
              onCellChange(studentUid, evalKey, autoStatus, localScore)
            }
          }}
        />
        <select
          className={styles.statusSelect}
          value={displayStatus}
          disabled={saving}
          aria-label={`Estado de ${evalKey}`}
          style={{ color: colors.text, background: colors.bg }}
          onChange={(e) => onCellChange(studentUid, evalKey, e.target.value as EvaluationStatus, localScore)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
