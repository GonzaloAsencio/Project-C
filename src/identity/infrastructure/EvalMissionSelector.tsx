import { cn } from "../../shared/cn"
import type { GradeEntry } from "./useStudentData"
import { EVAL_KEYS, EVAL_LABELS } from "./useStudentData"
import type { EvaluationStatus } from "../../academic/domain/Evaluation"

interface EvalMissionSelectorProps {
  grades: Record<string, GradeEntry | undefined>
  isDungeon: boolean
}

const STATUS_EMOJI: Record<EvaluationStatus, string> = {
  Victory: "🏆",
  Defeat:  "💀",
  Pending: "⚔️",
}

const STATUS_BG: Record<EvaluationStatus, string> = {
  Victory: "bg-mint/20 border-mint/40",
  Defeat:  "bg-red-400/20 border-red-400/40",
  Pending: "bg-indigo/10 border-indigo/30",
}

const STATUS_GLOW: Record<EvaluationStatus, string> = {
  Victory: "rgba(74,222,128,0.4)",
  Defeat:  "rgba(248,113,113,0.4)",
  Pending: "rgba(79,70,229,0.3)",
}

const TYPE_BADGE: Record<string, string> = {
  tp1: "TP", tp2: "TP", parcial1: "P", parcial2: "P",
}

const TYPE_BADGE_COLOR: Record<string, string> = {
  tp1: "bg-indigo/90 text-white", tp2: "bg-indigo/90 text-white",
  parcial1: "bg-gold/90 text-gold-dark", parcial2: "bg-gold/90 text-gold-dark",
}

function MetallicRing({ status }: { status: EvaluationStatus }) {
  const strokeColor = status === "Victory" ? "var(--mint)" : status === "Defeat" ? "#f87171" : "var(--indigo)"
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.6" fill="none" />
      <circle cx="50" cy="50" r="44" stroke={strokeColor} strokeWidth="0.75" strokeOpacity="0.3" fill="none" />
      <path d="M50 4 L50 10 M50 90 L50 96 M4 50 L10 50 M90 50 L96 50"
        stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M50 2 L52 5 L50 8 L48 5 Z" fill={strokeColor} fillOpacity="0.6" />
      <path d="M50 92 L52 95 L50 98 L48 95 Z" fill={strokeColor} fillOpacity="0.6" />
    </svg>
  )
}

export default function EvalMissionSelector({ grades, isDungeon }: EvalMissionSelectorProps) {
  return (
    <div className={cn(
      "relative flex flex-col items-center py-8 px-6 rounded-3xl",
      isDungeon ? "bg-black/30 backdrop-blur-sm" : "bg-background/90 backdrop-blur-sm"
    )}>
      {/* Vertical timeline line */}
      <div className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent via-border to-transparent top-4 bottom-4" />

      <div className="relative flex flex-col gap-6 z-10">
        {EVAL_KEYS.map((key) => {
          const entry = grades[key]
          const status: EvaluationStatus = entry?.status ?? "Pending"

          return (
            <div key={key} className="relative flex flex-col items-center">
              {/* Glow aura */}
              {status === "Victory" && (
                <div
                  className="absolute inset-0 w-20 h-20 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${STATUS_GLOW[status]} 0%, transparent 70%)`,
                    opacity: 0.4,
                    filter: "blur(10px)",
                    transform: "scale(1.4)",
                  }}
                />
              )}

              {/* Avatar circle */}
              <div className={cn("relative w-20 h-20 rounded-full", STATUS_BG[status], "border-2 flex items-center justify-center text-3xl")}>
                <MetallicRing status={status} />
                <span className="relative z-10">{STATUS_EMOJI[status]}</span>

                {/* Type badge */}
                <div className={cn(
                  "absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border",
                  TYPE_BADGE_COLOR[key]
                )}>
                  {TYPE_BADGE[key]}
                </div>
              </div>

              {/* Label */}
              <span className={cn("text-xs font-semibold mt-2 text-center w-20", isDungeon ? "text-white/70" : "text-muted-foreground")}>
                {EVAL_LABELS[key]}
              </span>

              {/* Timeline dot */}
              <div className={cn(
                "absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full top-1/2 -translate-y-1/2 z-[-1]",
                status === "Victory" ? "bg-mint" : "bg-border"
              )} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
