import clsx from "clsx"
import type { AvatarClass } from "../domain/User"
import styles from "./AvatarHeader.module.css"

const AVATAR_CONFIG: Record<AvatarClass, { emoji: string; color: string; gradient: string }> = {
  Sword:  { emoji: "⚔️", color: "#60a5fa", gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)" },
  Axe:    { emoji: "🪓", color: "#f87171", gradient: "linear-gradient(135deg,#ef4444,#b91c1c)" },
  Dagger: { emoji: "🗡️", color: "#34d399", gradient: "linear-gradient(135deg,#10b981,#065f46)" },
  Bow:    { emoji: "🏹", color: "#fbbf24", gradient: "linear-gradient(135deg,#f59e0b,#b45309)" },
  Magic:  { emoji: "🔮", color: "#c084fc", gradient: "linear-gradient(135deg,#a855f7,#7c3aed)" },
}

interface AvatarHeaderProps {
  displayName: string
  email: string
  avatarClass: AvatarClass
  isVictoryAnim: boolean
  isDungeon: boolean
}

export default function AvatarHeader({
  displayName,
  email,
  avatarClass,
  isVictoryAnim,
  isDungeon,
}: AvatarHeaderProps) {
  const cfg = AVATAR_CONFIG[avatarClass] ?? AVATAR_CONFIG.Magic

  return (
    <div className={styles.header}>
      <div className={styles.avatarRing}>
        <div
          className={clsx(styles.avatarInner, isVictoryAnim && styles.avatarInnerVictory)}
          style={{ "--avatar-gradient": cfg.gradient } as React.CSSProperties}
          aria-label={`Avatar clase ${avatarClass}`}
        >
          {cfg.emoji}
        </div>
      </div>
      <span className={clsx(styles.name, isDungeon && styles.nameDungeon)}>
        {displayName || email}
      </span>
      <span
        className={styles.classBadge}
        style={{ "--avatar-gradient": cfg.gradient } as React.CSSProperties}
      >
        {cfg.emoji} {avatarClass}
      </span>
    </div>
  )
}
