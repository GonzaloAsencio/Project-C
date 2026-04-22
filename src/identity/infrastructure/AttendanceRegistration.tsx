import { useState } from "react"
import { useAuth } from "../../shared/AuthContext"
import { attendanceService } from "../../shared/services"
import { useActiveAttendanceSession } from "./useActiveAttendanceSession"
import styles from "./StudentPanel.module.css"

export default function AttendanceRegistration() {
  const { user } = useAuth()
  const { session, isWithinWindow } = useActiveAttendanceSession()
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!session || !isWithinWindow) return null

  const alreadyPresent = !!user && session.presentStudents.includes(user.uid)

  async function handleRegister() {
    if (!user || !session) return
    setLoading(true)
    setError(null)
    try {
      await attendanceService.markSelfPresent(session.id, user.uid)
      setRegistered(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar asistencia")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.attendanceBlock}>
      <span className={styles.attendanceTitle}>📋 Asistencia de hoy</span>

      {alreadyPresent || registered ? (
        <span className={styles.attendanceConfirmed}>✓ Registro con éxito +20 XP</span>
      ) : (
        <>
          <button className={styles.attendanceBtn} onClick={handleRegister} disabled={loading}>
            {loading ? "Registrando…" : "Registrar asistencia"}
          </button>
          {error && <span style={{ fontSize: "0.8rem", color: "#ef4444" }}>{error}</span>}
        </>
      )}
    </div>
  )
}
