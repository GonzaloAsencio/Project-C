import { cn } from "../../shared/cn"
import type { AvatarClass } from "../domain/User"
import { getAvatarVisual } from "../domain/avatarClasses"

interface AvatarDisplayProps {
  displayName: string
  avatarClass: AvatarClass | null
  isVictoryAnim: boolean
  isDungeon: boolean
}

export default function AvatarDisplay({ displayName, avatarClass, isVictoryAnim, isDungeon }: AvatarDisplayProps) {
  const cfg = getAvatarVisual(avatarClass)

  return (
    <div className="relative flex items-center justify-center w-[320px] h-[320px] sm:w-[420px] sm:h-[420px]">
      {/* Outer spinning ring */}
      <div className="absolute w-[90%] h-[90%] rounded-full border-2 border-dashed border-indigo/20 animate-[spin_30s_linear_infinite]" />

      {/* Middle ring */}
      <div className="absolute w-[75%] h-[75%] rounded-full border border-mint/20" />

      {/* Inner glow */}
      <div
        className="absolute w-[60%] h-[60%] rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`, opacity: 0.3 }}
      />

      {/* Floating particles */}
      <div className="absolute w-3 h-3 rounded-full bg-mint/40 top-8 left-1/2 -translate-x-12 animate-bounce" style={{ animationDelay: "0s", animationDuration: "3s" }} />
      <div className="absolute w-2 h-2 rounded-full bg-indigo/30 top-16 right-12 animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "2.5s" }} />
      <div className="absolute w-3 h-3 rounded-full bg-mint/30 bottom-16 left-12 animate-bounce" style={{ animationDelay: "1s", animationDuration: "3.5s" }} />
      <div className="absolute w-2 h-2 rounded-full bg-gold/60 bottom-20 right-16 animate-bounce" style={{ animationDelay: "1.5s", animationDuration: "2s" }} />

      {/* Diamond accents */}
      <div className="absolute w-4 h-4 bg-mint/20 rotate-45 top-10 right-20" />
      <div className="absolute w-3 h-3 bg-indigo/20 rotate-45 bottom-14 left-20" />
      <div className="absolute w-5 h-5 bg-lavender/60 rotate-45 top-28 left-10" />

      {/* Avatar circle + emoji */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className={cn(
            "w-44 h-44 sm:w-52 sm:h-52 rounded-full flex items-center justify-center text-7xl sm:text-8xl shadow-2xl border-4 border-white/20 transition-transform",
            isVictoryAnim && "animate-[victoryBounce_0.5s_cubic-bezier(0.34,1.56,0.64,1)_3]"
          )}
          style={{
            background: cfg.gradient,
            boxShadow: `0 0 60px ${cfg.glow}, 0 20px 40px rgba(0,0,0,0.2)`,
          }}
          aria-label={`Avatar clase ${avatarClass}`}
        >
          {cfg.emoji}
        </div>

        <div className="text-center">
          <h2 className={cn("text-xl sm:text-2xl font-bold", isDungeon ? "text-white" : "text-[#1e1b4b]")}>
            {displayName}
          </h2>
          <p className={cn("text-sm", isDungeon ? "text-white/60" : "text-gray-500")}>
            {cfg.subtitle}
          </p>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-mint/30 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-indigo/20 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-indigo/20 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-mint/30 rounded-br-2xl" />
    </div>
  )
}
