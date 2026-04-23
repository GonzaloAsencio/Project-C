import { useState } from "react"
import clsx from "clsx"
import { doc, setDoc, writeBatch, deleteField } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { attendanceService } from "../../shared/services"
import { UpdateGrade } from "../application/UpdateGrade"
import { useLogout } from "../../shared/useLogout"
import { useAuth } from "../../shared/AuthContext"
import type { EvaluationStatus } from "../domain/Evaluation"
import { useTeacherData } from "./useTeacherData"
import type { StudentDocument } from "./useTeacherData"
import { useEvalColumns } from "../../shared/useEvalColumns"
import type { EvalColumn } from "../../shared/useEvalColumns"
import StudentRow from "./StudentRow"
import AttendanceSession from "./AttendanceSession"
import StudentDetailModal from "./StudentDetailModal"
import type { CellState } from "./GradeCell"
import { FirebaseAuthAdapter } from "../../identity/infrastructure/FirebaseAuthAdapter"
import { isValidTemporaryPassword } from "../../identity/application/studentProvisioning"
import styles from "./TeacherPanel.module.css"

type CellKey = string

const CONFIG_DOC = doc(db, "config", "evalColumns")
const updateGradeUC = new UpdateGrade()
const authAdapter = new FirebaseAuthAdapter()

type ConfirmAction =
  | { type: "bulk-reset"; col: EvalColumn }
  | { type: "delete-col"; col: EvalColumn }
  | { type: "delete-session"; sessionId: string; dateLabel: string }

export default function TeacherPanel() {
  const { user } = useAuth()
  const logout = useLogout()
  const {
    students,
    filteredStudents,
    sessions,
    loading,
    loadingMore,
    hasMore,
    studentsError,
    attendanceError,
    filterText,
    setFilterText,
    loadMore,
    refresh,
  } = useTeacherData()
  const { columns } = useEvalColumns()

  const [cellStates, setCellStates] = useState<Record<CellKey, CellState>>({})
  const [creatingSession, setCreatingSession] = useState(false)
  const [checkStates, setCheckStates] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<"grades" | "attendance">("grades")
  const [detailStudent, setDetailStudent] = useState<StudentDocument | null>(null)

  // Session creation form
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [newSessionDate, setNewSessionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newSessionSelfReg, setNewSessionSelfReg] = useState(false)
  const [newSessionWinStart, setNewSessionWinStart] = useState("08:00")
  const [newSessionWinEnd, setNewSessionWinEnd] = useState("10:00")

  // Column management state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newColLabel, setNewColLabel] = useState("")
  const [newColType, setNewColType] = useState<"TP" | "Parcial">("TP")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState("")
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [bulkingKey, setBulkingKey] = useState<string | null>(null)

  // Student account creation state
  const [showCreateStudent, setShowCreateStudent] = useState(false)
  const [newStudentName, setNewStudentName] = useState("")
  const [newStudentEmail, setNewStudentEmail] = useState("")
  const [newStudentPassword, setNewStudentPassword] = useState("")
  const [creatingStudent, setCreatingStudent] = useState(false)
  const [createStudentError, setCreateStudentError] = useState<string | null>(null)
  const [createStudentSuccess, setCreateStudentSuccess] = useState<string | null>(null)

  async function handleCreateSession() {
    if (!user) return
    setCreatingSession(true)
    try {
      const sessionDate = new Date(`${newSessionDate}T12:00:00`)
      const ws = newSessionSelfReg ? new Date(`${newSessionDate}T${newSessionWinStart}:00`) : undefined
      const we = newSessionSelfReg ? new Date(`${newSessionDate}T${newSessionWinEnd}:00`) : undefined
      await attendanceService.createSession(user.uid, sessionDate, newSessionSelfReg, ws, we)
      setShowSessionForm(false)
    } finally {
      setCreatingSession(false)
    }
  }

  async function handleMarkAll(classId: string) {
    const key = `markAll_${classId}`
    setCheckStates((p) => ({ ...p, [key]: true }))
    try {
      await attendanceService.markAllPresent(classId, students.map((s) => s.uid))
    } finally {
      setCheckStates((p) => ({ ...p, [key]: false }))
    }
  }

  async function handleClearAll(classId: string) {
    const key = `clearAll_${classId}`
    setCheckStates((p) => ({ ...p, [key]: true }))
    try {
      await attendanceService.clearAllPresent(classId)
    } finally {
      setCheckStates((p) => ({ ...p, [key]: false }))
    }
  }

  async function handleDeleteSession(sessionId: string) {
    await attendanceService.deleteSession(sessionId)
    setConfirmAction(null)
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

  async function handleCellChange(studentUid: string, evalKey: string, newStatus: EvaluationStatus, newScore: number) {
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

  // ── Column management ──

  async function handleAddColumn() {
    if (!newColLabel.trim()) return
    const nextIndex = Math.max(0, ...columns.filter(c => c.type === newColType).map(c => c.index)) + 1
    const key = `${newColType === "TP" ? "tp" : "parcial"}${nextIndex}`
    const newCol: EvalColumn = { key, label: newColLabel.trim(), type: newColType, index: nextIndex }
    await setDoc(CONFIG_DOC, { columns: [...columns, newCol] })
    setNewColLabel("")
    setNewColType("TP")
    setShowAddForm(false)
  }

  async function handleRenameColumn(col: EvalColumn) {
    if (!editLabel.trim() || editLabel.trim() === col.label) {
      setEditingKey(null)
      return
    }
    const updated = columns.map(c => c.key === col.key ? { ...c, label: editLabel.trim() } : c)
    await setDoc(CONFIG_DOC, { columns: updated })
    setEditingKey(null)
  }

  async function handleDeleteColumn(col: EvalColumn) {
    const updated = columns.filter(c => c.key !== col.key)
    const batch = writeBatch(db)
    // Remove from config
    batch.set(CONFIG_DOC, { columns: updated })
    // Clean gradesSummary for every loaded student
    for (const student of students) {
      const userRef = doc(db, "users", student.uid)
      batch.update(userRef, { [`gradesSummary.${col.key}`]: deleteField() })
      const evalRef = doc(db, "evaluations", `${student.uid}_${col.key}`)
      batch.delete(evalRef)
    }
    await batch.commit()
    setConfirmAction(null)
  }

  async function handleBulkReset(col: EvalColumn) {
    setBulkingKey(col.key)
    try {
      await Promise.all(
        students.map(s => updateGradeUC.execute(`${s.uid}_${col.key}`, "Pending", 0))
      )
    } finally {
      setBulkingKey(null)
      setConfirmAction(null)
    }
  }

  async function handleConfirm() {
    if (!confirmAction) return
    if (confirmAction.type === "bulk-reset") await handleBulkReset(confirmAction.col)
    if (confirmAction.type === "delete-col") await handleDeleteColumn(confirmAction.col)
    if (confirmAction.type === "delete-session") await handleDeleteSession(confirmAction.sessionId)
  }

  async function handleCreateStudentAccount() {
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentPassword.trim()) return
    if (!isValidTemporaryPassword(newStudentPassword)) {
      setCreateStudentError("La contrasena temporal debe tener al menos 6 caracteres")
      return
    }
    setCreatingStudent(true)
    setCreateStudentError(null)
    setCreateStudentSuccess(null)
    try {
      await authAdapter.createStudentByTeacher({
        displayName: newStudentName.trim(),
        email: newStudentEmail.trim(),
        password: newStudentPassword,
      })
      await refresh()
      setCreateStudentSuccess("Alumno creado. Elegira su clase en el primer login.")
      setNewStudentName("")
      setNewStudentEmail("")
      setNewStudentPassword("")
      setTimeout(() => setShowCreateStudent(false), 900)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear el alumno"
      setCreateStudentError(message)
    } finally {
      setCreatingStudent(false)
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
      {/* Confirm dialog */}
      {confirmAction && (
        <div className={styles.confirmBackdrop}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmTitle}>
              {confirmAction.type === "bulk-reset"
                ? "¿Marcar todos como Pendiente?"
                : confirmAction.type === "delete-col"
                  ? "¿Eliminar columna?"
                  : "¿Eliminar sesión?"}
            </p>
            <p className={styles.confirmMsg}>
              {confirmAction.type === "bulk-reset"
                ? `Se resetearán las notas de ${students.length} alumno(s) en "${confirmAction.col.label}". Esta acción no revierte el XP ya otorgado.`
                : confirmAction.type === "delete-col"
                  ? `Se eliminará la columna "${confirmAction.col.label}" y sus datos en todos los alumnos cargados.${hasMore ? " Hay alumnos en páginas no cargadas que no serán afectados." : ""}`
                  : `Se eliminará la sesión del ${confirmAction.dateLabel}. El XP ya otorgado no se revertirá.`}
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setConfirmAction(null)}>Cancelar</button>
              <button className={styles.confirmOk} onClick={handleConfirm}>
                {confirmAction.type === "bulk-reset" ? "Resetear" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateStudent && (
        <div className={styles.confirmBackdrop}>
          <div className={styles.studentCreateBox}>
            <h2 className={styles.studentCreateTitle}>Crear cuenta de alumno</h2>
            <p className={styles.studentCreateText}>
              El alumno recibira sus credenciales y elegira clase en su primer ingreso.
            </p>
            <div className={styles.studentCreateField}>
              <label className={styles.sessionFormLabel}>Nombre</label>
              <input
                className={styles.sessionFormInput}
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Nombre del alumno"
                disabled={creatingStudent}
              />
            </div>
            <div className={styles.studentCreateField}>
              <label className={styles.sessionFormLabel}>Email</label>
              <input
                className={styles.sessionFormInput}
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                placeholder="alumno@escuela.com"
                type="email"
                disabled={creatingStudent}
              />
            </div>
            <div className={styles.studentCreateField}>
              <label className={styles.sessionFormLabel}>Contrasena temporal</label>
              <input
                className={styles.sessionFormInput}
                value={newStudentPassword}
                onChange={(e) => setNewStudentPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                type="password"
                minLength={6}
                disabled={creatingStudent}
              />
            </div>
            {createStudentError && <p className={styles.studentCreateError}>⚠ {createStudentError}</p>}
            {createStudentSuccess && <p className={styles.studentCreateSuccess}>✓ {createStudentSuccess}</p>}
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancel}
                onClick={() => {
                  setShowCreateStudent(false)
                  setCreateStudentError(null)
                  setCreateStudentSuccess(null)
                }}
                disabled={creatingStudent}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmOk}
                onClick={handleCreateStudentAccount}
                disabled={creatingStudent}
              >
                {creatingStudent ? "Creando..." : "Crear alumno"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailStudent && (
        <StudentDetailModal
          student={detailStudent}
          onClose={() => setDetailStudent(null)}
        />
      )}

      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <h1 className={styles.title}>🎓 Panel del Profesor</h1>
          <span className={styles.subtitle}>Gestión de evaluaciones en tiempo real</span>
        </div>
        <div className={styles.statsRow}>
          <button className={styles.createStudentBtn} onClick={() => setShowCreateStudent(true)}>
            + Crear alumno
          </button>
          <span className={styles.statChip}>👥 {students.length} alumno{students.length !== 1 ? "s" : ""}{hasMore ? "+" : ""}</span>
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
            {/* Search + add column bar */}
            <div className={styles.addColBar}>
              <input
                className={styles.searchInput}
                type="search"
                placeholder="🔍 Buscar alumno por nombre o email…"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                aria-label="Buscar alumno"
                style={{ flex: 1, minWidth: 180 }}
              />
              {filterText && (
                <span className={styles.searchCount}>
                  {filteredStudents.length} resultado{filteredStudents.length !== 1 ? "s" : ""}
                </span>
              )}
              {showAddForm ? (
                <div className={styles.addColForm}>
                  <input
                    className={styles.addColInput}
                    placeholder="Nombre columna"
                    value={newColLabel}
                    onChange={(e) => setNewColLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddColumn(); if (e.key === "Escape") setShowAddForm(false) }}
                    autoFocus
                  />
                  <select
                    className={styles.addColTypeSelect}
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value as "TP" | "Parcial")}
                  >
                    <option value="TP">TP</option>
                    <option value="Parcial">Parcial</option>
                  </select>
                  <button className={styles.addColConfirm} onClick={handleAddColumn} disabled={!newColLabel.trim()}>
                    Agregar
                  </button>
                  <button className={styles.addColCancel} onClick={() => { setShowAddForm(false); setNewColLabel("") }}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button className={styles.addColBtn} onClick={() => setShowAddForm(true)}>
                  + Agregar evaluación
                </button>
              )}
            </div>

            <div className={styles.tableWrap} role="region" aria-label="Tabla de alumnos" tabIndex={0}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Alumno</th>
                    <th scope="col">Niv.</th>
                    <th scope="col">XP</th>
                    {columns.map((col) => (
                      <th key={col.key} scope="col">
                        <div className={styles.colHeader}>
                          {editingKey === col.key ? (
                            <input
                              className={styles.colLabelInput}
                              value={editLabel}
                              autoFocus
                              onChange={(e) => setEditLabel(e.target.value)}
                              onBlur={() => handleRenameColumn(col)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameColumn(col)
                                if (e.key === "Escape") setEditingKey(null)
                              }}
                            />
                          ) : (
                            <span className={styles.colHeaderLabel}>{col.label}</span>
                          )}
                          <div className={styles.colHeaderActions}>
                            <button
                              className={styles.colActionBtn}
                              title="Renombrar columna"
                              onClick={() => { setEditingKey(col.key); setEditLabel(col.label) }}
                            >✏️</button>
                            <button
                              className={styles.bulkResetBtn}
                              title="Marcar todos como Pendiente"
                              disabled={bulkingKey === col.key}
                              onClick={() => setConfirmAction({ type: "bulk-reset", col })}
                            >
                              {bulkingKey === col.key ? "⏳" : "↺"}
                            </button>
                            <button
                              className={styles.colActionBtn}
                              title="Eliminar columna"
                              onClick={() => setConfirmAction({ type: "delete-col", col })}
                            >🗑️</button>
                          </div>
                        </div>
                      </th>
                    ))}
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3 + columns.length + 1}>
                        <div className={styles.empty}>
                          <div className={styles.emptyIcon}>{filterText ? "🔍" : "🎒"}</div>
                          <div className={styles.emptyTitle}>
                            {filterText ? "Sin resultados" : "No hay alumnos registrados"}
                          </div>
                          <div className={styles.emptySub}>
                            {filterText
                              ? `No se encontraron alumnos que coincidan con "${filterText}".`
                              : "Los alumnos aparecerán aquí cuando se registren."}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <StudentRow
                        key={student.uid}
                        student={student}
                        columns={columns}
                        cellStates={cellStates}
                        onCellChange={handleCellChange}
                        onViewDetails={setDetailStudent}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Load more */}
            {hasMore && !filterText && (
              <div className={styles.loadMoreWrap}>
                <button
                  className={styles.loadMoreBtn}
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "⏳ Cargando…" : "Cargar más alumnos"}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "attendance" && (
          <div className={styles.card}>
            <div className={styles.attHeader}>
              <span className={styles.attTitle}>📅 Historial de clases</span>
              <button
                className={styles.newClassBtn}
                onClick={() => setShowSessionForm((v) => !v)}
              >
                {showSessionForm ? "✕ Cancelar" : "➕ Nueva clase"}
              </button>
            </div>

            {showSessionForm && (
              <div className={styles.sessionForm}>
                <div className={styles.sessionFormRow}>
                  <label className={styles.sessionFormLabel}>Fecha</label>
                  <input
                    type="date"
                    className={styles.sessionFormInput}
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                  />
                </div>
                <div className={styles.sessionFormRow}>
                  <label className={styles.sessionFormLabel}>
                    <input
                      type="checkbox"
                      checked={newSessionSelfReg}
                      onChange={(e) => setNewSessionSelfReg(e.target.checked)}
                      style={{ marginRight: "0.4rem" }}
                    />
                    Auto-registro de alumnos
                  </label>
                </div>
                {newSessionSelfReg && (
                  <div className={styles.sessionFormRow}>
                    <label className={styles.sessionFormLabel}>Ventana horaria</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="time"
                        className={styles.sessionFormInput}
                        value={newSessionWinStart}
                        onChange={(e) => setNewSessionWinStart(e.target.value)}
                      />
                      <span style={{ color: "#64748b", fontSize: "0.85rem" }}>→</span>
                      <input
                        type="time"
                        className={styles.sessionFormInput}
                        value={newSessionWinEnd}
                        onChange={(e) => setNewSessionWinEnd(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <button
                  className={styles.newClassBtn}
                  disabled={creatingSession}
                  onClick={handleCreateSession}
                >
                  {creatingSession ? "⏳ Creando…" : "Crear sesión"}
                </button>
              </div>
            )}

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
                  onMarkAll={handleMarkAll}
                  onClearAll={handleClearAll}
                  onDelete={(sessionId, dateLabel) =>
                    setConfirmAction({ type: "delete-session", sessionId, dateLabel })
                  }
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
