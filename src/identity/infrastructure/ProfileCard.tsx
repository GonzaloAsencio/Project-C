import type { AvatarClass } from "../domain/User"
import { getAvatarVisual } from "../domain/avatarClasses"

interface ProfileCardProps {
  name: string
  avatarClass: AvatarClass | null
  level: number
  currentXP: number
  xpToNextLevel: number
}

export default function ProfileCard({ name, avatarClass, level, currentXP, xpToNextLevel }: ProfileCardProps) {
  const cfg = getAvatarVisual(avatarClass)
  const isMaxLevel = level >= 10
  const totalXPThisLevel = currentXP + xpToNextLevel
  const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.round((currentXP / totalXPThisLevel) * 100))

  return (
    <div className="flex flex-col gap-3 w-full px-1">

      {/* ── Name row ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border border-[#c8aa6e]/50 flex items-center justify-center text-2xl shrink-0"
        >
          {cfg.emoji}
        </div>
        <div className="min-w-0">
          <p className="text-[#1e1b4b] font-bold text-base tracking-wide truncate leading-tight">
            {name}
          </p>
          <p className="text-[#c8aa6e] text-[11px] leading-tight mt-0.5 font-medium">
            {cfg.subtitle}
          </p>
        </div>
      </div>

      {/* ── Level / XP row ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-[#1e1b4b] font-bold text-lg leading-none">Lv. {level}</span>
            <span className="text-[#1e1b4b]/40 text-sm font-medium">/ 10</span>
          </div>
          <span className="text-[#c8aa6e] text-xs tabular-nums font-semibold">
            {isMaxLevel ? "MAX" : `${currentXP} / ${totalXPThisLevel} XP`}
          </span>
        </div>
        <div className="h-2 bg-black/10 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #b8860b, #c8aa6e, #f0e6c8)",
            }}
          />
        </div>
        {!isMaxLevel && (
          <p className="text-[#1e1b4b]/40 text-[10px] text-right">
            {xpToNextLevel} XP para siguiente nivel
          </p>
        )}
      </div>

      {/* ── Separator ── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[#c8aa6e]/50" />
        <span className="text-[#c8aa6e]/80 text-[10px]">◆</span>
        <div className="flex-1 h-px bg-[#c8aa6e]/50" />
      </div>

    </div>
  )
}
