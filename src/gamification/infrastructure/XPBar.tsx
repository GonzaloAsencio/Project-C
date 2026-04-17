import { useEffect, useRef } from "react"
import styles from "./XPBar.module.css"

export interface XPBarProps {
  currentXP: number
  level: number
  xpToNextLevel: number
}

const XP_PER_LEVEL = 100

export default function XPBar({ currentXP, level, xpToNextLevel }: XPBarProps) {
  const prevLevelRef = useRef(level)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (level > prevLevelRef.current && barRef.current) {
      barRef.current.classList.remove(styles.levelup)
      void barRef.current.offsetWidth
      barRef.current.classList.add(styles.levelup)
    }
    prevLevelRef.current = level
  }, [level])

  const xpInCurrentLevel = XP_PER_LEVEL - xpToNextLevel
  const fillPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100)))
  const isMaxLevel = level >= 10

  return (
    <div className={styles.root} ref={barRef} aria-label={`Nivel ${level}, ${currentXP} XP`}>
      <div className={styles.header}>
        <span className={styles.levelBadge}>⭐ Nivel {level}</span>
        <span className={styles.xpValue}>{currentXP} / 960 XP</span>
      </div>

      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${fillPercent}%` }}
          role="progressbar"
          aria-valuenow={currentXP}
          aria-valuemin={0}
          aria-valuemax={960}
        />
      </div>

      {isMaxLevel ? (
        <div className={styles.max}>🏆 ¡Nivel máximo alcanzado!</div>
      ) : (
        <div className={styles.footer}>
          <span>{xpInCurrentLevel} / {XP_PER_LEVEL} XP este nivel</span>
          <span>{xpToNextLevel} XP para nivel {level + 1}</span>
        </div>
      )}
    </div>
  )
}
