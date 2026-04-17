import { useEffect, useRef, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { useAuth } from "../../shared/AuthContext"
import { eventBus } from "../../shared/EventBus"
import { useLogout } from "../../shared/useLogout"
import XPBar from "../../gamification/infrastructure/XPBar"
import EnemySprite from "../../academic/infrastructure/EnemySprite"
import type { AvatarClass } from "../domain/User"
import type { EvaluationStatus } from "../../academic/domain/Evaluation"

interface GradeEntry { status: EvaluationStatus; score: number }
interface UserDocument {
  displayName: string; email: string; role: "student" | "teacher"
  avatarClass: AvatarClass; level: number; xp: number
  xpToNextLevel: number; gradesSummary: Record<string, GradeEntry>
}
interface EvaluationApprovedPayload { evalId: string; studentUid: string; xpReward: number }

const EVAL_KEYS = ["tp1", "tp2", "parcial1", "parcial2"] as const
type EvalKey = typeof EVAL_KEYS[number]

const EVAL_LABELS: Record<EvalKey, string> = {
  tp1: "TP 1", tp2: "TP 2", parcial1: "Parcial 1", parcial2: "Parcial 2",
}

const STATUS_LABELS: Record<EvaluationStatus, string> = {
  Victory: "Victoria ✓", Defeat: "Derrota ✗", Pending: "Pendiente…",
}

const STATUS_COLORS: Record<EvaluationStatus, string> = {
  Victory: "#4ade80", Defeat: "#f87171", Pending: "#facc15",
}

const AVATAR_CONFIG: Record<AvatarClass, { emoji: string; color: string; gradient: string }> = {
  Sword:  { emoji: "⚔️", color: "#60a5fa", gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)" },
  Axe:    { emoji: "🪓", color: "#f87171", gradient: "linear-gradient(135deg,#ef4444,#b91c1c)" },
  Dagger: { emoji: "🗡️", color: "#34d399", gradient: "linear-gradient(135deg,#10b981,#065f46)" },
  Bow:    { emoji: "🏹", color: "#fbbf24", gradient: "linear-gradient(135deg,#f59e0b,#b45309)" },
  Magic:  { emoji: "🔮", color: "#c084fc", gradient: "linear-gradient(135deg,#a855f7,#7c3aed)" },
}

export default function StudentPanel() {
  const { user } = useAuth()
  const logout = useLogout()
  const [userData, setUserData] = useState<UserDocument | null>(null)
  const [victoryAnim, setVictoryAnim] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data() as UserDocument)
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!user) return
    async function handleEvaluationApproved(payload: EvaluationApprovedPayload) {
      if (payload.studentUid !== user!.uid) return
      setVictoryAnim(true)
      const confetti = (await import("canvas-confetti")).default
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } })
      setTimeout(() => setVictoryAnim(false), 3000)
    }
    eventBus.on<EvaluationApprovedPayload>("EvaluationApproved", handleEvaluationApproved)
    return () => eventBus.off<EvaluationApprovedPayload>("EvaluationApproved", handleEvaluationApproved)
  }, [user])

  const grades = userData?.gradesSummary ?? {}
  const combatMode = EVAL_KEYS.some((k) => grades[k]?.status === "Pending")
  const pendingEvalKey = EVAL_KEYS.find((k) => grades[k]?.status === "Pending")

  if (!user) return <div className="sp-loading">Cargando…</div>
  if (!userData) return <div className="sp-loading">Cargando tu perfil…</div>

  const avatarCfg = AVATAR_CONFIG[userData.avatarClass] ?? AVATAR_CONFIG.Magic

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        .sp-root {
          width: 100%;
          min-height: 100svh;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          background: linear-gradient(160deg, #f0f4ff 0%, #faf0ff 50%, #fff0f9 100%);
          transition: background 0.6s ease, color 0.3s ease;
          font-family: inherit;
        }

        .sp-root--dungeon {
          background: linear-gradient(160deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a0d 100%);
          color: #e2e8f0;
        }

        /* ── Victory banner ── */
        .sp-victory-banner {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          padding: 1rem 2rem;
          background: linear-gradient(90deg, #4ade80, #22d3ee, #a855f7);
          color: #000; font-weight: 800; font-size: 1.25rem; text-align: center;
          animation: slide-down 0.3s ease;
        }
        @keyframes slide-down {
          from { transform: translateY(-100%); }
          to   { transform: translateY(0); }
        }

        /* ── Header ── */
        .sp-header {
          width: 100%; max-width: 480px;
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
        }

        .sp-avatar-ring {
          width: 96px; height: 96px;
          border-radius: 50%;
          padding: 4px;
          background: linear-gradient(135deg, #a855f7, #06b6d4);
          box-shadow: 0 8px 32px rgba(168,85,247,0.4);
          animation: ring-pulse 3s ease-in-out infinite;
        }
        @keyframes ring-pulse {
          0%,100% { box-shadow: 0 8px 32px rgba(168,85,247,0.4); }
          50%      { box-shadow: 0 8px 48px rgba(168,85,247,0.7), 0 0 0 8px rgba(168,85,247,0.1); }
        }

        .sp-avatar-inner {
          width: 100%; height: 100%;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 2.5rem;
          background: var(--avatar-gradient);
        }

        .sp-avatar-inner--victory {
          animation: avatar-victory 0.5s cubic-bezier(0.34,1.56,0.64,1) 3;
        }
        @keyframes avatar-victory {
          0%   { transform: scale(1) rotate(0deg); }
          30%  { transform: scale(1.3) rotate(-10deg); }
          60%  { transform: scale(0.95) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        .sp-name {
          font-size: 1.25rem; font-weight: 800;
          color: #1e1b4b;
          text-align: center;
        }
        .sp-root--dungeon .sp-name { color: #f1f5f9; }

        .sp-class-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.3rem 0.9rem;
          border-radius: 999px;
          font-size: 0.8rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #fff;
          background: var(--avatar-gradient);
        }

        /* ── XP Bar wrapper ── */
        .sp-xpbar-wrap {
          width: 100%; max-width: 480px;
          background: rgba(255,255,255,0.7);
          border-radius: 16px;
          padding: 1rem 1.25rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          backdrop-filter: blur(8px);
        }
        .sp-root--dungeon .sp-xpbar-wrap {
          background: rgba(255,255,255,0.07);
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }

        /* ── Combat zone ── */
        .sp-combat-zone {
          width: 100%; max-width: 480px;
          border-radius: 16px;
          padding: 1.25rem;
          background: rgba(239,68,68,0.08);
          border: 2px solid rgba(239,68,68,0.4);
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
          animation: combat-border-pulse 1.5s ease-in-out infinite;
        }
        @keyframes combat-border-pulse {
          0%,100% { border-color: rgba(239,68,68,0.4); box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50%      { border-color: rgba(239,68,68,0.8); box-shadow: 0 0 24px rgba(239,68,68,0.2); }
        }

        .sp-combat-title {
          font-size: 1rem; font-weight: 800;
          color: #ef4444;
          text-transform: uppercase; letter-spacing: 0.12em;
          animation: text-pulse 1.2s ease-in-out infinite;
        }
        @keyframes text-pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.5; }
        }

        /* ── Evaluations ── */
        .sp-evals {
          width: 100%; max-width: 480px;
          display: flex; flex-direction: column; gap: 0.75rem;
        }

        .sp-eval-card {
          padding: 1rem 1.25rem;
          border-radius: 14px;
          border: 1.5px solid rgba(0,0,0,0.08);
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          backdrop-filter: blur(8px);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .sp-eval-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }

        .sp-root--dungeon .sp-eval-card {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
        }

        .sp-eval-label {
          font-weight: 700; font-size: 0.95rem;
          color: #1e1b4b;
        }
        .sp-root--dungeon .sp-eval-label { color: #f1f5f9; }

        .sp-eval-right {
          display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;
        }

        .sp-eval-status {
          font-size: 0.78rem; font-weight: 800;
          padding: 3px 10px; border-radius: 999px;
          color: #000; letter-spacing: 0.04em;
        }

        .sp-eval-score {
          font-size: 0.75rem; color: #6b7280; font-weight: 600;
        }

        /* ── Loading ── */
        .sp-loading {
          display: flex; align-items: center; justify-content: center;
          min-height: 100svh; font-size: 1rem; color: #6b7280;
        }

        /* ── Navbar ── */
        .sp-navbar {
          width: 100%;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          position: sticky; top: 0; z-index: 50;
        }
        .sp-root--dungeon .sp-navbar {
          background: rgba(13,13,26,0.8);
          border-bottom-color: rgba(255,255,255,0.08);
        }
        .sp-navbar-brand {
          font-size: 1rem; font-weight: 800; color: #1e1b4b;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .sp-root--dungeon .sp-navbar-brand { color: #f1f5f9; }
        .sp-logout-btn {
          padding: 0.4rem 1rem;
          border-radius: 8px; border: 1.5px solid rgba(168,85,247,0.3);
          background: transparent; color: #a855f7;
          font-size: 0.8rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s ease;
        }
        .sp-logout-btn:hover {
          background: rgba(168,85,247,0.1); border-color: #a855f7;
        }
        .sp-root--dungeon .sp-logout-btn {
          color: #c084fc; border-color: rgba(192,132,252,0.3);
        }

        /* ── Left/Right cols — stacked on mobile ── */
        .sp-left-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          width: 100%;
        }
        .sp-right-col {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ── Tablet+ ── */
        @media (min-width: 768px) {
          .sp-root { padding: 2.5rem 2rem; }
          .sp-avatar-ring { width: 120px; height: 120px; }
          .sp-avatar-inner { font-size: 3rem; }
          .sp-name { font-size: 1.5rem; }
          .sp-evals {
            display: grid;
            grid-template-columns: 1fr 1fr;
            max-width: 640px;
          }
          .sp-xpbar-wrap, .sp-combat-zone { max-width: 640px; }
        }

        /* ── Desktop ── */
        @media (min-width: 1024px) {
          .sp-root {
            flex-direction: row;
            align-items: flex-start;
            justify-content: center;
            padding: 3rem 4rem;
            gap: 3rem;
          }

          /* Left column: avatar + xpbar */
          .sp-left-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            width: 320px;
            flex-shrink: 0;
            position: sticky;
            top: 2rem;
          }

          /* Right column: combat + evals */
          .sp-right-col {
            flex: 1;
            max-width: 640px;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .sp-avatar-ring { width: 140px; height: 140px; }
          .sp-avatar-inner { font-size: 3.5rem; }
          .sp-name { font-size: 1.6rem; }
          .sp-xpbar-wrap { max-width: 100%; }
          .sp-combat-zone { max-width: 100%; }
          .sp-evals {
            display: grid;
            grid-template-columns: 1fr 1fr;
            max-width: 100%;
          }
        }
      `}</style>

      {victoryAnim && (
        <div className="sp-victory-banner" role="alert">
          ¡Victoria! 🎉 +{userData.xp} XP
        </div>
      )}

      <div
        ref={panelRef}
        className={`sp-root${combatMode ? " sp-root--dungeon" : ""}`}
      >
        {/* ── Navbar ── */}
        <nav className="sp-navbar">
          <span className="sp-navbar-brand">🎮 Project-C</span>
          <button className="sp-logout-btn" onClick={logout}>Cerrar sesión</button>
        </nav>
        {/* ── Left column (desktop) / stacked (mobile) ── */}
        <div className="sp-left-col">
          {/* ── Header: Avatar + nombre + clase ── */}
          <div className="sp-header">
            <div className="sp-avatar-ring">
              <div
                className={`sp-avatar-inner${victoryAnim ? " sp-avatar-inner--victory" : ""}`}
                style={{ "--avatar-gradient": avatarCfg.gradient } as React.CSSProperties}
                aria-label={`Avatar clase ${userData.avatarClass}`}
              >
                {avatarCfg.emoji}
              </div>
            </div>
            <span className="sp-name">{userData.displayName || userData.email}</span>
            <span
              className="sp-class-badge"
              style={{ "--avatar-gradient": avatarCfg.gradient } as React.CSSProperties}
            >
              {avatarCfg.emoji} {userData.avatarClass}
            </span>
          </div>

          {/* ── XP Bar ── */}
          <div className="sp-xpbar-wrap">
            <XPBar
              currentXP={userData.xp}
              level={userData.level}
              xpToNextLevel={userData.xpToNextLevel ?? (userData.level * 100 - userData.xp)}
            />
          </div>
        </div>

        {/* ── Right column (desktop) / stacked (mobile) ── */}
        <div className="sp-right-col">
          {/* ── Combat Mode ── */}
          {combatMode && pendingEvalKey && (
            <div className="sp-combat-zone">
              <span className="sp-combat-title">⚔ Modo Combate Activo</span>
              <EnemySprite
                enemyType={pendingEvalKey}
                isDefeated={grades[pendingEvalKey]?.status === "Victory"}
              />
            </div>
          )}

          {/* ── Evaluaciones ── */}
          <div className="sp-evals" aria-label="Evaluaciones">
            {EVAL_KEYS.map((key) => {
              const entry = grades[key]
              const status: EvaluationStatus = entry?.status ?? "Pending"
              return (
                <div key={key} className="sp-eval-card">
                  <span className="sp-eval-label">{EVAL_LABELS[key]}</span>
                  <div className="sp-eval-right">
                    <span
                      className="sp-eval-status"
                      style={{ background: STATUS_COLORS[status] }}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                    {entry && status !== "Pending" && (
                      <span className="sp-eval-score">{entry.score} / 10</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
