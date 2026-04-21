import { Trophy, Skull, Sword } from "lucide-react"
import { cn } from "../../shared/cn"
import type { GradeEntry } from "./useStudentData"
import { EVAL_KEYS, EVAL_LABELS } from "./useStudentData"
import type { EvaluationStatus } from "../../academic/domain/Evaluation"

interface EvalListProps {
  grades: Record<string, GradeEntry | undefined>
  isDungeon: boolean
}

const STATUS_ICON: Record<EvaluationStatus, React.ElementType> = {
  Victory: Trophy,
  Defeat: Skull,
  Pending: Sword,
}

const STATUS_ICON_BG: Record<EvaluationStatus, string> = {
  Victory: "bg-mint/20 text-[#059669]",
  Defeat:  "bg-red-400/20 text-red-400",
  Pending: "bg-indigo/10 text-indigo",
}

const STATUS_LABEL: Record<EvaluationStatus, string> = {
  Victory: "Victoria",
  Defeat:  "Derrota",
  Pending: "Pendiente",
}

const STATUS_TEXT_COLOR: Record<EvaluationStatus, string> = {
  Victory: "text-[#059669]",
  Defeat:  "text-red-400",
  Pending: "text-indigo",
}

export default function EvalList({ grades, isDungeon }: EvalListProps) {
  return (
    <div className={cn(
      "rounded-2xl p-6 shadow-sm border w-full",
      isDungeon
        ? "bg-white/5 border-white/10"
        : "bg-white/80 backdrop-blur-sm border-white/60"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={cn("text-xl font-bold tracking-tight", isDungeon ? "text-white" : "text-[#1e1b4b]")}>
            EVALUACIONES
          </h2>
          <p className={cn("text-sm", isDungeon ? "text-white/60" : "text-gray-500")}>
            Resultados de tus trabajos y parciales
          </p>
        </div>
        <Trophy className="w-5 h-5 text-gold-dark" />
      </div>

      <div className="flex flex-col gap-3">
        {EVAL_KEYS.map((key) => {
          const entry = grades[key]
          const status: EvaluationStatus = entry?.status ?? "Pending"
          const Icon = STATUS_ICON[status]

          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
                status === "Victory"
                  ? "bg-mint/10 border border-mint/40 shadow-sm shadow-mint/10"
                  : status === "Defeat"
                    ? "bg-red-400/10 border border-red-400/40 shadow-sm shadow-red-400/10"
                    : isDungeon
                      ? "bg-indigo/10 border border-indigo/30"
                      : "bg-indigo/5 border border-indigo/20"
              )}
            >
              {/* Icon */}
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", STATUS_ICON_BG[status])}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Label + status */}
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm", isDungeon ? "text-white" : "text-[#1e1b4b]")}>
                  {EVAL_LABELS[key]}
                </p>
                <p className={cn("text-xs font-medium mt-0.5", STATUS_TEXT_COLOR[status])}>
                  {STATUS_LABEL[status]}
                </p>
              </div>

              {/* Score badge */}
              {entry && status !== "Pending" && (
                <div className={cn(
                  "px-3 py-1.5 rounded-full shrink-0 font-semibold text-sm",
                  status === "Victory"
                    ? "bg-mint/20 text-[#059669]"
                    : "bg-red-400/20 text-red-400"
                )}>
                  {entry.score} / 10
                </div>
              )}

              {status === "Pending" && (
                <div className="bg-indigo/10 px-3 py-1.5 rounded-full shrink-0">
                  <span className="text-sm font-semibold text-indigo">—</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
