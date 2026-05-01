import { useEffect } from "react"
import clsx from "clsx"
import styles from "./TeacherToast.module.css"

export type TeacherToastTone = "success" | "error" | "info"

export interface TeacherToastItem {
  id: number
  tone: TeacherToastTone
  message: string
}

interface TeacherToastProps {
  toasts: TeacherToastItem[]
  onDismiss: (id: number) => void
}

const TONE_ICON: Record<TeacherToastTone, string> = {
  success: "✓",
  error: "⚠",
  info: "i",
}

export default function TeacherToast({ toasts, onDismiss }: TeacherToastProps) {
  return (
    <div className={styles.toastViewport} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: TeacherToastItem
  onDismiss: (id: number) => void
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => onDismiss(toast.id), 3400)
    return () => window.clearTimeout(timeoutId)
  }, [toast.id, onDismiss])

  return (
    <div
      className={clsx(
        styles.toast,
        toast.tone === "success" && styles.toneSuccess,
        toast.tone === "error" && styles.toneError,
        toast.tone === "info" && styles.toneInfo,
      )}
      role="status"
    >
      <span className={styles.icon} aria-hidden="true">{TONE_ICON[toast.tone]}</span>
      <div className={styles.body}>
        <p className={styles.message}>{toast.message}</p>
      </div>
      <button
        type="button"
        className={styles.dismissBtn}
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  )
}
