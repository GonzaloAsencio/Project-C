import { useCallback, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useAuth } from "../../shared/AuthContext"
import { FirebaseAuthAdapter } from "./FirebaseAuthAdapter"
import {
  PLAYABLE_AVATAR_CLASSES,
  getAvatarVisual,
} from "../domain/avatarClasses"
import styles from "./FirstLoginClassSelection.module.css"

const authAdapter = new FirebaseAuthAdapter()

interface FirstLoginClassSelectionProps {
  displayName: string
}

export default function FirstLoginClassSelection({ displayName }: FirstLoginClassSelectionProps) {
  const { user } = useAuth()
  const [selectedIndex, setSelectedIndex] = useState(2)
  const [phase, setPhase] = useState<"idle" | "saving" | "success">("idle")
  const [error, setError] = useState<string | null>(null)
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([])

  const options = useMemo(() => PLAYABLE_AVATAR_CLASSES.map((cls) => getAvatarVisual(cls)), [])
  const selectedClass = options[selectedIndex]?.key

  const particles = useMemo(
    () =>
      Array.from({ length: 52 }, (_, i) => ({
        id: i,
        left: `${Math.round((Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453)) * 100)}%`,
        top: `${Math.round((Math.sin(i * 78.233) * 18342.1321 - Math.floor(Math.sin(i * 78.233) * 18342.1321)) * 100)}%`,
        size: 1 + (i % 3),
        delay: (i % 10) * 0.42,
        duration: 9 + (i % 7),
      })),
    []
  )

  const visibleOptions = useMemo(() => {
    const items: Array<(typeof options)[number] & { position: number }> = []
    for (let i = -3; i <= 3; i += 1) {
      const index = (selectedIndex + i + options.length) % options.length
      items.push({ ...options[index], position: i })
    }
    return items
  }, [options, selectedIndex])

  const handlePrevious = useCallback(() => {
    if (phase !== "idle") return
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1))
  }, [options.length, phase])

  const handleNext = useCallback(() => {
    if (phase !== "idle") return
    setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0))
  }, [options.length, phase])

  const handleSpark = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (phase !== "idle") return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const id = Date.now()
    setSparkles((prev) => [...prev, { id, x, y }])
    setTimeout(() => {
      setSparkles((prev) => prev.filter((spark) => spark.id !== id))
    }, 750)
  }, [phase])

  async function handleConfirm() {
    if (!user || !selectedClass) return
    setPhase("saving")
    setError(null)
    try {
      await authAdapter.completeStudentAvatarClass(user.uid, selectedClass)
      setPhase("success")
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar tu clase"
      setError(message)
      setPhase("idle")
    }
  }

  return (
    <div className={phase === "success" ? `${styles.root} ${styles.rootSuccess}` : styles.root}>
      <div className={styles.auroraLayer} aria-hidden="true" />
      <div className={styles.particleLayer} aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={styles.particle}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: particle.left,
              top: particle.top,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>
      {phase === "success" && (
        <div className={styles.successOverlay} role="status" aria-live="polite">
          <p className={styles.successTitle}>Clase vinculada</p>
          <p className={styles.successSubtitle}>Preparando tu panel...</p>
        </div>
      )}
      <div className={styles.panel}>
        <button type="button" className={styles.closeBtn} aria-label="Cerrar seleccion de clase">
          <X size={20} />
        </button>

        <div className={styles.bannerStage}>
          {visibleOptions.map((option) => {
            const isCenter = option.position === 0
            const absPosition = Math.abs(option.position)
            const centerWidth = 306
            const sideWidth = 224
            const gap = 34
            const width = isCenter ? centerWidth : sideWidth
            const height = isCenter ? 772 : 704 - absPosition * 38
            const firstOffset = (centerWidth + sideWidth) / 2 + gap
            const stackedOffset = sideWidth + gap
            const translateX =
              option.position === 0
                ? 0
                : Math.sign(option.position)
                  * (firstOffset + (absPosition - 1) * stackedOffset)
            const translateY = absPosition <= 1 ? 54 : 54 - (absPosition - 1) * 42

            return (
              <article
                key={`${option.key}_${option.position}`}
                className={isCenter ? `${styles.banner} ${styles.bannerCenter}` : styles.banner}
                data-position={option.position}
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  marginLeft: `${-width / 2}px`,
                  transform: `translateX(${translateX}px) translateY(${translateY}px)`,
                  zIndex: 10 - absPosition,
                  opacity: 1 - absPosition * 0.05,
                }}
                onClick={() => {
                  if (phase !== "idle") return
                  if (option.position === 0) return
                  const index = (selectedIndex + option.position + options.length) % options.length
                  setSelectedIndex(index)
                }}
                aria-hidden={!isCenter}
              >
                {option.image && (
                  <img className={styles.bannerImage} src={option.image} alt={option.label} loading="lazy" />
                )}
                <div className={styles.bannerShade} />
                <div className={styles.bannerMeta}>
                  <span className={styles.className}>{option.label}</span>
                  <span className={styles.classSubtitle}>{option.subtitle}</span>
                </div>
              </article>
            )
          })}
        </div>

        <div className={styles.footerCopy}>
          <p className={styles.footerTitle}>El destino aguarda...</p>
          <p className={styles.footerSubtitle}>Un nuevo mundo, el comienzo del viaje hacia tu aventura.</p>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={handlePrevious}
            disabled={phase !== "idle"}
            aria-label="Clase anterior"
          >
            <ChevronLeft size={20} />
            <ChevronLeft size={20} className={styles.navStack} />
          </button>

          <div className={styles.confirmWrap}>
            {sparkles.map((spark) => (
              <span
                key={spark.id}
                className={styles.spark}
                style={{ left: `${spark.x}px`, top: `${spark.y}px` }}
                aria-hidden="true"
              />
            ))}
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={(event) => {
                handleSpark(event)
                void handleConfirm()
              }}
              disabled={phase !== "idle"}
            >
              <span className={styles.confirmText}>
                {phase === "saving"
                  ? "Invocando clase..."
                  : phase === "success"
                    ? "Listo"
                    : "Despertar"}
              </span>
            </button>
          </div>

          <button
            type="button"
            className={styles.navBtn}
            onClick={handleNext}
            disabled={phase !== "idle"}
            aria-label="Clase siguiente"
          >
            <ChevronRight size={20} />
            <ChevronRight size={20} className={styles.navStack} />
          </button>
        </div>

        <div className={styles.progressDots} aria-hidden="true">
          {options.map((option, index) => (
            <span
              key={option.key}
              className={index === selectedIndex ? `${styles.dot} ${styles.dotActive}` : styles.dot}
            />
          ))}
        </div>

        <p className={styles.welcomeText}>Elegi tu clase, {displayName}</p>

        {error && <p className={styles.error}>⚠ {error}</p>}
      </div>
    </div>
  )
}
