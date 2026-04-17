import { useEffect, useRef, useState } from "react"
import type { EvaluationStatus } from "../domain/Evaluation"
import type { GradeEntry } from "./useTeacherData"
import type { EvalKey } from "./TeacherPanel"
import styles from "./TeacherPanel.module.css"

const STATUS_OPTIONS: EvaluationStatus[] = ["Pending", "Victory", "Defeat"]
const STATUS_LABELS: Record<EvaluationStatus, string> = {
  Victory: "Victoria", Defeat: "Derrota", Pending: "Pendiente",
}
const STATUS_COLORS: Record<EvaluationStatus, { bg: string; text: string }> = {
  Victory: { bg: "#dcfce7", text: "#15803d" },
  Defeat:  { bg: "#fee2e2", text: "#b91c1c" },
  Pending: { bg: "#fef9c3", text: "#854d0e" },
}

export interface CellState {
  saving: boolean
  error: boolean
  pendingStatus?: EvaluationStatus
  pendingScore?: number
}

interface GradeCellProps {
  studentUid: string
  evalKey: EvalKey
  entry: GradeEntry | undefined
  cellState: CellState | undefined
  onCellChange: (uid: string, evalKey: EvalKey, status: EvaluationStatus, score: number) => void
}

export default function GradeCell({ studentUid, evalKey, entry, cellState, onCellChange }: GradeCellProps) {
  const saving = cellState?.saving ?? false
  const error = cellState?.error ?? false
  const committedStatus: EvaluationStatus = entry?.status ?? "Pending"
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

      <select
        className={styles.statusSelect}
        value={displayStatus}
        disabled={saving}
        aria-label={`Estado de ${evalKey}`}
        style={{ color: colors.text, background: colors.bg, borderColor: colors.bg === "#f8fafc" ? "#e2e8f0" : colors.bg }}
        onChange={(e) => onCellChange(studentUid, evalKey, e.target.value as EvaluationStatus, localScore)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      <div className={styles.scoreRow}>
        <span className={styles.scoreLabel}>Nota:</span>
        <input
          type="number"
          className={styles.scoreInput}
          min={0} max={10} step={0.5}
          value={localScore}
          disabled={saving}
          aria-label={`Puntaje de ${evalKey}`}
          onChange={(e) => setLocalScore(Number(e.target.value))}
          onBlur={() => {
            if (localScore !== committedScore)
              onCellChange(studentUid, evalKey, committedStatus, localScore)
          }}
        />
      </div>
    </div>
  )
}
