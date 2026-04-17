import { useEffect } from "react"
import clsx from "clsx"
import { useAuth } from "../../shared/AuthContext"
import { eventBus } from "../../shared/EventBus"
import { useLogout } from "../../shared/useLogout"
import XPBar from "../../gamification/infrastructure/XPBar"
import EnemySprite from "../../academic/infrastructure/EnemySprite"
import AvatarHeader from "./AvatarHeader"
import EvalCard from "./EvalCard"
import { useStudentData, EVAL_KEYS, EVAL_LABELS } from "./useStudentData"
import styles from "./StudentPanel.module.css"

interface EvaluationApprovedPayload { evalId: string; studentUid: string; xpReward: number }

export default function StudentPanel() {
  const { user } = useAuth()
  const logout = useLogout()
  const {
    userData,
    grades,
    overlay,
    setOverlay,
    victoryAnim,
    setVictoryAnim,
    snapshotError,
  } = useStudentData()

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
      <button
        onClick={logout}
        style={{ marginTop: "0.5rem", padding: "0.5rem 1.5rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}
      >
        Cerrar sesión
      </button>
    </div>
  )

  if (!userData) return <div className={styles.loading}>Cargando tu perfil…</div>

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100svh" }}>
      {victoryAnim && (
        <div className={styles.victoryBanner} role="alert">
          ¡Victoria! 🎉 +{userData.xp} XP
        </div>
      )}

      {overlay && (
        <div
          className={clsx(styles.overlay, overlay.type === "victory" ? styles.overlayVictory : styles.overlayDefeat)}
          role="dialog"
          aria-modal="true"
          aria-label={overlay.type === "victory" ? "Victoria" : "Derrota"}
        >
          <div className={styles.overlayCard}>
            <div className={styles.overlayIcon}>{overlay.type === "victory" ? "🏆" : "💀"}</div>
            <h2 className={styles.overlayTitle}>{overlay.type === "victory" ? "¡VICTORIA!" : "DERROTA"}</h2>
            <p className={styles.overlaySub}>{overlay.label}</p>
            <button className={styles.overlayBtn} onClick={() => setOverlay(null)} autoFocus>
              Aceptar
            </button>
          </div>
        </div>
      )}

      <nav className={clsx(styles.navbar, combatMode && styles.navbarDungeon)}>
        <span className={styles.navbarBrand}>🎮 Project-C</span>
        <button className={styles.logoutBtn} onClick={logout}>Cerrar sesión</button>
      </nav>

      <div className={clsx(styles.root, combatMode && styles.rootDungeon)}>
        <div className={styles.leftCol}>
          <AvatarHeader
            displayName={userData.displayName}
            email={userData.email}
            avatarClass={userData.avatarClass}
            isVictoryAnim={victoryAnim}
            isDungeon={combatMode}
          />

          <div className={styles.xpbarWrap}>
            <XPBar
              currentXP={userData.xp}
              level={userData.level}
              xpToNextLevel={userData.xpToNextLevel ?? (userData.level * 100 - userData.xp)}
            />
          </div>
        </div>

        <div className={styles.rightCol}>
          {combatMode && pendingEvalKey && (
            <div className={styles.combatZone}>
              <span className={styles.combatTitle}>⚔ Modo Combate Activo</span>
              <EnemySprite
                enemyType={pendingEvalKey}
                isDefeated={grades[pendingEvalKey]?.status === "Victory"}
              />
            </div>
          )}

          <div className={styles.evals} aria-label="Evaluaciones">
            {EVAL_KEYS.map((key) => (
              <EvalCard
                key={key}
                label={EVAL_LABELS[key]}
                entry={grades[key]}
                isDungeon={combatMode}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
