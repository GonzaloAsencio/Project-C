import { useState } from "react"
import { createPortal } from "react-dom"
import { Sword, BookOpen, CalendarCheck, Lock, Swords } from "lucide-react"
import { cn } from "../../shared/cn"
import { useAuth } from "../../shared/AuthContext"
import { attendanceService, progressRepo } from "../../shared/services"
import { useActiveAttendanceSession } from "./useActiveAttendanceSession"
import { VictoryModal } from "../../gamification/infrastructure/victory/VictoryModal"
import { DefeatModal } from "../../gamification/infrastructure/defeat/DefeatModal"
import type { GradeEntry } from "./useStudentData"
import type { EvalColumn } from "../../shared/useEvalColumns"
import type { EvaluationStatus } from "../../academic/domain/Evaluation"

interface EvalListProps {
  grades: Record<string, GradeEntry | undefined>
  columns: EvalColumn[]
  isDungeon: boolean
}

const ICON_COLORS: Record<EvaluationStatus | "attendance", string> = {
  Victory:    "text-emerald-500",
  Defeat:     "text-red-400",
  Pending:    "text-indigo-400",
  Waiting:    "text-slate-300",
  attendance: "text-emerald-500",
}


const XP_REWARD: Record<"TP" | "Parcial", number> = { TP: 70, Parcial: 200 }

function loadClaimed(uid: string): Set<string> {
  try {
    const raw = localStorage.getItem(`desafios_claimed_${uid}`)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function persistClaimed(uid: string, keys: Set<string>) {
  try {
    localStorage.setItem(`desafios_claimed_${uid}`, JSON.stringify([...keys]))
  } catch { /* storage full — ignore */ }
}

export default function EvalList({ grades, columns, isDungeon }: EvalListProps) {
  const { user } = useAuth()
  const { session, isWithinWindow } = useActiveAttendanceSession()
  const [claimedKeys, setClaimedKeys] = useState<Set<string>>(() =>
    user ? loadClaimed(user.uid) : new Set()
  )
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceRegistered, setAttendanceRegistered] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<{ type: "victory" | "defeat"; label: string } | null>(null)
  const [claimLoading, setClaimLoading] = useState<string | null>(null)

  const hasAttendance = !!session && isWithinWindow
  const alreadyPresent = !!user && !!session && session.presentStudents.includes(user.uid)

  async function handleAttendance() {
    if (!user || !session) return
    setAttendanceLoading(true)
    setAttendanceError(null)
    try {
      await attendanceService.markSelfPresent(session.id, user.uid)
      setAttendanceRegistered(true)
    } catch (e) {
      setAttendanceError(e instanceof Error ? e.message : "Error al registrar asistencia")
    } finally {
      setAttendanceLoading(false)
    }
  }

  async function handleViewResult(col: EvalColumn, status: EvaluationStatus) {
    if (!user) return
    setClaimLoading(col.key)
    const next = new Set(claimedKeys).add(col.key)
    setClaimedKeys(next)
    persistClaimed(user.uid, next)

    if (status === "Victory") {
      const evalId = `${user.uid}_${col.type === "TP" ? "tp" : "parcial"}${col.index}`
      const xpReward = XP_REWARD[col.type]
      try {
        await progressRepo.addXPIdempotent(user.uid, xpReward, evalId)
        const confetti = (await import("canvas-confetti")).default
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      } catch (e) {
        console.error("[EvalList] claim XP failed:", e)
      }
      setActiveModal({ type: "victory", label: col.label })
    } else {
      setActiveModal({ type: "defeat", label: col.label })
    }
    setClaimLoading(null)
  }


  return (
    <>
      {/* ── Header — outside the card ── */}
      <div className="flex items-center gap-2.5 px-1">
        <Swords
          className="w-5 h-5 shrink-0"
          style={{ color: isDungeon ? "#a5b4fc" : "#1e1b4b", opacity: 0.65 }}
        />
        <h2 className={cn(
          "text-base font-bold tracking-widest uppercase leading-none",
          isDungeon ? "text-white/90" : "text-[#1e1b4b]"
        )}>
          Desafíos
        </h2>
      </div>

      <div className={cn(
        "rounded-2xl overflow-hidden w-full",
        isDungeon
          ? "bg-[#0d0d1a]/70 border border-purple-400/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          : "bg-white/40 backdrop-blur-sm border border-[#c8aa6e]/20 shadow-[0_4px_24px_rgba(30,27,75,0.06)]"
      )}>

        {/* ── Mission rows ── */}
        <div className="flex flex-col pb-1">

          {hasAttendance && (
            <MissionRow
              icon={<CalendarCheck className="w-[17px] h-[17px]" />}
              iconClass={ICON_COLORS["attendance"]}
              title="Asistencia"
              subtitle="Ganar +20 XP"
              xp="+20 XP"
              isDungeon={isDungeon}
              done={alreadyPresent || attendanceRegistered}
              action={
                alreadyPresent || attendanceRegistered
                  ? <ClaimedBadge color="emerald" />
                  : <ActionButton
                      label={attendanceLoading ? "Registrando…" : "Registrar"}
                      onClick={handleAttendance}
                      disabled={attendanceLoading}
                      variant="primary"
                      isDungeon={isDungeon}
                    />
              }
              error={attendanceError}
            />
          )}

          {columns.length === 0 && !hasAttendance && (
            <p className={cn("text-center text-xs py-6", isDungeon ? "text-white/30" : "text-[#1e1b4b]/30")}>
              No hay desafíos disponibles
            </p>
          )}

          {columns.map((col) => {
            const entry  = grades[col.key]
            const status: EvaluationStatus = entry?.status ?? "Waiting"
            const claimed = claimedKeys.has(col.key)
            const loading = claimLoading === col.key
            const TypeIcon = col.type === "TP" ? Sword : BookOpen
            const xp = XP_REWARD[col.type]

            let action: React.ReactNode
            if (status === "Waiting") {
              action = (
                <span className={cn("flex items-center gap-1 text-[11px] font-medium",
                  isDungeon ? "text-white/25" : "text-slate-400/70")}>
                  <Lock className="w-3 h-3" /> Bloqueado
                </span>
              )
            } else if (status === "Pending") {
              action = (
                <span className={cn("text-[11px] font-semibold",
                  isDungeon ? "text-indigo-300/70" : "text-indigo-500")}>
                  En progreso…
                </span>
              )
            } else if (claimed) {
              action = status === "Victory"
                ? <ClaimedBadge color="emerald" />
                : <ClaimedBadge color="slate" />
            } else {
              action = (
                <ActionButton
                  label={loading ? "…" : "Ver resultado"}
                  onClick={() => handleViewResult(col, status)}
                  disabled={loading}
                  variant="neutral"
                  isDungeon={isDungeon}
                />
              )
            }

            return (
              <MissionRow
                key={col.key}
                icon={<TypeIcon className="w-[17px] h-[17px]" />}
                iconClass={ICON_COLORS[status]}
                title={col.label}
                subtitle={`Ganar +${xp} XP`}
                xp={status === "Defeat" && claimed ? "0 XP" : `+${xp} XP`}
                isDungeon={isDungeon}
                done={claimed}
                action={action}
              />
            )
          })}
        </div>
      </div>

      {/* ── Closing fade — visual end marker ── */}
      <div className="flex items-center gap-3 px-1 opacity-40">
        <div className="flex-1 h-px" style={{ background: isDungeon ? "rgba(165,180,252,0.2)" : "rgba(200,170,110,0.25)" }} />
        <span className="text-[8px] leading-none select-none" style={{ color: isDungeon ? "rgba(165,180,252,0.5)" : "rgba(200,170,110,0.6)" }}>◆</span>
        <div className="flex-1 h-px" style={{ background: isDungeon ? "rgba(165,180,252,0.2)" : "rgba(200,170,110,0.25)" }} />
      </div>

      {createPortal(
        <>
          <VictoryModal
            open={activeModal?.type === "victory"}
            evalName={activeModal?.label ?? ""}
            onClose={() => setActiveModal(null)}
          />
          <DefeatModal
            open={activeModal?.type === "defeat"}
            evalName={activeModal?.label ?? ""}
            onClose={() => setActiveModal(null)}
          />
        </>,
        document.body
      )}
    </>
  )
}

/* ─── Sub-components ─── */

interface MissionRowProps {
  icon: React.ReactNode
  iconClass: string
  title: string
  subtitle: string
  xp: string
  isDungeon: boolean
  action: React.ReactNode
  error?: string | null
  done?: boolean
}

function MissionRow({ icon, iconClass, title, subtitle, xp, isDungeon, action, error, done }: MissionRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-[11px] border-b transition-colors duration-100",
        isDungeon
          ? "border-b-white/[0.04] hover:bg-white/[0.025]"
          : "border-b-[#c8aa6e]/25 hover:bg-[#1e1b4b]/[0.02]",
        done && "opacity-60",
        "[&:last-child]:border-b-0"
      )}
    >
      {/* Status icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        iconClass,
        isDungeon ? "bg-white/10" : "bg-black/[0.06]",
      )}>
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-bold text-[15px] leading-tight truncate", isDungeon ? "text-white/90" : "text-[#1e1b4b]")}>
          {title}
        </p>
        <p className={cn("text-xs mt-[2px]", isDungeon ? "text-white/30" : "text-[#1e1b4b]/38")}>
          {subtitle}
        </p>
        {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
      </div>

      {/* XP pill — gold palette matching ProfileCard */}
      <div className={cn(
        "w-[68px] rounded-lg py-[5px] text-center shrink-0 border",
        isDungeon
          ? "border-purple-400/20 bg-purple-400/5"
          : "border-[#c8aa6e]/30 bg-[#c8aa6e]/5"
      )}>
        <span className={cn(
          "text-xs font-bold tabular-nums",
          isDungeon ? "text-purple-300/55" : "text-[#b8860b]"
        )}>
          {xp}
        </span>
      </div>

      {/* Action — fixed width keeps all rows identical */}
      <div className={cn(
        "pl-4 border-l w-[110px] flex items-center justify-center shrink-0",
        isDungeon ? "border-white/[0.06]" : "border-[#c8aa6e]/15"
      )}>
        {action}
      </div>
    </div>
  )
}

interface ActionButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  variant: "primary" | "neutral"
  isDungeon: boolean
}

function ActionButton({ label, onClick, disabled, variant, isDungeon }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-sm font-bold px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variant === "primary"
          ? isDungeon
            ? "text-emerald-400 hover:bg-emerald-400/10"
            : "text-emerald-600 hover:bg-emerald-50"
          : isDungeon
            ? "text-indigo-400 hover:bg-indigo-400/10"
            : "text-[#1e1b4b]/70 hover:text-[#1e1b4b] hover:bg-[#1e1b4b]/[0.04]"
      )}
    >
      {label}
    </button>
  )
}

interface ClaimedBadgeProps {
  color: "slate" | "emerald"
}

function ClaimedBadge({ color }: ClaimedBadgeProps) {
  const config = {
    emerald: { icon: "✓", cls: "bg-emerald-50 text-emerald-600 border border-emerald-200/80" },
    slate:   { icon: "✕", cls: "bg-red-50/80 text-red-400 border border-red-200/60" },
  }[color]
  return (
    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", config.cls)}>
      {config.icon}
    </div>
  )
}
