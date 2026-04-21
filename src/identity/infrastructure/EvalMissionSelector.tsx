import { cn } from "../../shared/cn"
import type { GradeEntry } from "./useStudentData"
import type { EvalColumn } from "../../shared/useEvalColumns"
import type { EvaluationStatus } from "../../academic/domain/Evaluation"

interface EvalMissionSelectorProps {
  grades: Record<string, GradeEntry | undefined>
  columns: EvalColumn[]
  isDungeon: boolean
}

const STATUS_EMOJI: Record<EvaluationStatus, string> = {
  Victory: "🏆",
  Defeat:  "💀",
  Pending: "⚔️",
  Waiting: "🔒",
}

const STATUS_BG: Record<EvaluationStatus, string> = {
  Victory: "bg-background/80",
  Defeat:  "bg-background/80",
  Pending: "bg-background/60",
  Waiting: "bg-background/40",
}


function MetallicRing() {
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ inset: "-14%", width: "128%", height: "128%" }}
      viewBox="-10 -10 120 120"
      fill="none"
    >
      <defs>
        <linearGradient id="goldRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#c8952a" stopOpacity="0.95" />
          <stop offset="30%"  stopColor="#f5d98e" stopOpacity="0.75" />
          <stop offset="50%"  stopColor="#d4a843" stopOpacity="1"    />
          <stop offset="70%"  stopColor="#f0cc7a" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#c8952a" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="goldDiamondGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#f5d98e" stopOpacity="0.9" />
          <stop offset="50%"  stopColor="#d4a843" stopOpacity="1"   />
          <stop offset="100%" stopColor="#9a6c1a" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="50" cy="50" r="46" stroke="url(#goldRingGradient)" strokeWidth="1.8" fill="none" />
      {/* Inner ring */}
      <circle cx="50" cy="50" r="41" stroke="#d4a843" strokeWidth="0.6" strokeOpacity="0.35" fill="none" />

      {/* Cardinal elongated diamonds — appear on hover */}
      <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Top */}
        <path d="M50 -8 L53  8 L50 18 L47  8 Z" fill="url(#goldDiamondGrad)" />
        {/* Bottom */}
        <path d="M50 82 L53 92 L50 108 L47 92 Z" fill="url(#goldDiamondGrad)" />
        {/* Left */}
        <path d="M-8 50 L8 47 L18 50 L8 53 Z" fill="url(#goldDiamondGrad)" />
        {/* Right */}
        <path d="M82 50 L92 47 L108 50 L92 53 Z" fill="url(#goldDiamondGrad)" />
      </g>

      {/* Small accent dots at 45° positions */}
      <circle cx="82" cy="18" r="2" fill="#d4a843" fillOpacity="0.55" />
      <circle cx="18" cy="18" r="2" fill="#d4a843" fillOpacity="0.55" />
      <circle cx="82" cy="82" r="2" fill="#d4a843" fillOpacity="0.55" />
      <circle cx="18" cy="82" r="2" fill="#d4a843" fillOpacity="0.55" />
    </svg>
  )
}

export default function EvalMissionSelector({ grades, columns, isDungeon }: EvalMissionSelectorProps) {
  if (columns.length === 0) return null

  return (
    <div className={cn(
      "relative flex flex-col items-center py-8 px-6 rounded-3xl",
      isDungeon ? "bg-black/30 backdrop-blur-sm" : "bg-background/90 backdrop-blur-sm"
    )}>
      {/* Vertical timeline line */}
      <div className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent via-border to-transparent top-4 bottom-4" />

      <div className="relative flex flex-col gap-6 z-10">
        {columns.map((col) => {
          const entry = grades[col.key]
          const status: EvaluationStatus = entry?.status ?? "Pending"

          return (
            <div key={col.key} className="relative flex flex-col items-center">
              {/* Avatar circle */}
              <div className={cn(
                "group relative w-20 h-20 rounded-full border border-transparent flex items-center justify-center text-3xl",
                STATUS_BG[status]
              )}>
                <MetallicRing />
                <span className="relative z-10">{STATUS_EMOJI[status]}</span>

              </div>

              {/* Label */}
              <span className={cn(
                "text-xs font-semibold mt-2 text-center w-20",
                isDungeon ? "text-white/70" : "text-muted-foreground"
              )}>
                {col.label}
              </span>

              {/* Timeline dot */}
              <div className={cn(
                "absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full top-1/2 -translate-y-1/2 z-[-1]",
                status === "Victory" ? "bg-gold/60" : "bg-border"
              )} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
