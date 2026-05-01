import { useEffect, useState } from "react"
import clsx from "clsx"
import { Pencil, RotateCcw, Trash2 } from "lucide-react"
import { doc, setDoc, writeBatch, deleteField } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { attendanceService } from "../../shared/services"
import { UpdateGrade } from "../application/UpdateGrade"
import { DeleteStudent } from "../application/DeleteStudent"
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
import TeacherToast from "./TeacherToast"
import type { TeacherToastItem, TeacherToastTone } from "./TeacherToast"
import { FirebaseAuthAdapter } from "../../identity/infrastructure/FirebaseAuthAdapter"
import { isValidTemporaryPassword } from "../../identity/application/studentProvisioning"
import MateriaSetup from "../../identity/infrastructure/MateriaSetup"
import styles from "./TeacherPanel.module.css"

type CellKey = string

const updateGradeUC = new UpdateGrade()
const deleteStudentUC = new DeleteStudent()
const authAdapter = new FirebaseAuthAdapter()
const STUDENTS_PER_PAGE = 10

type ConfirmAction =
  | { type: "bulk-reset"; col: EvalColumn }
  | { type: "delete-col"; col: EvalColumn }
  | { type: "delete-session"; sessionId: string; dateLabel: string }
  | { type: "delete-student"; student: StudentDocument }

export default function TeacherPanel() {
  const { user } = useAuth()
  const logout = useLogout()

  // Gate: teacher must have a materia configured
  if (!user) return null
  if (!user.materiaId) {
    return (
      <MateriaSetup
        teacherUid={user.uid}
        onCreated={() => window.location.reload()}
      />
    )
  }

  return <TeacherPanelInner user={user} materiaId={user.materiaId} logout={logout} />
}

function TeacherPanelInner({
  user,
  materiaId,
  logout,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>
  materiaId: string
  logout: () => void
}) {
  const CONFIG_DOC = doc(db, "config", materiaId)
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
  } = useTeacherData(materiaId)
  const { columns } = useEvalColumns(materiaId)

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
  const [showEvalForm, setShowEvalForm] = useState(false)
  const [evalFormMode, setEvalFormMode] = useState<"create" | "edit">("create")
  const [evalFormKey, setEvalFormKey] = useState<string | null>(null)
  const [evalFormName, setEvalFormName] = useState("")
  const [evalFormType, setEvalFormType] = useState<"TP" | "Parcial">("TP")
  const [evalFormError, setEvalFormError] = useState<string | null>(null)
  const [savingEvalForm, setSavingEvalForm] = useState(false)
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
  const [studentPage, setStudentPage] = useState(0)

  // Delete student state
  const [deletingStudentUid, setDeletingStudentUid] = useState<string | null>(null)
  const [deleteStudentError, setDeleteStudentError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<TeacherToastItem[]>([])

  function pushToast(message: string, tone: TeacherToastTone = "info") {
    setToasts((prev) => [...prev, { id: Date.now() + Math.floor(Math.random() * 1000), tone, message }])
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  useEffect(() => {
    setStudentPage(0)
  }, [filterText])

  useEffect(() => {
    // Attendance must show the full roster, not only the currently paged chunk.
    if (activeTab !== "attendance") return
    if (loadingMore || !hasMore || !!studentsError) return
    void loadMore()
  }, [activeTab, hasMore, loadingMore, studentsError, loadMore])

  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE))
  const currentStudentPage = Math.min(studentPage, totalStudentPages - 1)
  const paginatedStudents = filteredStudents.slice(
    currentStudentPage * STUDENTS_PER_PAGE,
    (currentStudentPage + 1) * STUDENTS_PER_PAGE,
  )
  const pageStart = filteredStudents.length === 0 ? 0 : currentStudentPage * STUDENTS_PER_PAGE + 1
  const pageEnd = Math.min((currentStudentPage + 1) * STUDENTS_PER_PAGE, filteredStudents.length)

  async function handleNextStudentPage() {
    const nextPage = currentStudentPage + 1
    const nextPageStart = nextPage * STUDENTS_PER_PAGE

    if (nextPageStart < filteredStudents.length) {
      setStudentPage(nextPage)
      return
    }

    if (!filterText && hasMore && !loadingMore) {
      await loadMore()
      setStudentPage(nextPage)
    }
  }

  async function handleCreateSession() {
    if (!user) return
    setCreatingSession(true)
    try {
      const sessionDate = new Date(`${newSessionDate}T12:00:00`)
      const ws = newSessionSelfReg ? new Date(`${newSessionDate}T${newSessionWinStart}:00`) : undefined
      const we = newSessionSelfReg ? new Date(`${newSessionDate}T${newSessionWinEnd}:00`) : undefined
      await attendanceService.createSession(user.uid, sessionDate, materiaId, newSessionSelfReg, ws, we)
      setShowSessionForm(false)
      pushToast("Sesión creada correctamente", "success")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear la sesión"
      pushToast(message, "error")
    } finally {
      setCreatingSession(false)
    }
  }

  async function handleMarkAll(classId: string) {
    const key = `markAll_${classId}`
    setCheckStates((p) => ({ ...p, [key]: true }))
    try {
      await attendanceService.markAllPresent(classId, students.map((s) => s.uid))
      pushToast("Se marcó presente a todo el curso", "success")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo marcar asistencia masiva"
      pushToast(message, "error")
    } finally {
      setCheckStates((p) => ({ ...p, [key]: false }))
    }
  }

  async function handleClearAll(classId: string) {
    const key = `clearAll_${classId}`
    setCheckStates((p) => ({ ...p, [key]: true }))
    try {
      await attendanceService.clearAllPresent(classId)
      pushToast("Se limpió la asistencia de la sesión", "success")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo limpiar la asistencia"
      pushToast(message, "error")
    } finally {
      setCheckStates((p) => ({ ...p, [key]: false }))
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await attendanceService.deleteSession(sessionId)
      pushToast("Sesión eliminada", "success")
      setConfirmAction(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar la sesión"
      pushToast(message, "error")
    }
  }

  async function handleToggleAttendance(classId: string, studentUid: string, isPresent: boolean) {
    const key = `${classId}_${studentUid}`
    setCheckStates((p) => ({ ...p, [key]: true }))
    try {
      if (isPresent) {
        await attendanceService.markPresent(classId, studentUid)
        pushToast("Asistencia marcada", "success")
      } else {
        await attendanceService.markAbsent(classId, studentUid)
        pushToast("Asistencia removida", "info")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la asistencia"
      pushToast(message, "error")
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
      pushToast("No se pudo guardar la calificación", "error")
      setTimeout(() => setCellStates((p) => ({ ...p, [cellKey]: { saving: false, error: false } })), 3000)
    }
  }

  // ── Column management ──

  function normalizeEvalName(value: string): string {
    return value.trim().toLocaleLowerCase()
  }

  function hasDuplicateName(name: string, type: "TP" | "Parcial", ignoreKey?: string | null): boolean {
    const normalized = normalizeEvalName(name)
    return columns.some((column) => {
      if (ignoreKey && column.key === ignoreKey) return false
      return column.type === type && normalizeEvalName(column.label) === normalized
    })
  }

  function closeEvalForm() {
    if (savingEvalForm) return
    setShowEvalForm(false)
    setEvalFormMode("create")
    setEvalFormKey(null)
    setEvalFormName("")
    setEvalFormType("TP")
    setEvalFormError(null)
  }

  function openCreateEvalForm() {
    setEvalFormMode("create")
    setEvalFormKey(null)
    setEvalFormName("")
    setEvalFormType("TP")
    setEvalFormError(null)
    setShowEvalForm(true)
  }

  function openEditEvalForm(column: EvalColumn) {
    setEvalFormMode("edit")
    setEvalFormKey(column.key)
    setEvalFormName(column.label)
    setEvalFormType(column.type)
    setEvalFormError(null)
    setShowEvalForm(true)
  }

  async function handleSaveEvalForm() {
    const name = evalFormName.trim()
    if (!name) {
      setEvalFormError("Ingresa un nombre para la evaluación")
      return
    }
    if (hasDuplicateName(name, evalFormType, evalFormMode === "edit" ? evalFormKey : null)) {
      setEvalFormError("Ya existe una evaluación con ese nombre para este tipo")
      return
    }

    setSavingEvalForm(true)
    setEvalFormError(null)
    try {
      if (evalFormMode === "create") {
        const nextIndex = Math.max(0, ...columns.filter((c) => c.type === evalFormType).map((c) => c.index)) + 1
        const key = `${evalFormType === "TP" ? "tp" : "parcial"}${nextIndex}`
        const newCol: EvalColumn = { key, label: name, type: evalFormType, index: nextIndex }
        await setDoc(CONFIG_DOC, { columns: [...columns, newCol] })
        pushToast("Evaluación creada", "success")
      } else {
        if (!evalFormKey) return
        const target = columns.find((col) => col.key === evalFormKey)
        if (!target) {
          setEvalFormError("No se encontró la evaluación a editar")
          return
        }
        if (target.type !== evalFormType) {
          setEvalFormError("No se puede cambiar el tipo de una evaluación existente")
          return
        }

        const updated = columns.map((col) =>
          col.key === evalFormKey
            ? { ...col, label: name }
            : col,
        )
        await setDoc(CONFIG_DOC, { columns: updated })
        pushToast("Evaluación actualizada", "success")
      }

      closeEvalForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la evaluación"
      pushToast(message, "error")
    } finally {
      setSavingEvalForm(false)
    }
  }

  async function handleDeleteColumn(col: EvalColumn) {
    try {
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
      pushToast("Evaluación eliminada", "success")
      setConfirmAction(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar la evaluación"
      pushToast(message, "error")
    }
  }

  async function handleBulkReset(col: EvalColumn) {
    setBulkingKey(col.key)
    try {
      await Promise.all(
        students.map(s => updateGradeUC.execute(`${s.uid}_${col.key}`, "Pending", 0))
      )
      pushToast(`Se reseteó ${col.label} para ${students.length} alumnos`, "success")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo resetear la evaluación"
      pushToast(message, "error")
    } finally {
      setBulkingKey(null)
      setConfirmAction(null)
    }
  }

  async function handleDeleteStudent(studentUid: string) {
    setDeletingStudentUid(studentUid)
    setDeleteStudentError(null)
    try {
      await deleteStudentUC.execute(studentUid)
      await refresh()
      setConfirmAction(null)
      pushToast("Alumno eliminado", "success")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar el alumno"
      setDeleteStudentError(message)
      pushToast(message, "error")
    } finally {
      setDeletingStudentUid(null)
    }
  }

  async function handleConfirm() {
    if (!confirmAction) return
    if (confirmAction.type === "bulk-reset") await handleBulkReset(confirmAction.col)
    if (confirmAction.type === "delete-col") await handleDeleteColumn(confirmAction.col)
    if (confirmAction.type === "delete-session") await handleDeleteSession(confirmAction.sessionId)
    if (confirmAction.type === "delete-student") await handleDeleteStudent(confirmAction.student.uid)
  }

  async function handleCreateStudentAccount() {
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentPassword.trim()) return
    if (!isValidTemporaryPassword(newStudentPassword)) {
      setCreateStudentError("La contrasena temporal debe tener al menos 6 caracteres")
      pushToast("La contraseña temporal debe tener al menos 6 caracteres", "error")
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
        materiaId,
      })
      await refresh()
      setCreateStudentSuccess("Alumno creado. Elegira su clase en el primer login.")
      setNewStudentName("")
      setNewStudentEmail("")
      setNewStudentPassword("")
      setTimeout(() => setShowCreateStudent(false), 900)
      pushToast("Cuenta de alumno creada", "success")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear el alumno"
      setCreateStudentError(message)
      pushToast(message, "error")
    } finally {
      setCreatingStudent(false)
    }
  }

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingShell}>
        <div className={styles.loadingHeaderSkel} />
        <div className={styles.loadingSubSkel} />
        <div className={styles.loadingToolbarSkel} />
        <div className={styles.loadingTableSkel}>
          <div className={styles.loadingRowSkel} />
          <div className={styles.loadingRowSkel} />
          <div className={styles.loadingRowSkel} />
          <div className={styles.loadingRowSkel} />
          <div className={styles.loadingRowSkel} />
          <div className={styles.loadingRowSkel} />
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.root}>
      <TeacherToast toasts={toasts} onDismiss={dismissToast} />
      {/* Confirm dialog */}
      {confirmAction && (
        <div className={styles.confirmBackdrop}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmTitle}>
              {confirmAction.type === "bulk-reset"
                ? "¿Marcar todos como Pendiente?"
                : confirmAction.type === "delete-col"
                  ? "¿Eliminar columna?"
                  : confirmAction.type === "delete-session"
                    ? "¿Eliminar sesión?"
                    : "¿Eliminar alumno?"}
            </p>
            <p className={styles.confirmMsg}>
              {confirmAction.type === "bulk-reset"
                ? `Se resetearán las notas de ${students.length} alumno(s) en "${confirmAction.col.label}". Esta acción no revierte el XP ya otorgado.`
                : confirmAction.type === "delete-col"
                  ? `Se eliminará la columna "${confirmAction.col.label}" y sus datos en todos los alumnos cargados.${hasMore ? " Hay alumnos en páginas no cargadas que no serán afectados." : ""}`
                  : confirmAction.type === "delete-session"
                    ? `Se eliminará la sesión del ${confirmAction.dateLabel}. El XP ya otorgado no se revertirá.`
                    : `Se eliminará el alumno ${confirmAction.student.displayName || confirmAction.student.email} y todos sus datos (evaluaciones, asistencia, etc.). Esta acción es irreversible.`}
            </p>
            {deleteStudentError && confirmAction.type === "delete-student" && (
              <p className={styles.studentCreateError}>⚠ {deleteStudentError}</p>
            )}
            <div className={styles.confirmActions}>
              <button 
                className={styles.confirmCancel} 
                onClick={() => setConfirmAction(null)}
                disabled={deletingStudentUid !== null}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmOk} 
                onClick={handleConfirm}
                disabled={confirmAction.type === "delete-student" && deletingStudentUid !== null}
              >
                {confirmAction.type === "bulk-reset" 
                  ? "Resetear" 
                  : confirmAction.type === "delete-student" && deletingStudentUid !== null
                    ? "Eliminando…"
                    : "Eliminar"}
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

      {showEvalForm && (
        <div className={styles.confirmBackdrop}>
          <div className={styles.evalFormBox}>
            <h2 className={styles.studentCreateTitle}>
              {evalFormMode === "create" ? "Crear evaluación" : "Editar evaluación"}
            </h2>
            <p className={styles.studentCreateText}>
              Define nombre y tipo para mantener una estructura clara en el gradebook.
            </p>

            <div className={styles.studentCreateField}>
              <label className={styles.sessionFormLabel}>Nombre</label>
              <input
                className={styles.sessionFormInput}
                value={evalFormName}
                onChange={(e) => setEvalFormName(e.target.value)}
                placeholder="Ej: TP de funciones"
                autoFocus
                disabled={savingEvalForm}
              />
            </div>

            <div className={styles.studentCreateField}>
              <label className={styles.sessionFormLabel}>Tipo</label>
              <select
                className={styles.sessionFormInput}
                value={evalFormType}
                onChange={(e) => setEvalFormType(e.target.value as "TP" | "Parcial")}
                disabled={savingEvalForm || evalFormMode === "edit"}
              >
                <option value="TP">TP</option>
                <option value="Parcial">Parcial</option>
              </select>
            </div>

            {evalFormMode === "edit" && (
              <p className={styles.evalFormHint}>El tipo se mantiene fijo para preservar compatibilidad de claves y notas existentes.</p>
            )}

            {evalFormError && <p className={styles.studentCreateError}>⚠ {evalFormError}</p>}

            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={closeEvalForm} disabled={savingEvalForm}>
                Cancelar
              </button>
              <button
                className={styles.confirmOk}
                onClick={handleSaveEvalForm}
                disabled={savingEvalForm || !evalFormName.trim()}
              >
                {savingEvalForm
                  ? "Guardando..."
                  : evalFormMode === "create"
                    ? "Crear evaluación"
                    : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailStudent && (
        <StudentDetailModal
          student={detailStudent}
          materiaId={user.materiaId}
          onClose={() => setDetailStudent(null)}
        />
      )}

      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <h1 className={styles.title}>🎓 Panel del Profesor</h1>
          <span className={styles.subtitle}>Gestión de evaluaciones en tiempo real</span>
        </div>
        <div className={styles.statsRow}>
          <button
            className={styles.createStudentBtn}
            onClick={() => setShowCreateStudent(true)}
            data-tooltip="Crear una nueva cuenta de alumno"
          >
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
              <button
                className={styles.addColBtn}
                onClick={openCreateEvalForm}
              >
                + Agregar evaluación
              </button>
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
                          <span className={styles.colHeaderLabel}>{col.label}</span>
                          <div className={styles.colHeaderActions}>
                            <button
                              className={styles.actionIconBtn}
                              data-tooltip="Renombrar columna"
                              aria-label={`Editar columna ${col.label}`}
                              onClick={() => openEditEvalForm(col)}
                            >
                              <Pencil size={15} strokeWidth={2} aria-hidden="true" />
                            </button>
                            <button
                              className={styles.actionIconBtn}
                              data-tooltip="Marcar todos como Pendiente"
                              aria-label={`Resetear columna ${col.label}`}
                              disabled={bulkingKey === col.key}
                              onClick={() => setConfirmAction({ type: "bulk-reset", col })}
                            >
                              {bulkingKey === col.key ? (
                                <span className={styles.inlineSpinner} aria-hidden="true" />
                              ) : (
                                <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
                              )}
                            </button>
                            <button
                              className={styles.actionIconBtn}
                              data-tooltip="Eliminar columna"
                              aria-label={`Eliminar columna ${col.label}`}
                              onClick={() => setConfirmAction({ type: "delete-col", col })}
                            >
                              <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
                            </button>
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
                    paginatedStudents.map((student) => (
                      <StudentRow
                        key={student.uid}
                        student={student}
                        columns={columns}
                        cellStates={cellStates}
                        onCellChange={handleCellChange}
                        onViewDetails={setDetailStudent}
                        onDeleteStudent={(s) => setConfirmAction({ type: "delete-student", student: s })}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {(filteredStudents.length > 0 || (hasMore && !filterText)) && (
              <div className={styles.loadMoreWrap}>
                <div className={styles.pageInfo}>
                  {filteredStudents.length === 0
                    ? "Sin alumnos cargados"
                    : `${pageStart}-${pageEnd} de ${filteredStudents.length}${hasMore && !filterText ? "+" : ""}`}
                </div>
                <div className={styles.paginationActions}>
                  <button
                    className={styles.loadMoreBtn}
                    onClick={() => setStudentPage((page) => Math.max(0, page - 1))}
                    disabled={currentStudentPage === 0}
                    data-tooltip="Ir al bloque anterior de alumnos"
                  >
                    Anterior
                  </button>
                  <button
                    className={styles.loadMoreBtn}
                    onClick={handleNextStudentPage}
                    disabled={
                      loadingMore ||
                      (currentStudentPage >= totalStudentPages - 1 && (!hasMore || !!filterText))
                    }
                    data-tooltip={loadingMore ? "Cargando más alumnos" : "Ir al siguiente bloque de alumnos"}
                  >
                    {loadingMore ? (
                      <>
                        <span className={styles.inlineSpinner} aria-hidden="true" />
                        Cargando…
                      </>
                    ) : (
                      "Siguiente"
                    )}
                  </button>
                </div>
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
                  {creatingSession ? (
                    <>
                      <span className={styles.inlineSpinner} aria-hidden="true" />
                      Creando…
                    </>
                  ) : (
                    "Crear sesión"
                  )}
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
