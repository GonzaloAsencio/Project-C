import { useState } from "react"
import clsx from "clsx"
import { CheckCheck, ChevronDown, Eraser, Trash2 } from "lucide-react"
import type { ClassSession } from "../application/AttendanceService"
import type { StudentDocument } from "./useTeacherData"
import styles from "./TeacherPanel.module.css"

interface AttendanceSessionProps {
  session: ClassSession
  students: StudentDocument[]
  checkStates: Record<string, boolean>
  onToggle: (classId: string, studentUid: string, isPresent: boolean) => void
  onMarkAll: (classId: string) => void
  onClearAll: (classId: string) => void
  onDelete: (sessionId: string, dateLabel: string) => void
}

export default function AttendanceSession({
  session,
  students,
  checkStates,
  onToggle,
  onMarkAll,
  onClearAll,
  onDelete,
}: AttendanceSessionProps) {
  const [collapsed, setCollapsed] = useState(true)
  const presentCount = session.presentStudents.length
  const dateLabel = session.date.toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
  const isBulkLoading =
    checkStates[`markAll_${session.id}`] || checkStates[`clearAll_${session.id}`]

  return (
    <div className={styles.sessionBlock}>
      <div className={styles.sessionHeader}>
        <span>📅</span>
        <span className={styles.sessionDate}>{dateLabel}</span>
        {session.selfRegistration && (
          <span className={styles.sessionSelfRegBadge} data-tooltip="Auto-registro habilitado">🔓</span>
        )}
        <span className={styles.sessionCount}>
          {presentCount}/{students.length} presentes
        </span>
        <div className={styles.sessionActions}>
          <button
            className={clsx(styles.actionIconBtn, styles.sessionCollapseBtn)}
            onClick={() => setCollapsed((prev) => !prev)}
            data-tooltip={collapsed ? "Abrir sesión" : "Cerrar sesión"}
            aria-label={`${collapsed ? "Abrir" : "Cerrar"} sesión ${dateLabel}`}
          >
            <ChevronDown
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className={clsx(styles.sessionCollapseIcon, collapsed && styles.sessionCollapseIconCollapsed)}
            />
          </button>
          <button
            className={styles.actionIconBtn}
            disabled={!!isBulkLoading || presentCount === students.length}
            onClick={() => onMarkAll(session.id)}
            data-tooltip="Marcar todos presentes"
            aria-label={`Marcar presentes en ${dateLabel}`}
          >
            <CheckCheck size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            className={styles.actionIconBtn}
            disabled={!!isBulkLoading}
            onClick={() => {
              if (window.confirm("¿Desmarcar a todos los alumnos?\nEl XP ya otorgado no se revertirá.")) {
                onClearAll(session.id)
              }
            }}
            data-tooltip="Desmarcar todos"
            aria-label={`Limpiar asistencia de ${dateLabel}`}
          >
            <Eraser size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            className={styles.actionIconBtn}
            disabled={!!isBulkLoading}
            onClick={() => onDelete(session.id, dateLabel)}
            data-tooltip="Eliminar sesión"
            aria-label={`Eliminar sesión ${dateLabel}`}
          >
            <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
      {!collapsed && <div className={styles.attGrid}>
        {students.map((student) => {
          const isPresent = session.presentStudents.includes(student.uid)
          const isSaving = checkStates[`${session.id}_${student.uid}`] ?? false
          return (
            <button
              key={student.uid}
              className={clsx(
                styles.attStudent,
                isPresent && styles.attStudentPresent,
                isSaving && styles.attStudentSaving,
              )}
              disabled={isSaving}
              aria-label={`${isPresent ? "Marcar ausente" : "Marcar presente"}: ${student.displayName || student.email}`}
              onClick={() => onToggle(session.id, student.uid, !isPresent)}
            >
              <div className={styles.attCheckbox}>
                {isPresent && <span style={{ fontSize: "0.7rem" }}>✓</span>}
              </div>
              <div className={styles.attStudentInfo}>
                <span className={styles.attName}>{student.displayName || student.email}</span>
                <span className={styles.attEmail}>{student.email}</span>
              </div>
            </button>
          )
        })}
      </div>}
    </div>
  )
}
