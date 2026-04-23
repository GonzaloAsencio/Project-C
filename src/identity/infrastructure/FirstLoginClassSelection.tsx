import { useMemo, useState } from "react"
import { useAuth } from "../../shared/AuthContext"
import { FirebaseAuthAdapter } from "./FirebaseAuthAdapter"
import {
  PLAYABLE_AVATAR_CLASSES,
  getAvatarVisual,
  type PlayableAvatarClass,
} from "../domain/avatarClasses"
import styles from "./FirstLoginClassSelection.module.css"

const authAdapter = new FirebaseAuthAdapter()

interface FirstLoginClassSelectionProps {
  displayName: string
}

export default function FirstLoginClassSelection({ displayName }: FirstLoginClassSelectionProps) {
  const { user } = useAuth()
  const [selectedClass, setSelectedClass] = useState<PlayableAvatarClass>("maga")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = useMemo(() => PLAYABLE_AVATAR_CLASSES.map((cls) => getAvatarVisual(cls)), [])

  async function handleConfirm() {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await authAdapter.completeStudentAvatarClass(user.uid, selectedClass)
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar tu clase"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.auroraLayer} aria-hidden="true" />
      <div className={styles.panel}>
        <div className={styles.header}>
          <p className={styles.kicker}>Primer ingreso</p>
          <h1 className={styles.title}>Elegi tu clase, {displayName}</h1>
          <p className={styles.subtitle}>
            Esta eleccion es obligatoria para comenzar la aventura.
          </p>
        </div>

        <div className={styles.grid}>
          {options.map((option) => {
            const selected = option.key === selectedClass
            return (
              <button
                key={option.key}
                type="button"
                className={selected ? `${styles.classCard} ${styles.classCardSelected}` : styles.classCard}
                onClick={() => setSelectedClass(option.key as PlayableAvatarClass)}
                disabled={saving}
              >
                {option.image && (
                  <span className={styles.classPreview}>
                    <img src={option.image} alt={option.label} loading="lazy" />
                  </span>
                )}
                <span
                  className={styles.classGlyph}
                  style={{ background: option.gradient, boxShadow: `0 0 22px ${option.glow}` }}
                >
                  {option.emoji}
                </span>
                <span className={styles.classMeta}>
                  <span className={styles.className}>{option.label}</span>
                  <span className={styles.classSubtitle}>{option.subtitle}</span>
                </span>
              </button>
            )
          })}
        </div>

        {error && <p className={styles.error}>⚠ {error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.confirmBtn} onClick={handleConfirm} disabled={saving}>
            {saving ? "Guardando..." : "Confirmar clase"}
          </button>
        </div>
      </div>
    </div>
  )
}
