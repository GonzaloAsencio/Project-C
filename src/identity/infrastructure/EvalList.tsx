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

const CARD_LIGHT = "bg-[#faf7f2] border border-[#cfc0a4] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_4px_rgba(0,0,0,0.07)]"
const CARD_DUNGEON = "bg-[#1c1828]/70 border border-[#3d3458] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_4px_rgba(0,0,0,0.35)]"

const ICON_COLORS: Record<EvaluationStatus | "attendance", string> = {
  Victory:    "text-amber-400 bg-amber-400/15 shadow-[0_0_0_2px_#f59e0b,0_0_0_4px_#f59e0b22]",
  Defeat:     "text-slate-400 bg-slate-400/10 shadow-[0_0_0_2px_#94a3b8,0_0_0_4px_#94a3b818]",
  Pending:    "text-indigo-400 bg-indigo-400/10 shadow-[0_0_0_2px_#a5b4fc,0_0_0_4px_#a5b4fc22]",
  Waiting:    "text-slate-400/50 bg-slate-200/20 shadow-[0_0_0_2px_#cbd5e1,0_0_0_4px_#cbd5e110]",
  attendance: "text-emerald-400 bg-emerald-400/15 shadow-[0_0_0_2px_#34d399,0_0_0_4px_#34d39922]",
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
      <div className={cn(
        "rounded-2xl shadow-sm border w-full overflow-hidden",
        isDungeon ? "bg-white/5 border-white/10" : "bg-white/80 backdrop-blur-sm border-white/60"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-5 py-4 border-b",
          isDungeon ? "border-white/10" : "border-black/5"
        )}>
          <div>
            <h2 className={cn("text-base font-bold tracking-widest uppercase", isDungeon ? "text-white" : "text-[#1e1b4b]")}>
              Desafíos
            </h2>
            <p className={cn("text-xs mt-0.5", isDungeon ? "text-white/40" : "text-gray-400")}>
              .: completa los desafíos para ganar experiencia
            </p>
          </div>
          <Swords className="w-4 h-4 opacity-60" style={{ color: isDungeon ? "#a5b4fc" : "#1e1b4b" }} />
        </div>

        {/* Challenge list */}
        <div className="flex flex-col gap-2.5 p-4">
          {/* Attendance challenge */}
          {hasAttendance && (
            <ChallengeCard
              icon={<CalendarCheck className="w-4 h-4" />}
              iconClass={cn(ICON_COLORS["attendance"])}
              title="Asistencia"
              subtitle="Ganar +20 XP"
              isDungeon={isDungeon}
              action={
                alreadyPresent || attendanceRegistered ? (
                  <ClaimedBadge color="emerald" label="✓ Asistencia +20 XP" />
                ) : (
                  <ActionButton
                    label={attendanceLoading ? "Registrando…" : "Registrar"}
                    onClick={handleAttendance}
                    disabled={attendanceLoading}
                    variant="primary"
                  />
                )
              }
              error={attendanceError}
            />
          )}

          {/* Eval challenges */}
          {columns.length === 0 && !hasAttendance && (
            <p className={cn("text-center text-xs py-4", isDungeon ? "text-white/40" : "text-gray-400")}>
              No hay desafíos disponibles
            </p>
          )}
          {columns.map((col) => {
            const entry = grades[col.key]
            const status: EvaluationStatus = entry?.status ?? "Waiting"
            const claimed = claimedKeys.has(col.key)
            const loading = claimLoading === col.key
            const TypeIcon = col.type === "TP" ? Sword : BookOpen
            const xp = XP_REWARD[col.type]

            let action: React.ReactNode
            if (status === "Waiting") {
              action = (
                <span className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                  isDungeon ? "bg-white/5 text-white/30 border border-white/10" : "bg-slate-100/80 text-slate-400 border border-slate-200")}>
                  <Lock className="w-3 h-3" /> Bloqueado
                </span>
              )
            } else if (status === "Pending") {
              action = (
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium",
                  isDungeon ? "bg-indigo-400/10 text-indigo-300 border border-indigo-400/20" : "bg-indigo-50 text-indigo-400 border border-indigo-200")}>
                  En progreso…
                </span>
              )
            } else if (claimed) {
              action = status === "Victory"
                ? <ClaimedBadge color="gold" label="✓ Recompensa obtenida" />
                : <ClaimedBadge color="slate" label="✗ Completado" />
            } else {
              action = (
                <ActionButton
                  label={loading ? "…" : "Ver resultado"}
                  onClick={() => handleViewResult(col, status)}
                  disabled={loading}
                  variant="neutral"
                />
              )
            }

            return (
              <ChallengeCard
                key={col.key}
                icon={<TypeIcon className="w-4 h-4" />}
                iconClass={cn(ICON_COLORS[status])}
                title={col.label}
                subtitle={`Ganar +${xp} XP`}
                isDungeon={isDungeon}
                action={action}
              />
            )
          })}
        </div>
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

interface ChallengeCardProps {
  icon: React.ReactNode
  iconClass: string
  title: string
  subtitle: string
  isDungeon: boolean
  action: React.ReactNode
  error?: string | null
}

function ChallengeCard({ icon, iconClass, title, subtitle, isDungeon, action, error }: ChallengeCardProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150",
      isDungeon ? CARD_DUNGEON : CARD_LIGHT,
    )}>
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", iconClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-xs leading-tight", isDungeon ? "text-white/90" : "text-[#2d2460]")}>
          {title}
        </p>
        <div className={cn("h-px w-full my-1", isDungeon ? "bg-white/10" : "bg-[#cfc0a4]/60")} />
        <p className={cn("text-[10px] truncate", isDungeon ? "text-white/40" : "text-gray-400")}>
          {subtitle}
        </p>
        {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}

interface ActionButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  variant: "primary" | "neutral"
}

function ActionButton({ label, onClick, disabled, variant }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-semibold transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary"
          ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95"
          : "bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 active:scale-95"
      )}
    >
      {label}
    </button>
  )
}

interface ClaimedBadgeProps {
  color: "gold" | "slate" | "emerald"
  label: string
}

function ClaimedBadge({ color, label }: ClaimedBadgeProps) {
  const cls = {
    gold:    "bg-amber-400/15 text-amber-400 border border-amber-400/30",
    slate:   "bg-slate-400/10 text-slate-400 border border-slate-400/25",
    emerald: "bg-emerald-400/15 text-emerald-400 border border-emerald-400/30",
  }[color]
  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", cls)}>
      {label}
    </span>
  )
}

