import { useEffect } from "react"
import clsx from "clsx"
import { useAuth } from "../../shared/AuthContext"
import { eventBus } from "../../shared/EventBus"
import { useLogout } from "../../shared/useLogout"
import EnemySprite from "../../academic/infrastructure/EnemySprite"
import AvatarDisplay from "./AvatarDisplay"
import ProfileCard from "./ProfileCard"
import EvalList from "./EvalList"
import EvalMissionSelector from "./EvalMissionSelector"
import { AtmosphericBackground } from "./AtmosphericBackground"
import { useStudentData, EVAL_KEYS } from "./useStudentData"
import styles from "./StudentPanel.module.css"

interface EvaluationApprovedPayload { evalId: string; studentUid: string; xpReward: number }

export default function StudentPanel() {
  const { user } = useAuth()
  const logout = useLogout()
  const { userData, grades, overlay, setOverlay, victoryAnim, setVictoryAnim, snapshotError } = useStudentData()

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

  const combatMode = EVAL_KEYS.some((k) => grades[k]?.status === "Pending")
  const pendingEvalKey = EVAL_KEYS.find((k) => grades[k]?.status === "Pending")

  if (!user) return <div className={styles.loading}>Cargando…</div>

  if (snapshotError) return (
    <div className={styles.loading} style={{ flexDirection: "column", gap: "0.75rem", padding: "2rem", textAlign: "center" }}>
      <span style={{ fontSize: "2rem" }}>⚠️</span>
      <span style={{ color: "#ef4444", fontWeight: 700 }}>{snapshotError}</span>
      <button onClick={logout} style={{ marginTop: "0.5rem", padding: "0.5rem 1.5rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
        Cerrar sesión
      </button>
    </div>
  )

  if (!userData) return <div className={styles.loading}>Cargando tu perfil…</div>

  const xpToNext = userData.xpToNextLevel ?? (userData.level * 100 - userData.xp)

  return (
    <div className={clsx("min-h-screen flex flex-col overflow-hidden relative", combatMode && styles.rootDungeon)}>
      <AtmosphericBackground />

      {/* Victory banner */}
      {victoryAnim && (
        <div className={styles.victoryBanner} role="alert">
          ¡Victoria! 🎉 +{userData.xp} XP
        </div>
      )}

      {/* Victory/Defeat overlay */}
      {overlay && (
        <div
          className={clsx(styles.overlay, overlay.type === "victory" ? styles.overlayVictory : styles.overlayDefeat)}
          role="dialog" aria-modal="true"
          aria-label={overlay.type === "victory" ? "Victoria" : "Derrota"}
        >
          <div className={styles.overlayCard}>
            <div className={styles.overlayIcon}>{overlay.type === "victory" ? "🏆" : "💀"}</div>
            <h2 className={styles.overlayTitle}>{overlay.type === "victory" ? "¡VICTORIA!" : "DERROTA"}</h2>
            <p className={styles.overlaySub}>{overlay.label}</p>
            <button className={styles.overlayBtn} onClick={() => setOverlay(null)} autoFocus>Aceptar</button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className={clsx(styles.navbar, combatMode && styles.navbarDungeon)}>
        <span className={styles.navbarBrand}>Project-C</span>
        <button className={styles.logoutBtn} onClick={logout}>Cerrar sesión</button>
      </nav>

      {/* ── Desktop layout (3 columns) ── */}
      <div className="hidden lg:flex flex-1 items-center relative z-10">

        {/* Left — Eval Mission Selector */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20">
          <EvalMissionSelector grades={grades} isDungeon={combatMode} />
        </div>

        {/* Center — Character display */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {combatMode && pendingEvalKey && (
            <div className={styles.combatZone}>
              <span className={styles.combatTitle}>⚔ Modo Combate Activo</span>
              <EnemySprite enemyType={pendingEvalKey} isDefeated={grades[pendingEvalKey]?.status === "Victory"} />
            </div>
          )}
          <AvatarDisplay
            displayName={userData.displayName}
            avatarClass={userData.avatarClass}
            isVictoryAnim={victoryAnim}
            isDungeon={combatMode}
          />
        </div>

        {/* Right — Profile + Evals */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4 w-96 max-h-[85vh]">
          <ProfileCard
            name={userData.displayName}
            avatarClass={userData.avatarClass}
            level={userData.level}
            currentXP={userData.xp}
            xpToNextLevel={xpToNext}
          />
          <div className="flex-1 overflow-auto">
            <EvalList grades={grades} isDungeon={combatMode} />
          </div>
        </div>
      </div>

      {/* ── Mobile layout (single column) ── */}
      <div className="flex lg:hidden flex-col items-center gap-4 p-4 flex-1 z-10 relative">
        <ProfileCard
          name={userData.displayName}
          avatarClass={userData.avatarClass}
          level={userData.level}
          currentXP={userData.xp}
          xpToNextLevel={xpToNext}
        />
        {combatMode && pendingEvalKey && (
          <div className={styles.combatZone}>
            <span className={styles.combatTitle}>⚔ Modo Combate Activo</span>
            <EnemySprite enemyType={pendingEvalKey} isDefeated={grades[pendingEvalKey]?.status === "Victory"} />
          </div>
        )}
        <AvatarDisplay
          displayName={userData.displayName}
          avatarClass={userData.avatarClass}
          isVictoryAnim={victoryAnim}
          isDungeon={combatMode}
        />
        <EvalList grades={grades} isDungeon={combatMode} />
      </div>
    </div>
  )
}
