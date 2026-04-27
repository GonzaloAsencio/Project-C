import clsx from "clsx"
import type { AvatarClass } from "../domain/User"
import { getAvatarVisual } from "../domain/avatarClasses"
import styles from "./AvatarHeader.module.css"

interface AvatarHeaderProps {
  displayName: string
  email: string
  avatarClass: AvatarClass | null
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
  const cfg = getAvatarVisual(avatarClass)

  return (
    <div className={styles.header}>
      <div className={styles.avatarRing}>
        <div
          className={clsx(styles.avatarInner, isVictoryAnim && styles.avatarInnerVictory)}
          style={{ "--avatar-gradient": cfg.gradient } as React.CSSProperties}
          aria-label={`Avatar clase ${avatarClass}`}
        >
          {cfg.icon && <img src={cfg.icon} alt={cfg.label} className="w-full h-full object-contain" />}
        </div>
      </div>
      <span className={clsx(styles.name, isDungeon && styles.nameDungeon)}>
        {displayName || email}
      </span>
      <span
        className={styles.classBadge}
        style={{ "--avatar-gradient": cfg.gradient } as React.CSSProperties}
      >
        {cfg.label}
      </span>
    </div>
  )
}
