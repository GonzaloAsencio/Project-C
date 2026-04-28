import clsx from "clsx"
import type { EvaluationStatus } from "../../academic/domain/Evaluation"
import type { GradeEntry } from "./useStudentData"
import styles from "./EvalCard.module.css"

const STATUS_LABELS: Record<EvaluationStatus, string> = {
  Victory: "Victoria ✓", Defeat: "Derrota ✗", Pending: "Pendiente…", Waiting: "Esperando…",
}

const STATUS_COLORS: Record<EvaluationStatus, string> = {
  Victory: "#4ade80", Defeat: "#f87171", Pending: "#facc15", Waiting: "#94a3b8",
}

interface EvalCardProps {
  label: string
  entry: GradeEntry | undefined
  isDungeon: boolean
}

export default function EvalCard({ label, entry, isDungeon }: EvalCardProps) {
  const status: EvaluationStatus = entry?.status ?? "Pending"

  return (
    <div className={clsx(styles.card, isDungeon && styles.cardDungeon)}>
      <span className={clsx(styles.label, isDungeon && styles.labelDungeon)}>{label}</span>
      <div className={styles.right}>
        <span
          className={styles.statusBadge}
          style={{ background: STATUS_COLORS[status] }}
        >
          {STATUS_LABELS[status]}
        </span>
        {entry && status !== "Pending" && (
          <span className={styles.score}>{entry.score} / 10</span>
        )}
      </div>
    </div>
  )
}
