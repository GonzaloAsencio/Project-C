import clsx from "clsx"
import styles from "./EnemySprite.module.css"

export interface EnemySpriteProps {
  isDefeated: boolean
  enemyType: "tp1" | "tp2" | "parcial1" | "parcial2"
}

const ENEMY_CONFIG: Record<
  EnemySpriteProps["enemyType"],
  { label: string; emoji: string; color: string; glow: string; frames: number }
> = {
  tp1:      { label: "TP 1",      emoji: "👾", color: "#4ade80", glow: "rgba(74,222,128,0.5)",  frames: 4 },
  tp2:      { label: "TP 2",      emoji: "🤖", color: "#facc15", glow: "rgba(250,204,21,0.5)",  frames: 4 },
  parcial1: { label: "Parcial 1", emoji: "💀", color: "#f87171", glow: "rgba(248,113,113,0.6)", frames: 6 },
  parcial2: { label: "Parcial 2", emoji: "🐉", color: "#c084fc", glow: "rgba(192,132,252,0.6)", frames: 6 },
}

export default function EnemySprite({ isDefeated, enemyType }: EnemySpriteProps) {
  const cfg = ENEMY_CONFIG[enemyType]

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
