import { useEffect } from "react"
import clsx from "clsx"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { StudentDocument } from "./useTeacherData"
import type { EvaluationStatus } from "../domain/Evaluation"
import { useEvalColumns } from "../../shared/useEvalColumns"
import styles from "./StudentDetailModal.module.css"

const STATUS_COLORS: Record<EvaluationStatus, string> = {
  Victory: "#4ade80", Defeat: "#f87171", Pending: "#facc15",
}
const STATUS_LABELS: Record<EvaluationStatus, string> = {
  Victory: "Victoria", Defeat: "Derrota", Pending: "Pendiente",
}
const EVAL_ROW_CLASS: Record<EvaluationStatus, string> = {
  Victory: styles.evalRowVictory,
  Defeat:  styles.evalRowDefeat,
  Pending: styles.evalRowPending,
}

interface Props {
  student: StudentDocument
  onClose: () => void
}

export default function StudentDetailModal({ student, onClose }: Props) {
  const { columns } = useEvalColumns()

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const grades = student.gradesSummary ?? {}
  const initials = (student.displayName || student.email).slice(0, 2).toUpperCase()

  const chartData = columns.map((col) => ({
    name: col.label,
    score: grades[col.key]?.status === "Pending" ? 0 : (grades[col.key]?.score ?? 0),
    status: (grades[col.key]?.status ?? "Pending") as EvaluationStatus,
  }))

  const victories = columns.filter((c) => grades[c.key]?.status === "Victory").length
  const avgScore = (() => {
    const graded = columns.filter((c) => grades[c.key]?.status !== "Pending" && grades[c.key] != null)
    if (!graded.length) return "—"
    const avg = graded.reduce((sum, c) => sum + (grades[c.key]?.score ?? 0), 0) / graded.length
    return avg.toFixed(1)
  })()

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalles de ${student.displayName || student.email}`}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <p className={styles.name}>{student.displayName || student.email}</p>
              <p className={styles.email}>{student.email}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statChip}>
            <span className={styles.statValue}>⭐ {student.level ?? 1}</span>
            <span className={styles.statLabel}>Nivel</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statValue}>{student.xp ?? 0}</span>
            <span className={styles.statLabel}>XP Total</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statValue}>{victories}/{columns.length}</span>
            <span className={styles.statLabel}>Victorias</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statValue}>{avgScore}</span>
            <span className={styles.statLabel}>Promedio</span>
          </div>
        </div>

        {/* Chart */}
        <div className={styles.chartSection}>
          <p className={styles.sectionTitle}>Notas por evaluación</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                formatter={(value, _name, props) => {
                  const status = props.payload?.status as EvaluationStatus
                  if (status === "Pending") return ["Pendiente", ""]
                  return [`${value} / 10`, "Nota"]
                }}
                contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Eval list */}
        <div className={styles.evalList}>
          <p className={styles.sectionTitle}>Detalle</p>
          {columns.map((col) => {
            const entry = grades[col.key]
            const status: EvaluationStatus = entry?.status ?? "Pending"
            return (
              <div key={col.key} className={clsx(styles.evalRow, EVAL_ROW_CLASS[status])}>
                <span className={styles.evalName}>{col.label}</span>
                <div className={styles.evalRight}>
                  {status !== "Pending" && (
                    <span className={styles.evalScore}>{entry?.score ?? 0} / 10</span>
                  )}
                  <span
                    className={styles.evalBadge}
                    style={{ background: STATUS_COLORS[status] }}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
