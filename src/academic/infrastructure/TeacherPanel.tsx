import { useEffect, useState } from "react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { outboxService } from "../../shared/services"
import { UpdateGrade } from "../application/UpdateGrade"
import type { EvaluationStatus } from "../domain/Evaluation"

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

const EVAL_KEYS = ["tp1", "tp2", "parcial1", "parcial2"] as const
type EvalKey = typeof EVAL_KEYS[number]

const EVAL_LABELS: Record<EvalKey, string> = {
  tp1: "TP 1", tp2: "TP 2", parcial1: "Parcial 1", parcial2: "Parcial 2",
}

const HIDDEN_SM: Record<EvalKey, boolean> = {
  tp1: false, tp2: true, parcial1: true, parcial2: true,
}

const STATUS_OPTIONS: EvaluationStatus[] = ["Pending", "Victory", "Defeat"]

const STATUS_COLORS: Record<EvaluationStatus, string> = {
  Victory: "#4ade80", Defeat: "#f87171", Pending: "#facc15",
}

const STATUS_LABELS: Record<EvaluationStatus, string> = {
  Victory: "Victoria", Defeat: "Derrota", Pending: "Pendiente",
}

const updateGradeUC = new UpdateGrade(outboxService)

type CellKey = string

interface CellState {
  saving: boolean
  error: boolean
  pendingStatus?: EvaluationStatus
  pendingScore?: number
}

export default function TeacherPanel() {
  const [students, setStudents] = useState<StudentDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [cellStates, setCellStates] = useState<Record<CellKey, CellState>>({})

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

  async function handleCellChange(
    studentUid: string,
    evalKey: EvalKey,
    newStatus: EvaluationStatus,
    newScore: number
  ) {
    const cellKey: CellKey = `${studentUid}-${evalKey}`
    const evalId = `${studentUid}_${evalKey}`

    setCellStates((prev) => ({
      ...prev,
      [cellKey]: { saving: true, error: false, pendingStatus: newStatus, pendingScore: newScore },
    }))

    try {
      await updateGradeUC.execute(evalId, newStatus, newScore)
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
        .tp-root { 
          width:100%; min-height:100svh; box-sizing:border-box; padding:1.5rem; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family:inherit; 
        }
        .tp-header {
          max-width: 1400px;
          margin: 0 auto 2rem;
          text-align: center;
        }
        .tp-title { 
          font-size:2rem; font-weight:800; margin-bottom:0.5rem; 
          color: #fff;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .tp-subtitle {
          font-size: 1rem;
          color: rgba(255,255,255,0.9);
          font-weight: 500;
        }
        .tp-table-wrap { 
          max-width: 1400px;
          margin: 0 auto;
          overflow-x:auto; 
          -webkit-overflow-scrolling:touch; 
          border-radius:16px; 
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          background: #fff;
        }
        .tp-table { 
          width:100%; 
          border-collapse:collapse; 
          min-width:700px; 
          font-size:0.9rem; 
        }
        .tp-table th, .tp-table td { 
          padding:1rem 1.25rem; 
          text-align:left; 
          border-bottom:1px solid #e5e7eb; 
        }
        .tp-table th { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-weight:700; 
          font-size:0.85rem; 
          text-transform:uppercase; 
          letter-spacing:0.08em; 
          color: #fff;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .tp-table tbody tr { 
          transition: background 0.2s ease;
        }
        .tp-table tbody tr:hover { 
          background: #f9fafb;
        }
        .tp-table tr:last-child td { border-bottom:none; }
        .tp-col-sm-hidden { display:none; }
        @media (min-width:768px) { 
          .tp-col-sm-hidden { display:table-cell; } 
          .tp-root { padding:2.5rem; } 
          .tp-title { font-size:2.5rem; } 
        }
        .tp-cell { 
          display:flex; 
          flex-direction:column; 
          gap:0.5rem; 
          min-width:160px; 
        }
        .tp-cell-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .tp-select { 
          flex: 1;
          min-height:44px; 
          padding:0.5rem 0.75rem; 
          border-radius:8px; 
          border:2px solid #e5e7eb; 
          background:#fff; 
          font-size:0.875rem; 
          font-weight: 600;
          cursor:pointer; 
          box-sizing:border-box; 
          transition: all 0.2s ease;
        }
        .tp-select:hover {
          border-color: #9ca3af;
        }
        .tp-select:focus { 
          outline:none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .tp-score-input { 
          width: 70px;
          min-height:44px; 
          padding:0.5rem; 
          border-radius:8px; 
          border:2px solid #e5e7eb; 
          background:#fff; 
          font-size:0.875rem; 
          font-weight: 600;
          text-align: center;
          box-sizing:border-box; 
          transition: all 0.2s ease;
        }
        .tp-score-input:hover {
          border-color: #9ca3af;
        }
        .tp-score-input:focus { 
          outline:none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .tp-score-label {
          font-size: 0.7rem;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tp-cell-saving { 
          font-size:0.75rem; 
          color:#667eea; 
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .tp-cell-saving::before {
          content: "⏳";
        }
        .tp-cell-error { 
          font-size:0.75rem; 
          color:#ef4444; 
          font-weight:600; 
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .tp-cell-error::before {
          content: "⚠️";
        }
        .tp-student-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: #111827;
          margin-bottom: 0.25rem;
        }
        .tp-student-email {
          font-size: 0.8rem;
          color: #6b7280;
        }
        .tp-stat {
          font-weight: 700;
          font-size: 1.1rem;
          color: #111827;
        }
        .tp-loading { 
          display:flex; 
          flex-direction: column;
          align-items:center; 
          justify-content:center; 
          min-height:100svh; 
          font-size:1.2rem; 
          color:#fff;
          gap: 1rem;
        }
        .tp-loading::before {
          content: "⏳";
          font-size: 3rem;
        }
        .tp-empty { 
          padding:3rem 2rem; 
          text-align:center; 
          color:#6b7280; 
          font-size:1rem; 
        }
      `}</style>

      <div className="tp-root">
        <div className="tp-header">
          <h1 className="tp-title">Panel del Profesor</h1>
          <p className="tp-subtitle">Gestión de evaluaciones y progreso de alumnos</p>
        </div>
        <div className="tp-table-wrap" role="region" aria-label="Tabla de alumnos" tabIndex={0}>
          <table className="tp-table">
            <thead>
              <tr>
                <th scope="col">Alumno</th>
                <th scope="col">Nivel</th>
                <th scope="col">XP</th>
                {EVAL_KEYS.map((key) => (
                  <th key={key} scope="col" className={HIDDEN_SM[key] ? "tp-col-sm-hidden" : undefined}>
                    {EVAL_LABELS[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3 + EVAL_KEYS.length}>
                    <div className="tp-empty">
                      No hay alumnos registrados.
                      <br />
                      <small>Los alumnos aparecerán aquí cuando se registren en la plataforma.</small>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <StudentRow
                    key={student.uid}
                    student={student}
                    cellStates={cellStates}
                    onCellChange={handleCellChange}
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

interface StudentRowProps {
  student: StudentDocument
  cellStates: Record<CellKey, CellState>
  onCellChange: (uid: string, evalKey: EvalKey, status: EvaluationStatus, score: number) => void
}

function StudentRow({ student, cellStates, onCellChange }: StudentRowProps) {
  const grades = student.gradesSummary ?? {}
  return (
    <tr>
      <td>
        <div className="tp-student-name">{student.displayName || student.email}</div>
        <div className="tp-student-email">{student.email}</div>
      </td>
      <td><span className="tp-stat">{student.level ?? 1}</span></td>
      <td><span className="tp-stat">{student.xp ?? 0}</span></td>
      {EVAL_KEYS.map((key) => {
        const entry = grades[key] as GradeEntry | undefined
        const cellKey: CellKey = `${student.uid}-${key}`
        return (
          <td key={key} className={HIDDEN_SM[key] ? "tp-col-sm-hidden" : undefined}>
            <GradeCell
              studentUid={student.uid}
              evalKey={key}
              entry={entry}
              cellState={cellStates[cellKey]}
              onCellChange={onCellChange}
            />
          </td>
        )
      })}
    </tr>
  )
}

interface GradeCellProps {
  studentUid: string
  evalKey: EvalKey
  entry: GradeEntry | undefined
  cellState: CellState | undefined
  onCellChange: (uid: string, evalKey: EvalKey, status: EvaluationStatus, score: number) => void
}

function GradeCell({ studentUid, evalKey, entry, cellState, onCellChange }: GradeCellProps) {
  const saving = cellState?.saving ?? false
  const error = cellState?.error ?? false
  const status: EvaluationStatus = (saving && cellState?.pendingStatus) ? cellState.pendingStatus : (entry?.status ?? "Pending")
  const score = (saving && cellState?.pendingScore !== undefined) ? cellState.pendingScore : (entry?.score ?? 0)

  return (
    <div className="tp-cell">
      {saving ? (
        <span className="tp-cell-saving" aria-live="polite">Guardando cambios...</span>
      ) : error ? (
        <span className="tp-cell-error" role="alert">Error al guardar</span>
      ) : null}
      
      <select
        className="tp-select"
        value={status}
        aria-label={`Estado de ${evalKey}`}
        disabled={saving}
        onChange={(e) => onCellChange(studentUid, evalKey, e.target.value as EvaluationStatus, score)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      
      <div className="tp-cell-row">
        <span className="tp-score-label">Nota:</span>
        <input
          type="number"
          className="tp-score-input"
          min={0}
          max={10}
          step={0.5}
          value={score}
          disabled={saving}
          aria-label={`Puntaje de ${evalKey}`}
          onChange={(e) => onCellChange(studentUid, evalKey, status, Number(e.target.value))}
        />
      </div>
    </div>
  )
}
