import { useState } from "react"
import clsx from "clsx"
import { outboxService, attendanceService } from "../../shared/services"
import { UpdateGrade } from "../application/UpdateGrade"
import { useLogout } from "../../shared/useLogout"
import { useAuth } from "../../shared/AuthContext"
import type { EvaluationStatus } from "../domain/Evaluation"
import { useTeacherData } from "./useTeacherData"
import StudentRow, { EVAL_KEYS, EVAL_LABELS, HIDDEN_SM } from "./StudentRow"
import AttendanceSession from "./AttendanceSession"
import type { CellState } from "./GradeCell"
import styles from "./TeacherPanel.module.css"

export type EvalKey = typeof EVAL_KEYS[number]
type CellKey = string

const updateGradeUC = new UpdateGrade(outboxService)

export default function TeacherPanel() {
  const { user } = useAuth()
  const logout = useLogout()
  const { students, sessions, loading, studentsError, attendanceError } = useTeacherData()
  const [cellStates, setCellStates] = useState<Record<CellKey, CellState>>({})
  const [creatingSession, setCreatingSession] = useState(false)
  const [checkStates, setCheckStates] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<"grades" | "attendance">("grades")

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100svh", background: "#f8fafc", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "2.5rem" }}>⏳</div>
      <span style={{ color: "#64748b", fontWeight: 600 }}>Cargando panel del profesor…</span>
    </div>
  )

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <h1 className={styles.title}>🎓 Panel del Profesor</h1>
          <span className={styles.subtitle}>Gestión de evaluaciones en tiempo real</span>
        </div>
        <div className={styles.statsRow}>
          <span className={styles.statChip}>👥 {students.length} alumno{students.length !== 1 ? "s" : ""}</span>
          <button className={styles.logoutBtn} onClick={logout}>Cerrar sesión</button>
        </div>
      </div>

      <div className={styles.content}>
        {studentsError && (
          <div className={styles.errorBanner}>
            <span>⚠️</span> {studentsError}
          </div>
        )}
        {attendanceError && activeTab === "attendance" && (
          <div className={styles.errorBanner}>
            <span>⚠️</span> {attendanceError}
          </div>
        )}

        <div className={styles.tabs}>
          <button
            className={clsx(styles.tab, activeTab === "grades" && styles.tabActive)}
            onClick={() => setActiveTab("grades")}
          >
            📊 Calificaciones
          </button>
          <button
            className={clsx(styles.tab, activeTab === "attendance" && styles.tabActive)}
            onClick={() => setActiveTab("attendance")}
          >
            📋 Asistencia
          </button>
        </div>

        {activeTab === "grades" && (
          <div className={styles.card}>
            <div className={styles.tableWrap} role="region" aria-label="Tabla de alumnos" tabIndex={0}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Alumno</th>
                    <th scope="col">Nivel</th>
                    <th scope="col">XP</th>
                    {EVAL_KEYS.map((key) => (
                      <th key={key} scope="col" className={HIDDEN_SM[key] ? styles.colSmHidden : undefined}>
                        {EVAL_LABELS[key]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={3 + EVAL_KEYS.length}>
                        <div className={styles.empty}>
                          <div className={styles.emptyIcon}>🎒</div>
                          <div className={styles.emptyTitle}>No hay alumnos registrados</div>
                          <div className={styles.emptySub}>Los alumnos aparecerán aquí cuando se registren.</div>
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
          <div className={styles.card}>
            <div className={styles.attHeader}>
              <span className={styles.attTitle}>📅 Historial de clases</span>
              <button
                className={styles.newClassBtn}
                disabled={creatingSession}
                onClick={handleCreateSession}
              >
                {creatingSession ? "⏳ Creando…" : "➕ Nueva clase"}
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className={styles.noSessions}>
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
  )
}
