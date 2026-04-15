import { useEffect, useState } from "react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { eventBus } from "../../shared/EventBus"
import { OutboxService } from "../../shared/OutboxService"
import { ApproveEvaluation } from "../application/ApproveEvaluation"
import { FirestoreEvalRepo } from "./FirestoreEvalRepo"
import type { EvaluationStatus } from "../domain/Evaluation"

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeEntry {
  status: EvaluationStatus
  score: number
}

interface StudentDocument {
  uid: string
  displayName: string
  email: string
  level: number
  xp: number
  gradesSummary: Record<string, GradeEntry>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVAL_KEYS = ["tp1", "tp2", "parcial1", "parcial2"] as const
type EvalKey = typeof EVAL_KEYS[number]

const EVAL_LABELS: Record<EvalKey, string> = {
  tp1: "TP 1",
  tp2: "TP 2",
  parcial1: "Parcial 1",
  parcial2: "Parcial 2",
}

// Columns hidden on sm (only show name, level, xp + tp1 on mobile)
const HIDDEN_SM: Record<EvalKey, boolean> = {
  tp1: false,
  tp2: true,
  parcial1: true,
  parcial2: true,
}

const STATUS_OPTIONS: EvaluationStatus[] = ["Pending", "Victory", "Defeat"]

const STATUS_COLORS: Record<EvaluationStatus, string> = {
  Victory: "#4ade80",
  Defeat: "#f87171",
  Pending: "#facc15",
}

// ─── Use case singleton ───────────────────────────────────────────────────────

const _outbox = new OutboxService(db, eventBus)
const approveEvalUC = new ApproveEvaluation(new FirestoreEvalRepo(), _outbox)

// ─── Cell saving state ────────────────────────────────────────────────────────

type CellKey = string // `${uid}-${evalKey}`

interface CellState {
  saving: boolean
  error: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherPanel() {
  const [students, setStudents] = useState<StudentDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [cellStates, setCellStates] = useState<Record<CellKey, CellState>>({})

  // ── Firestore real-time subscription (students only) ──────────────────────
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "student"))
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<StudentDocument, "uid">),
      }))
      setStudents(docs)
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Grade update handler ──────────────────────────────────────────────────
  async function handleGradeChange(
    studentUid: string,
    evalKey: EvalKey,
    evalId: string,
    newStatus: EvaluationStatus,
    currentScore: number
  ) {
    if (newStatus !== "Victory") return // only Victory triggers ApproveEvaluation

    const cellKey: CellKey = `${studentUid}-${evalKey}`
    setCellStates((prev) => ({ ...prev, [cellKey]: { saving: true, error: false } }))

    try {
      await approveEvalUC.execute(evalId, currentScore)
      setCellStates((prev) => ({ ...prev, [cellKey]: { saving: false, error: false } }))
    } catch {
      setCellStates((prev) => ({ ...prev, [cellKey]: { saving: false, error: true } }))
      // Auto-clear error after 3s
      setTimeout(() => {
        setCellStates((prev) => ({ ...prev, [cellKey]: { saving: false, error: false } }))
      }, 3000)
    }
  }

  async function handleScoreChange(
    studentUid: string,
    evalKey: EvalKey,
    evalId: string,
    newScore: number
  ) {
    const cellKey: CellKey = `${studentUid}-${evalKey}`
    setCellStates((prev) => ({ ...prev, [cellKey]: { saving: true, error: false } }))

    try {
      await approveEvalUC.execute(evalId, newScore)
      setCellStates((prev) => ({ ...prev, [cellKey]: { saving: false, error: false } }))
    } catch {
      setCellStates((prev) => ({ ...prev, [cellKey]: { saving: false, error: true } }))
      setTimeout(() => {
        setCellStates((prev) => ({ ...prev, [cellKey]: { saving: false, error: false } }))
      }, 3000)
    }
  }

  if (loading) {
    return (
      <div className="tp-loading" role="status" aria-live="polite">
        Cargando panel del profesor…
      </div>
    )
  }

  return (
    <>
      <style>{`
        /* ── Root ───────────────────────────────────────────────────── */
        .tp-root {
          width: 100%;
          min-height: 100svh;
          box-sizing: border-box;
          padding: 1rem;
          background: var(--bg, #fff);
          color: var(--text-h, #08060d);
          font-family: inherit;
        }

        .tp-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--text-h, #08060d);
        }

        /* ── Table wrapper: horizontal scroll on sm ─────────────────── */
        .tp-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 10px;
          border: 1px solid var(--border, #e5e4e7);
        }

        /* ── Table ──────────────────────────────────────────────────── */
        .tp-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 480px;
          font-size: 0.875rem;
        }

        .tp-table th,
        .tp-table td {
          padding: 0.625rem 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border, #e5e4e7);
          white-space: nowrap;
        }

        .tp-table th {
          background: var(--code-bg, #f4f3ec);
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text, #6b6375);
        }

        .tp-table tr:last-child td {
          border-bottom: none;
        }

        .tp-table tr:hover td {
          background: var(--code-bg, #f4f3ec);
        }

        /* ── Hide non-critical columns on sm ────────────────────────── */
        .tp-col-sm-hidden {
          display: none;
        }

        @media (min-width: 768px) {
          .tp-col-sm-hidden {
            display: table-cell;
          }
          .tp-root {
            padding: 2rem;
          }
          .tp-title {
            font-size: 1.5rem;
          }
        }

        /* ── Editable cell ──────────────────────────────────────────── */
        .tp-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 120px;
        }

        /* Minimum 44×44px touch target */
        .tp-select,
        .tp-score-input {
          min-height: 44px;
          min-width: 44px;
          padding: 0.375rem 0.5rem;
          border-radius: 6px;
          border: 1px solid var(--border, #e5e4e7);
          background: #fff;
          font-size: 0.875rem;
          cursor: pointer;
          box-sizing: border-box;
          width: 100%;
        }

        .tp-select:focus,
        .tp-score-input:focus {
          outline: 2px solid var(--accent, #aa3bff);
          outline-offset: 1px;
        }

        /* ── Status badge ───────────────────────────────────────────── */
        .tp-status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #000;
        }

        /* ── Cell feedback ──────────────────────────────────────────── */
        .tp-cell-saving {
          font-size: 0.7rem;
          color: var(--text, #6b6375);
          font-style: italic;
        }

        .tp-cell-error {
          font-size: 0.7rem;
          color: #ef4444;
          font-weight: 600;
        }

        /* ── Loading ────────────────────────────────────────────────── */
        .tp-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100svh;
          font-size: 1rem;
          color: var(--text, #6b6375);
        }

        /* ── Empty state ────────────────────────────────────────────── */
        .tp-empty {
          padding: 2rem;
          text-align: center;
          color: var(--text, #6b6375);
          font-size: 0.9rem;
        }
      `}</style>

      <div className="tp-root">
        <h1 className="tp-title">Panel del Profesor</h1>

        <div className="tp-table-wrap" role="region" aria-label="Tabla de alumnos" tabIndex={0}>
          <table className="tp-table">
            <thead>
              <tr>
                <th scope="col">Alumno</th>
                <th scope="col">Nivel</th>
                <th scope="col">XP</th>
                {EVAL_KEYS.map((key) => (
                  <th
                    key={key}
                    scope="col"
                    className={HIDDEN_SM[key] ? "tp-col-sm-hidden" : undefined}
                  >
                    {EVAL_LABELS[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3 + EVAL_KEYS.length}>
                    <div className="tp-empty">No hay alumnos registrados.</div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <StudentRow
                    key={student.uid}
                    student={student}
                    cellStates={cellStates}
                    onGradeChange={handleGradeChange}
                    onScoreChange={handleScoreChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ─── StudentRow ───────────────────────────────────────────────────────────────

interface StudentRowProps {
  student: StudentDocument
  cellStates: Record<CellKey, CellState>
  onGradeChange: (
    uid: string,
    evalKey: EvalKey,
    evalId: string,
    status: EvaluationStatus,
    score: number
  ) => void
  onScoreChange: (uid: string, evalKey: EvalKey, evalId: string, score: number) => void
}

function StudentRow({ student, cellStates, onGradeChange, onScoreChange }: StudentRowProps) {
  const grades = student.gradesSummary ?? {}

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 600 }}>{student.displayName || student.email}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text, #6b6375)" }}>{student.email}</div>
      </td>
      <td>{student.level ?? 1}</td>
      <td>{student.xp ?? 0}</td>

      {EVAL_KEYS.map((key) => {
        const entry = grades[key] as GradeEntry | undefined
        const cellKey: CellKey = `${student.uid}-${key}`
        const cellState = cellStates[cellKey]
        // evalId convention: `${uid}_${key}` — matches how evaluations are stored
        const evalId = `${student.uid}_${key}`

        return (
          <td
            key={key}
            className={HIDDEN_SM[key] ? "tp-col-sm-hidden" : undefined}
          >
            <GradeCell
              evalId={evalId}
              studentUid={student.uid}
              evalKey={key}
              entry={entry}
              cellState={cellState}
              onGradeChange={onGradeChange}
              onScoreChange={onScoreChange}
            />
          </td>
        )
      })}
    </tr>
  )
}

// ─── GradeCell ────────────────────────────────────────────────────────────────

interface GradeCellProps {
  evalId: string
  studentUid: string
  evalKey: EvalKey
  entry: GradeEntry | undefined
  cellState: CellState | undefined
  onGradeChange: (
    uid: string,
    evalKey: EvalKey,
    evalId: string,
    status: EvaluationStatus,
    score: number
  ) => void
  onScoreChange: (uid: string, evalKey: EvalKey, evalId: string, score: number) => void
}

function GradeCell({
  evalId,
  studentUid,
  evalKey,
  entry,
  cellState,
  onGradeChange,
  onScoreChange,
}: GradeCellProps) {
  const status: EvaluationStatus = entry?.status ?? "Pending"
  const score = entry?.score ?? 0
  const saving = cellState?.saving ?? false
  const error = cellState?.error ?? false

  return (
    <div className="tp-cell">
      {saving ? (
        <>
          <span
            className="tp-status-badge"
            style={{ background: STATUS_COLORS[status] }}
          >
            {status}
          </span>
          <span className="tp-cell-saving" aria-live="polite">guardando…</span>
        </>
      ) : error ? (
        <>
          <span
            className="tp-status-badge"
            style={{ background: STATUS_COLORS[status] }}
          >
            {status}
          </span>
          <span className="tp-cell-error" role="alert">No se pudo guardar</span>
        </>
      ) : (
        <>
          <select
            className="tp-select"
            value={status}
            aria-label={`Estado de ${evalKey} para alumno`}
            onChange={(e) =>
              onGradeChange(
                studentUid,
                evalKey,
                evalId,
                e.target.value as EvaluationStatus,
                score
              )
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="number"
            className="tp-score-input"
            min={0}
            max={10}
            step={0.5}
            value={score}
            aria-label={`Puntaje de ${evalKey} para alumno`}
            onChange={(e) =>
              onScoreChange(studentUid, evalKey, evalId, Number(e.target.value))
            }
          />
        </>
      )}
    </div>
  )
}
