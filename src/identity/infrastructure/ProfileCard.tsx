import { cn } from "../../shared/cn"
import type { AvatarClass } from "../domain/User"

const LEVEL_GRADIENT: Record<AvatarClass, string> = {
  Sword:  "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  Axe:    "linear-gradient(135deg,#ef4444,#b91c1c)",
  Dagger: "linear-gradient(135deg,#10b981,#065f46)",
  Bow:    "linear-gradient(135deg,#f59e0b,#b45309)",
  Magic:  "linear-gradient(135deg,#a855f7,#7c3aed)",
}

const AVATAR_EMOJI: Record<AvatarClass, string> = {
  Sword: "⚔️", Axe: "🪓", Dagger: "🗡️", Bow: "🏹", Magic: "🔮",
}

interface ProfileCardProps {
  name: string
  avatarClass: AvatarClass
  level: number
  currentXP: number
  maxXP: number
  isDungeon: boolean
}

export default function ProfileCard({ name, avatarClass, level, currentXP, maxXP, isDungeon }: ProfileCardProps) {
  const progressPercent = Math.min(100, Math.round((currentXP / maxXP) * 100))
  const gradient = LEVEL_GRADIENT[avatarClass] ?? LEVEL_GRADIENT.Magic

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm w-full",
      isDungeon
        ? "bg-white/5 border-white/10 backdrop-blur-sm"
        : "bg-white/80 border-white/60 backdrop-blur-sm"
    )}>
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 border-white/30"
          style={{ background: gradient }}
          aria-label={`Avatar ${avatarClass}`}
        >
          {AVATAR_EMOJI[avatarClass]}
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-mint rounded-full flex items-center justify-center border-2 border-white text-[9px] font-bold text-[#064e3b]">
          {level}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-bold text-sm truncate", isDungeon ? "text-white" : "text-[#1e1b4b]")}>
          {name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-gray-200/60 rounded-full overflow-hidden max-w-[100px]">
            <div
              className="h-full bg-gradient-to-r from-mint to-mint-light rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className={cn("text-xs tabular-nums", isDungeon ? "text-white/60" : "text-gray-500")}>
            {currentXP}/{maxXP} XP
          </span>
        </div>
      </div>
    </div>
  )
}
