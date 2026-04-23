import { useEffect, useState } from "react"
import { cn } from "../../shared/cn"
import styles from "./XPToast.module.css"

interface Props {
  gain: number
  isDungeon: boolean
  onDismiss: () => void
}

export function XPToast({ gain, isDungeon, onDismiss }: Props) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 2200)
    return () => clearTimeout(timer)
  }, [])

  function handleAnimationEnd() {
    if (exiting) onDismiss()
  }

  return (
    <div
      className={cn(
        styles.toast,
        isDungeon ? styles.dungeon : styles.normal,
        exiting && styles.exiting
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onAnimationEnd={handleAnimationEnd}
    >
      <span className={styles.gem} aria-hidden="true">✦</span>
      <div className={styles.body}>
        <span className={styles.label}>Experiencia ganada</span>
        <span className={styles.amount}>+{gain} XP</span>
      </div>
    </div>
  )
}
