import { Trophy, Skull, Sword } from "lucide-react"
import { cn } from "../../shared/cn"
import type { GradeEntry } from "./useStudentData"
import type { EvalColumn } from "../../shared/useEvalColumns"
import type { EvaluationStatus } from "../../academic/domain/Evaluation"

interface EvalListProps {
  grades: Record<string, GradeEntry | undefined>
  columns: EvalColumn[]
  isDungeon: boolean
}

const STATUS_ICON: Record<EvaluationStatus, React.ElementType> = {
  Victory: Trophy,
  Defeat: Skull,
  Pending: Sword,
}

const STATUS_LABEL: Record<EvaluationStatus, string> = {
  Victory: "Victoria",
  Defeat:  "Derrota",
  Pending: "Pendiente",
}

const STATUS_ICON_COLORS: Record<EvaluationStatus, { ring: string; icon: string; badge: string; label: string }> = {
  Victory: {
    ring:  "shadow-[0_0_0_2px_#f59e0b,0_0_0_4px_#f59e0b22]",
    icon:  "text-amber-400 bg-amber-400/15",
    badge: "bg-amber-400/15 text-amber-400 border border-amber-400/30",
    label: "text-amber-400/60",
  },
  Defeat: {
    ring:  "shadow-[0_0_0_2px_#94a3b8,0_0_0_4px_#94a3b818]",
    icon:  "text-slate-400 bg-slate-400/10",
    badge: "bg-slate-400/10 text-slate-400 border border-slate-400/25",
    label: "text-slate-400/60",
  },
  Pending: {
    ring:  "shadow-[0_0_0_2px_#a5b4fc,0_0_0_4px_#a5b4fc22]",
    icon:  "text-indigo bg-indigo/10",
    badge: "bg-indigo/10 text-indigo/70 border border-indigo/20",
    label: "text-indigo/50",
  },
}

const CARD_LIGHT = "bg-[#faf7f2] border border-[#cfc0a4] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_4px_rgba(0,0,0,0.07)]"
const CARD_DUNGEON = "bg-[#1c1828]/70 border border-[#3d3458] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_4px_rgba(0,0,0,0.35)]"

export default function EvalList({ grades, columns, isDungeon }: EvalListProps) {
  return (
    <div className={cn(
      "rounded-2xl shadow-sm border w-full overflow-hidden",
      isDungeon
        ? "bg-white/5 border-white/10"
        : "bg-white/80 backdrop-blur-sm border-white/60"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-5 py-4 border-b",
        isDungeon ? "border-white/10" : "border-black/5"
      )}>
        <div>
          <h2 className={cn("text-base font-bold tracking-widest uppercase", isDungeon ? "text-white" : "text-[#1e1b4b]")}>
            Evaluaciones
          </h2>
          <p className={cn("text-xs mt-0.5", isDungeon ? "text-white/40" : "text-gray-400")}>
            Trabajos y parciales
          </p>
        </div>
        <Trophy className="w-4 h-4 text-gold-dark opacity-70" />
      </div>

      {/* Quest cards */}
      <div className="flex flex-col gap-2.5 p-4">
        {columns.map((col) => {
          const entry = grades[col.key]
          const status: EvaluationStatus = entry?.status ?? "Pending"
          const Icon = STATUS_ICON[status]
          const colors = STATUS_ICON_COLORS[status]

          return (
            <div
              key={col.key}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150",
                isDungeon ? CARD_DUNGEON : CARD_LIGHT,
              )}
            >
              {/* Circular icon with metallic double-ring */}
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                colors.icon,
                colors.ring,
              )}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Title | separator | subtitle */}
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-xs leading-tight", isDungeon ? "text-white/90" : "text-[#2d2460]")}>
                  {col.label}
                </p>
                <div className={cn("h-px w-full my-1", isDungeon ? "bg-white/10" : "bg-[#cfc0a4]/60")} />
                <p className={cn("text-[10px] truncate", colors.label)}>
                  {col.type === "TP" ? `Aprobar Trabajo Práctico ${col.index}` : `Aprobar Parcial ${col.index}`}
                </p>
              </div>

              {/* Score / status badge */}
              <div className={cn("px-3 py-1 rounded-full shrink-0 text-xs font-semibold tabular-nums", colors.badge)}>
                {status !== "Pending" && entry
                  ? `${entry.score} / 10`
                  : STATUS_LABEL[status]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
