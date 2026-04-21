import { useEffect, useRef } from "react"
import { cn } from "../../shared/cn"

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
      barRef.current.animate(
        [{ filter: "brightness(1)" }, { filter: "brightness(2)" }, { filter: "brightness(1)" }],
        { duration: 700, easing: "ease" }
      )
    }
    prevLevelRef.current = level
  }, [level])

  const xpInCurrentLevel = XP_PER_LEVEL - xpToNextLevel
  const fillPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100)))
  const isMaxLevel = level >= 10

  return (
    <div
      ref={barRef}
      className="flex items-center gap-3 bg-gradient-to-r from-indigo-dark to-indigo px-5 py-3 rounded-full shadow-lg w-full"
      aria-label={`Nivel ${level}, ${currentXP} XP`}
    >
      {/* Status dot */}
      <div className="w-2.5 h-2.5 rounded-full bg-mint animate-pulse shrink-0" />

      {/* Label */}
      <span className="text-white font-bold text-sm tracking-wide hidden sm:block">SEASON PROGRESS</span>

      {/* Level badge */}
      <div className="bg-mint px-3 py-1 rounded-full shrink-0">
        <span className="font-bold text-xs text-[#064e3b]">LVL {level}</span>
      </div>

      {/* Progress bar + XP text */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          ref={barRef}
          className={cn("flex-1 h-2.5 bg-white/20 rounded-full overflow-hidden", isMaxLevel && "opacity-50")}
          role="progressbar"
          aria-valuenow={currentXP}
          aria-valuemin={0}
          aria-valuemax={960}
        >
          <div
            className="h-full bg-mint rounded-full transition-all duration-500"
            style={{ width: `${isMaxLevel ? 100 : fillPercent}%` }}
          />
        </div>
        <span className="text-white/80 text-xs font-medium shrink-0 tabular-nums">
          {isMaxLevel ? "MAX" : `${xpInCurrentLevel}/${XP_PER_LEVEL}`}
        </span>
      </div>
    </div>
  )
}
