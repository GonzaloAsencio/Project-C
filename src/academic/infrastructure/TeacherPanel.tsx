import { useEffect, useRef, useState } from "react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { outboxService, attendanceService } from "../../shared/services"
import { UpdateGrade } from "../application/UpdateGrade"
import { useLogout } from "../../shared/useLogout"
import { useAuth } from "../../shared/AuthContext"
import type { EvaluationStatus } from "../domain/Evaluation"
import type { ClassSession } from "../application/AttendanceService"

interface GradeEntry { status: EvaluationStatus; score: number }
interface StudentDocument {
  uid: string; displayName: string; email: string
  level: number; xp: number; gradesSummary: Record<string, GradeEntry>
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
const STATUS_LABELS: Record<EvaluationStatus, string> = {
  Victory: "Victoria", Defeat: "Derrota", Pending: "Pendiente",
}
const STATUS_COLORS: Record<EvaluationStatus, { bg: string; text: string }> = {
  Victory: { bg: "#dcfce7", text: "#15803d" },
  Defeat:  { bg: "#fee2e2", text: "#b91c1c" },
  Pending: { bg: "#fef9c3", text: "#854d0e" },
}

const updateGradeUC = new UpdateGrade(outboxService)

type CellKey = string
interface CellState {
  saving: boolean; error: boolean
  pendingStatus?: EvaluationStatus; pendingScore?: number
}

export default function TeacherPanel() {
  const { user } = useAuth()
  const [students, setStudents] = useState<StudentDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [cellStates, setCellStates] = useState<Record<CellKey, CellState>>({})
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [creatingSession, setCreatingSession] = useState(false)
  const [checkStates, setCheckStates] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<"grades" | "attendance">("grades")
  const logout = useLogout()

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "student"))
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<StudentDocument, "uid">) })))
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = attendanceService.subscribeToSessions(setSessions)
    return unsub
  }, [])

  async function handleCreateSession() {
    if (!user) return
    setCreatingSession(true)
    try {
      await attendanceService.createSession(user.uid)
    } finally {
      setCreatingSession(false)
    }
  }

  async function handleToggleAttendance(classId: string, studentUid: string, isPresent: boolean) {
    const key = `${classId}_${studentUid}`
    setCheckStates((p) => ({ ...p, [key]: true }))
    try {
      if (isPresent) {
        await attendanceService.markPresent(classId, studentUid)
      } else {
        await attendanceService.markAbsent(classId, studentUid)
      }
    } finally {
      setCheckStates((p) => ({ ...p, [key]: false }))
    }
  }

  async function handleCellChange(studentUid: string, evalKey: EvalKey, newStatus: EvaluationStatus, newScore: number) {
    const cellKey: CellKey = `${studentUid}-${evalKey}`
    setCellStates((p) => ({ ...p, [cellKey]: { saving: true, error: false, pendingStatus: newStatus, pendingScore: newScore } }))
    try {
      await updateGradeUC.execute(`${studentUid}_${evalKey}`, newStatus, newScore)
      setCellStates((p) => ({ ...p, [cellKey]: { saving: false, error: false } }))
    } catch {
      setCellStates((p) => ({ ...p, [cellKey]: { saving: false, error: true } }))
      setTimeout(() => setCellStates((p) => ({ ...p, [cellKey]: { saving: false, error: false } })), 3000)
    }
  }

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100svh", background:"#f8fafc", flexDirection:"column", gap:"1rem" }}>
      <div style={{ fontSize:"2.5rem" }}>⏳</div>
      <span style={{ color:"#64748b", fontWeight:600 }}>Cargando panel del profesor…</span>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .tp-root { min-height: 100svh; background: #f1f5f9; font-family: inherit; }
        .tp-topbar {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
          padding: 1.25rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
        }
        .tp-logout-btn {
          padding: 0.4rem 1rem; border-radius: 8px; border: 1.5px solid rgba(255,255,255,0.3);
          background: transparent; color: rgba(255,255,255,0.9);
          font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease;
        }
        .tp-logout-btn:hover { background: rgba(255,255,255,0.15); border-color: #fff; }
        .tp-topbar-left { display: flex; flex-direction: column; gap: 0.2rem; }
        .tp-title { font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0; letter-spacing: -0.02em; }
        .tp-subtitle { font-size: 0.85rem; color: rgba(255,255,255,0.7); font-weight: 500; }
        .tp-stats-row { display: flex; gap: 1rem; align-items: center; }
        .tp-stat-chip {
          background: rgba(255,255,255,0.15); color: #fff;
          padding: 0.3rem 0.8rem; border-radius: 999px;
          font-size: 0.8rem; font-weight: 700; backdrop-filter: blur(4px);
        }
        .tp-content { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
        @media (min-width: 768px) { .tp-content { padding: 2rem; } }
        /* Tabs */
        .tp-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
        .tp-tab {
          padding: 0.5rem 1.25rem; border-radius: 10px; border: 2px solid transparent;
          font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
          background: #fff; color: #64748b;
        }
        .tp-tab:hover { border-color: #a855f7; color: #7c3aed; }
        .tp-tab.active { background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; border-color: transparent; }
        /* Card */
        .tp-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
        .tp-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .tp-table { width: 100%; border-collapse: collapse; min-width: 700px; font-size: 0.9rem; }
        .tp-table thead tr { background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
        .tp-table th {
          padding: 0.875rem 1.25rem; text-align: left;
          font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #64748b; white-space: nowrap;
        }
        .tp-table td { padding: 0.875rem 1.25rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .tp-table tbody tr:last-child td { border-bottom: none; }
        .tp-table tbody tr:hover td { background: #f8fafc; }
        .tp-col-sm-hidden { display: none; }
        @media (min-width: 768px) { .tp-col-sm-hidden { display: table-cell; } }
        @media (min-width: 1024px) {
          .tp-topbar { padding: 1.5rem 3rem; }
          .tp-title { font-size: 1.75rem; }
          .tp-table th, .tp-table td { padding: 1rem 1.5rem; }
          .tp-grade-cell { min-width: 180px; }
        }
        /* Student info */
        .tp-student-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          display: inline-flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 0.9rem; flex-shrink: 0;
        }
        .tp-student-info { display: flex; align-items: center; gap: 0.75rem; }
        .tp-student-name { font-weight: 700; font-size: 0.95rem; color: #1e293b; }
        .tp-student-email { font-size: 0.78rem; color: #94a3b8; margin-top: 0.1rem; }
        .tp-level-badge {
          display: inline-flex; align-items: center; gap: 0.3rem;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          color: #fff; padding: 0.25rem 0.6rem; border-radius: 999px;
          font-size: 0.8rem; font-weight: 700;
        }
        .tp-xp-value { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
        /* Grade cell */
        .tp-grade-cell { display: flex; flex-direction: column; gap: 0.4rem; min-width: 150px; }
        .tp-status-select {
          width: 100%; min-height: 40px; padding: 0.4rem 0.6rem;
          border-radius: 8px; border: 1.5px solid #e2e8f0;
          font-size: 0.85rem; font-weight: 600; cursor: pointer; background: #fff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 0.6rem center; padding-right: 2rem;
        }
        .tp-status-select:focus { outline: none; border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168,85,247,0.12); }
        .tp-status-select:disabled { opacity: 0.6; cursor: not-allowed; }
        .tp-score-row { display: flex; align-items: center; gap: 0.5rem; }
        .tp-score-label { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
        .tp-score-input {
          width: 64px; min-height: 36px; padding: 0.35rem 0.5rem;
          border-radius: 8px; border: 1.5px solid #e2e8f0;
          font-size: 0.875rem; font-weight: 700; text-align: center; background: #fff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .tp-score-input:focus { outline: none; border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168,85,247,0.12); }
        .tp-score-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .tp-saving { font-size: 0.75rem; color: #a855f7; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; }
        .tp-error  { font-size: 0.75rem; color: #ef4444; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; }
        .tp-empty { padding: 4rem 2rem; text-align: center; color: #94a3b8; }
        .tp-empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        .tp-empty-title { font-size: 1.1rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; }
        .tp-empty-sub { font-size: 0.875rem; }
        /* Attendance tab */
        .tp-att-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 2px solid #f1f5f9;
        }
        .tp-att-title { font-size: 1rem; font-weight: 800; color: #1e293b; }
        .tp-new-class-btn {
          padding: 0.5rem 1.25rem; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          color: #fff; font-size: 0.875rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 2px 8px rgba(168,85,247,0.3);
        }
        .tp-new-class-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(168,85,247,0.4); }
        .tp-new-class-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .tp-session-block { border-bottom: 1px solid #f1f5f9; }
        .tp-session-block:last-child { border-bottom: none; }
        .tp-session-header {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.875rem 1.5rem; background: #f8fafc;
          font-size: 0.85rem; font-weight: 700; color: #475569;
        }
        .tp-session-date { color: #1e293b; font-size: 0.95rem; }
        .tp-session-count {
          margin-left: auto; background: #e0e7ff; color: #4338ca;
          padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700;
        }
        .tp-att-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem; padding: 1rem 1.5rem;
        }
        .tp-att-student {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.6rem 0.75rem; border-radius: 10px; border: 1.5px solid #e2e8f0;
          background: #fff; transition: border-color 0.2s, background 0.2s;
          cursor: pointer; min-height: 44px;
        }
        .tp-att-student.present { border-color: #10b981; background: #f0fdf4; }
        .tp-att-student.saving { opacity: 0.6; cursor: not-allowed; }
        .tp-att-checkbox {
          width: 18px; height: 18px; border-radius: 5px; border: 2px solid #cbd5e1;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.15s; background: #fff;
        }
        .tp-att-student.present .tp-att-checkbox { background: #10b981; border-color: #10b981; color: #fff; }
        .tp-att-name { font-size: 0.85rem; font-weight: 600; color: #1e293b; }
        .tp-att-xp { font-size: 0.72rem; color: #10b981; font-weight: 700; margin-left: auto; }
        .tp-no-sessions { padding: 3rem 2rem; text-align: center; color: #94a3b8; font-size: 0.9rem; }
      `}</style>

      <div className="tp-root">
        {/* Top bar */}
        <div className="tp-topbar">
          <div className="tp-topbar-left">
            <h1 className="tp-title">🎓 Panel del Profesor</h1>
            <span className="tp-subtitle">Gestión de evaluaciones en tiempo real</span>
          </div>
          <div className="tp-stats-row">
            <span className="tp-stat-chip">👥 {students.length} alumno{students.length !== 1 ? "s" : ""}</span>
            <button className="tp-logout-btn" onClick={logout}>Cerrar sesión</button>
          </div>
        </div>

        <div className="tp-content">
          {/* Tabs */}
          <div className="tp-tabs">
            <button
              className={`tp-tab${activeTab === "grades" ? " active" : ""}`}
              onClick={() => setActiveTab("grades")}
            >
              📊 Calificaciones
            </button>
            <button
              className={`tp-tab${activeTab === "attendance" ? " active" : ""}`}
              onClick={() => setActiveTab("attendance")}
            >
              📋 Asistencia
            </button>
          </div>

          {activeTab === "grades" && (
            <div className="tp-card">
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
                            <div className="tp-empty-icon">🎒</div>
                            <div className="tp-empty-title">No hay alumnos registrados</div>
                            <div className="tp-empty-sub">Los alumnos aparecerán aquí cuando se registren.</div>
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
          )}

          {activeTab === "attendance" && (
            <div className="tp-card">
              <div className="tp-att-header">
                <span className="tp-att-title">📅 Historial de clases</span>
                <button
                  className="tp-new-class-btn"
                  disabled={creatingSession}
                  onClick={handleCreateSession}
                >
                  {creatingSession ? "⏳ Creando…" : "➕ Nueva clase"}
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="tp-no-sessions">
                  No hay clases registradas. Crea la primera con "Nueva clase".
                </div>
              ) : (
                sessions.map((session) => (
                  <AttendanceSession
                    key={session.id}
                    session={session}
                    students={students}
                    checkStates={checkStates}
                    onToggle={handleToggleAttendance}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Grades tab row ── */

interface StudentRowProps {
  student: StudentDocument
  cellStates: Record<CellKey, CellState>
  onCellChange: (uid: string, evalKey: EvalKey, status: EvaluationStatus, score: number) => void
}

function StudentRow({ student, cellStates, onCellChange }: StudentRowProps) {
  const grades = student.gradesSummary ?? {}
  const initials = (student.displayName || student.email).slice(0, 2).toUpperCase()
  return (
    <tr>
      <td>
        <div className="tp-student-info">
          <div className="tp-student-avatar">{initials}</div>
          <div>
            <div className="tp-student-name">{student.displayName || student.email}</div>
            <div className="tp-student-email">{student.email}</div>
          </div>
        </div>
      </td>
      <td><span className="tp-level-badge">⭐ {student.level ?? 1}</span></td>
      <td><span className="tp-xp-value">{student.xp ?? 0} XP</span></td>
      {EVAL_KEYS.map((key) => (
        <td key={key} className={HIDDEN_SM[key] ? "tp-col-sm-hidden" : undefined}>
          <GradeCell
            studentUid={student.uid}
            evalKey={key}
            entry={grades[key] as GradeEntry | undefined}
            cellState={cellStates[`${student.uid}-${key}`]}
            onCellChange={onCellChange}
          />
        </td>
      ))}
    </tr>
  )
}

interface GradeCellProps {
  studentUid: string; evalKey: EvalKey
  entry: GradeEntry | undefined; cellState: CellState | undefined
  onCellChange: (uid: string, evalKey: EvalKey, status: EvaluationStatus, score: number) => void
}

function GradeCell({ studentUid, evalKey, entry, cellState, onCellChange }: GradeCellProps) {
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

  const displayStatus: EvaluationStatus = (saving && cellState?.pendingStatus) ? cellState.pendingStatus : committedStatus
  const colors = STATUS_COLORS[displayStatus]

  return (
    <div className="tp-grade-cell">
      {saving ? (
        <span className="tp-saving">⏳ Guardando…</span>
      ) : error ? (
        <span className="tp-error">⚠️ Error al guardar</span>
      ) : null}

      <select
        className="tp-status-select"
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

      <div className="tp-score-row">
        <span className="tp-score-label">Nota:</span>
        <input
          type="number"
          className="tp-score-input"
          min={0} max={10} step={0.5}
          value={localScore}
          disabled={saving}
          aria-label={`Puntaje de ${evalKey}`}
          onChange={(e) => setLocalScore(Number(e.target.value))}
          onBlur={() => { if (localScore !== committedScore) onCellChange(studentUid, evalKey, committedStatus, localScore) }}
        />
      </div>
    </div>
  )
}

/* ── Attendance tab session block ── */

interface AttendanceSessionProps {
  session: ClassSession
  students: StudentDocument[]
  checkStates: Record<string, boolean>
  onToggle: (classId: string, studentUid: string, isPresent: boolean) => void
}

function AttendanceSession({ session, students, checkStates, onToggle }: AttendanceSessionProps) {
  const presentCount = session.presentStudents.length
  const dateLabel = session.date.toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div className="tp-session-block">
      <div className="tp-session-header">
        <span>📅</span>
        <span className="tp-session-date">{dateLabel}</span>
        <span className="tp-session-count">
          {presentCount}/{students.length} presentes
        </span>
      </div>
      <div className="tp-att-grid">
        {students.map((student) => {
          const isPresent = session.presentStudents.includes(student.uid)
          const isSaving = checkStates[`${session.id}_${student.uid}`] ?? false
          const initials = (student.displayName || student.email).slice(0, 2).toUpperCase()
          return (
            <button
              key={student.uid}
              className={`tp-att-student${isPresent ? " present" : ""}${isSaving ? " saving" : ""}`}
              disabled={isSaving}
              aria-label={`${isPresent ? "Marcar ausente" : "Marcar presente"}: ${student.displayName || student.email}`}
              onClick={() => onToggle(session.id, student.uid, !isPresent)}
            >
              <div className="tp-att-checkbox">
                {isPresent && <span style={{ fontSize: "0.7rem" }}>✓</span>}
              </div>
              <div className="tp-student-avatar" style={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                {initials}
              </div>
              <span className="tp-att-name">{student.displayName || student.email}</span>
              {isPresent && <span className="tp-att-xp">+20 XP</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
