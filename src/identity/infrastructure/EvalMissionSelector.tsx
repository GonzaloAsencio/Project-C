import { CalendarDays } from "lucide-react"
import { cn } from "../../shared/cn"

interface EvalMissionSelectorProps {
  isDungeon: boolean
}

export default function EvalMissionSelector({ isDungeon }: EvalMissionSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Section title — same style as Desafíos */}
      <div className="flex w-full items-center justify-center gap-2.5 px-1">
        <CalendarDays
          className="w-5 h-5 shrink-0"
          style={{ color: isDungeon ? "#b5a882" : "#443a22", opacity: 0.65 }}
        />
        <h2 className={cn(
          "text-base font-bold tracking-widest uppercase leading-none",
          isDungeon ? "text-white/90" : "text-[#443a22]"
        )}>
          Eventos
        </h2>
      </div>

      {/* Card */}
      <div className={cn(
        "rounded-2xl py-10 px-6 flex flex-col items-center gap-3 w-full",
        isDungeon
          ? "bg-[#1a150a]/70 border border-[#443a22]/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          : "bg-white/40 backdrop-blur-sm border border-[#c8aa6e]/20 shadow-[0_4px_24px_rgba(30,27,75,0.06)]"
      )}>
        <span className={cn(
          "text-[11px] font-semibold tracking-[0.2em] uppercase",
          isDungeon ? "text-white/30" : "text-[#443a22]/40"
        )}>
          Próximamente
        </span>
      </div>
    </div>
  )
}
