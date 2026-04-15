import { useEffect, useRef, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../../shared/firebase"
import { useAuth } from "../../shared/AuthContext"
import { eventBus } from "../../shared/EventBus"
import XPBar from "../../gamification/infrastructure/XPBar"
import EnemySprite from "../../academic/infrastructure/EnemySprite"
import type { AvatarClass } from "../domain/User"
import type { EvaluationStatus } from "../../academic/domain/Evaluation"

// ─── Domain types mirrored from Firestore ────────────────────────────────────

interface GradeEntry {
  status: EvaluationStatus
  score: number
}

interface UserDocument {
  displayName: string
  email: string
  role: "student" | "teacher"
  avatarClass: AvatarClass
  level: number
  xp: number
  xpToNextLevel: number
  gradesSummary: Record<string, GradeEntry>
}

// ─── Avatar sprite config ─────────────────────────────────────────────────────

const AVATAR_FRAMES = 4
const AVATAR_FRAME_WIDTH = 64 // px per frame
const AVATAR_SHEET_WIDTH = AVATAR_FRAMES * AVATAR_FRAME_WIDTH

const AVATAR_COLORS: Record<AvatarClass, string> = {
  Sword:  "#60a5fa",
  Axe:    "#f87171",
  Dagger: "#34d399",
  Bow:    "#fbbf24",
  Magic:  "#c084fc",
}

// ─── Evaluation display order ─────────────────────────────────────────────────

const EVAL_KEYS = ["tp1", "tp2", "parcial1", "parcial2"] as const
type EvalKey = typeof EVAL_KEYS[number]

const EVAL_LABELS: Record<EvalKey, string> = {
  tp1:      "TP 1",
  tp2:      "TP 2",
  parcial1: "Parcial 1",
  parcial2: "Parcial 2",
}

const STATUS_LABELS: Record<EvaluationStatus, string> = {
  Victory: "Victoria ✓",
  Defeat:  "Derrota ✗",
  Pending: "Pendiente…",
}

const STATUS_COLORS: Record<EvaluationStatus, string> = {
  Victory: "#4ade80",
  Defeat:  "#f87171",
  Pending: "#facc15",
}

// ─── EvaluationApproved payload (matches EventBus usage in AddXP) ─────────────

interface EvaluationApprovedPayload {
  evalId: string
  studentUid: string
  xpReward: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentPanel() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<UserDocument | null>(null)
  const [victoryAnim, setVictoryAnim] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Firestore real-time subscription ──────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setUserData(snap.data() as UserDocument)
      }
    })
    return unsub
  }, [user])

  // ── EventBus: listen for EvaluationApproved → victory animation ───────────
  useEffect(() => {
    if (!user) return

    async function handleEvaluationApproved(payload: EvaluationApprovedPayload) {
      if (payload.studentUid !== user!.uid) return

      setVictoryAnim(true)

      // Lazy-load canvas-confetti only when victory fires
      const confetti = (await import("canvas-confetti")).default
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      })

      setTimeout(() => setVictoryAnim(false), 2000)
    }

    eventBus.on<EvaluationApprovedPayload>("EvaluationApproved", handleEvaluationApproved)
    return () => {
      eventBus.off<EvaluationApprovedPayload>("EvaluationApproved", handleEvaluationApproved)
    }
  }, [user])

  // ── Derived state ──────────────────────────────────────────────────────────
  const grades = userData?.gradesSummary ?? {}
  const combatMode = EVAL_KEYS.some((k) => grades[k]?.status === "Pending")

  // First pending evaluation drives the enemy sprite type
  const pendingEvalKey = EVAL_KEYS.find((k) => grades[k]?.status === "Pending")

  if (!user || !userData) {
    return (
      <div className="sp-loading" role="status" aria-live="polite">
        Cargando panel…
      </div>
    )
  }

  const avatarColor = AVATAR_COLORS[userData.avatarClass] ?? "#c084fc"

  return (
    <>
      <style>{`
        /* ── Layout ─────────────────────────────────────────────────── */
        .sp-root {
          width: 100%;
          min-height: 100svh;
          box-sizing: border-box;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          background: var(--bg, #fff);
          transition: background 0.4s ease;
        }

        .sp-root--dungeon {
          background: #0d0d1a;
          color: #e2e8f0;
        }

        /* ── Avatar ─────────────────────────────────────────────────── */
        .sp-avatar-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .sp-avatar {
          width: 64px;
          height: 64px;
          overflow: hidden;
          border-radius: 50%;
          border: 3px solid var(--accent, #aa3bff);
          image-rendering: pixelated;
          position: relative;
        }

        .sp-avatar-frames {
          width: ${AVATAR_SHEET_WIDTH}px;
          height: 64px;
          display: flex;
          will-change: transform;
        }

        .sp-avatar-frame {
          width: 64px;
          height: 64px;
          flex-shrink: 0;
        }

        @keyframes avatar-walk {
          from { transform: translateX(0); }
          to   { transform: translateX(-${AVATAR_SHEET_WIDTH - AVATAR_FRAME_WIDTH}px); }
        }

        @keyframes avatar-victory {
          0%   { transform: translateX(0) scale(1); }
          25%  { transform: translateX(0) scale(1.3); }
          50%  { transform: translateX(0) scale(0.9); }
          75%  { transform: translateX(0) scale(1.15); }
          100% { transform: translateX(0) scale(1); }
        }

        .sp-avatar-frames--idle {
          animation: avatar-walk ${AVATAR_FRAMES * 0.18}s steps(${AVATAR_FRAMES - 1}, end) infinite;
        }

        .sp-avatar-frames--victory {
          animation: avatar-victory 0.6s ease 3;
        }

        .sp-avatar-name {
          font-weight: 700;
          font-size: 1rem;
          color: var(--text-h, #08060d);
        }

        .sp-root--dungeon .sp-avatar-name {
          color: #f1f5f9;
        }

        .sp-avatar-class {
          font-size: 0.75rem;
          color: var(--accent, #aa3bff);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ── XPBar wrapper ──────────────────────────────────────────── */
        .sp-xpbar-wrap {
          width: 100%;
          max-width: 480px;
        }

        /* ── Combat zone ────────────────────────────────────────────── */
        .sp-combat-zone {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .sp-combat-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #f87171;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          animation: pulse-red 1.2s ease-in-out infinite;
        }

        @keyframes pulse-red {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }

        /* ── Evaluations grid ───────────────────────────────────────── */
        .sp-evals {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .sp-eval-card {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid var(--border, #e5e4e7);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--code-bg, #f4f3ec);
        }

        .sp-root--dungeon .sp-eval-card {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.12);
        }

        .sp-eval-label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-h, #08060d);
        }

        .sp-root--dungeon .sp-eval-label {
          color: #f1f5f9;
        }

        .sp-eval-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
        }

        .sp-eval-status {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          color: #000;
        }

        .sp-eval-score {
          font-size: 0.75rem;
          color: var(--text, #6b6375);
        }

        /* ── Victory overlay ────────────────────────────────────────── */
        .sp-victory-banner {
          position: fixed;
          top: 0; left: 0; right: 0;
          padding: 1rem;
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          color: #000;
          font-weight: 800;
          font-size: 1.25rem;
          text-align: center;
          z-index: 100;
          animation: slide-down 0.3s ease;
        }

        @keyframes slide-down {
          from { transform: translateY(-100%); }
          to   { transform: translateY(0); }
        }

        /* ── Loading ────────────────────────────────────────────────── */
        .sp-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100svh;
          font-size: 1rem;
          color: var(--text, #6b6375);
        }

        /* ── Tablet / Desktop ───────────────────────────────────────── */
        @media (min-width: 768px) {
          .sp-root {
            padding: 2rem;
          }
          .sp-avatar {
            width: 96px;
            height: 96px;
          }
          .sp-avatar-frames {
            width: ${AVATAR_SHEET_WIDTH * 1.5}px;
            height: 96px;
          }
          .sp-avatar-frame {
            width: 96px;
            height: 96px;
          }
          .sp-evals {
            display: grid;
            grid-template-columns: 1fr 1fr;
            max-width: 640px;
          }
        }
      `}</style>

      {victoryAnim && (
        <div className="sp-victory-banner" role="alert">
          ¡Victoria! 🎉
        </div>
      )}

      <div
        ref={panelRef}
        className={`sp-root${combatMode ? " sp-root--dungeon" : ""}`}
      >
        {/* ── Avatar ── */}
        <div className="sp-avatar-wrap">
          <div className="sp-avatar" aria-label={`Avatar clase ${userData.avatarClass}`}>
            <div
              className={`sp-avatar-frames ${victoryAnim ? "sp-avatar-frames--victory" : "sp-avatar-frames--idle"}`}
            >
              {Array.from({ length: AVATAR_FRAMES }).map((_, i) => (
                <div
                  key={i}
                  className="sp-avatar-frame"
                  style={{
                    background: avatarColor,
                    opacity: 0.8 + (i % 2) * 0.2,
                    borderRadius: i % 2 === 0 ? "50%" : "40%",
                  }}
                />
              ))}
            </div>
          </div>
          <span className="sp-avatar-name">{userData.displayName || userData.email}</span>
          <span className="sp-avatar-class">{userData.avatarClass}</span>
        </div>

        {/* ── XP Bar ── */}
        <div className="sp-xpbar-wrap">
          <XPBar
            currentXP={userData.xp}
            level={userData.level}
            xpToNextLevel={userData.xpToNextLevel}
          />
        </div>

        {/* ── Combat Mode: dungeon layout + enemy sprite ── */}
        {combatMode && pendingEvalKey && (
          <div className="sp-combat-zone">
            <span className="sp-combat-title">⚔ Modo Combate</span>
            <EnemySprite
              enemyType={pendingEvalKey}
              isDefeated={grades[pendingEvalKey]?.status === "Victory"}
            />
          </div>
        )}

        {/* ── Evaluations ── */}
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
                  {entry && (
                    <span className="sp-eval-score">
                      {status !== "Pending" ? `${entry.score} / 10` : "—"}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
