import clsx from "clsx"
import type { ClassSession } from "../application/AttendanceService"
import type { StudentDocument } from "./useTeacherData"
import styles from "./TeacherPanel.module.css"

interface AttendanceSessionProps {
  session: ClassSession
  students: StudentDocument[]
  checkStates: Record<string, boolean>
  onToggle: (classId: string, studentUid: string, isPresent: boolean) => void
}

export default function AttendanceSession({ session, students, checkStates, onToggle }: AttendanceSessionProps) {
  const presentCount = session.presentStudents.length
  const dateLabel = session.date.toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div className={styles.sessionBlock}>
      <div className={styles.sessionHeader}>
        <span>📅</span>
        <span className={styles.sessionDate}>{dateLabel}</span>
        <span className={styles.sessionCount}>
          {presentCount}/{students.length} presentes
        </span>
      </div>
      <div className={styles.attGrid}>
        {students.map((student) => {
          const isPresent = session.presentStudents.includes(student.uid)
          const isSaving = checkStates[`${session.id}_${student.uid}`] ?? false
          const initials = (student.displayName || student.email).slice(0, 2).toUpperCase()
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
              <div className={styles.studentAvatar} style={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                {initials}
              </div>
              <span className={styles.attName}>{student.displayName || student.email}</span>
              {isPresent && <span className={styles.attXp}>+20 XP</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
