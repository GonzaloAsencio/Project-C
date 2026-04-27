import clsx from "clsx"
import styles from "./EnemySprite.module.css"

export interface EnemySpriteProps {
  isDefeated: boolean
  enemyType: string
}

type EnemyConfig = { label: string; emoji: string; color: string; glow: string; frames: number }

const KNOWN_CONFIG: Record<string, EnemyConfig> = {
  tp1:      { label: "TP 1",      emoji: "👾", color: "#4ade80", glow: "rgba(74,222,128,0.5)",  frames: 4 },
  tp2:      { label: "TP 2",      emoji: "🤖", color: "#facc15", glow: "rgba(250,204,21,0.5)",  frames: 4 },
  parcial1: { label: "Parcial 1", emoji: "💀", color: "#f87171", glow: "rgba(248,113,113,0.6)", frames: 6 },
  parcial2: { label: "Parcial 2", emoji: "🐉", color: "#c084fc", glow: "rgba(192,132,252,0.6)", frames: 6 },
}

function getEnemyConfig(key: string): EnemyConfig {
  if (KNOWN_CONFIG[key]) return KNOWN_CONFIG[key]
  const tpMatch = key.match(/^tp(\d+)$/)
  if (tpMatch) {
    return { label: `TP ${tpMatch[1]}`, emoji: "👾", color: "#4ade80", glow: "rgba(74,222,128,0.5)", frames: 4 }
  }
  const parcialMatch = key.match(/^parcial(\d+)$/)
  if (parcialMatch) {
    return { label: `Parcial ${parcialMatch[1]}`, emoji: "💀", color: "#f87171", glow: "rgba(248,113,113,0.6)", frames: 6 }
  }
  return { label: key, emoji: "⚔️", color: "#94a3b8", glow: "rgba(148,163,184,0.5)", frames: 4 }
}

export default function EnemySprite({ isDefeated, enemyType }: EnemySpriteProps) {
  const cfg = getEnemyConfig(enemyType)

  return (
    <div
      className={styles.root}
      role="img"
      aria-label={`Enemigo: ${cfg.label}${isDefeated ? " (derrotado)" : ""}`}
      style={{
        "--enemy-color": cfg.color,
        "--enemy-glow": cfg.glow,
      } as React.CSSProperties}
    >
      <div className={styles.container}>
        <div className={clsx(styles.glowRing, isDefeated && styles.glowRingDefeated)}>
          {cfg.emoji}
        </div>

        {isDefeated
          ? <span className={styles.defeatedText}>¡Derrotado! ✓</span>
          : <span className={styles.label}>{cfg.label}</span>
        }
      </div>
    </div>
  )
}
