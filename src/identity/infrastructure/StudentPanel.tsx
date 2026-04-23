import { useEffect, useState } from "react"
import clsx from "clsx"
import { useAuth } from "../../shared/AuthContext"
import { useLogout } from "../../shared/useLogout"
import AvatarDisplay from "./AvatarDisplay"
import ProfileCard from "./ProfileCard"
import EvalList from "./EvalList"
import EvalMissionSelector from "./EvalMissionSelector"
import { AtmosphericBackground } from "./AtmosphericBackground"
import { useStudentData } from "./useStudentData"
import { XPToast } from "../../gamification/infrastructure/XPToast"
import { LevelUpModal } from "../../gamification/infrastructure/level-up/LevelUpModal"
import EnemySprite from "../../academic/infrastructure/EnemySprite"
import FirstLoginClassSelection from "./FirstLoginClassSelection"
import { needsClassSelection } from "../application/onboardingGate"
import styles from "./StudentPanel.module.css"


export default function StudentPanel() {
  const { user } = useAuth()
  const logout = useLogout()
  const { userData, grades, columns, snapshotError, xpGainEvent, levelUpEvent } = useStudentData()
  const [xpToast, setXpToast] = useState<{ amount: number; key: number } | null>(null)
  const [levelUpModal, setLevelUpModal] = useState<{ prevLevel: number; nextLevel: number } | null>(null)
  const [victoryAnim, setVictoryAnim] = useState(false)

  useEffect(() => {
    if (!xpGainEvent) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setXpToast({ amount: xpGainEvent.gain, key: xpGainEvent.seq })
    setVictoryAnim(true)
    const t = setTimeout(() => setVictoryAnim(false), 3000)
    return () => clearTimeout(t)
  }, [xpGainEvent])

  useEffect(() => {
    if (!levelUpEvent) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLevelUpModal(levelUpEvent)
  }, [levelUpEvent])

  const combatMode = columns.some((c) => grades[c.key]?.status === "Pending")
  const pendingEvalKey = columns.find((c) => grades[c.key]?.status === "Pending")?.key

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
  if (needsClassSelection(userData.avatarClass)) {
    return <FirstLoginClassSelection displayName={userData.displayName || user.email || "Aventurero"} />
  }

  const xpToNext = userData.xpToNextLevel ?? (userData.level * 100 - userData.xp)

  return (
    <div className={clsx("min-h-screen flex flex-col overflow-hidden relative", combatMode && styles.rootDungeon)}>
      <AtmosphericBackground />

      {/* Navbar */}
      <nav className={clsx(styles.navbar, combatMode && styles.navbarDungeon)}>
        <span className={styles.navbarBrand}>Project-C</span>
        <button className={styles.logoutBtn} onClick={logout}>Cerrar sesión</button>
      </nav>

      {/* ── Desktop layout (3 columns) ── */}
      <div className="hidden lg:flex flex-1 items-center relative z-10">

        {/* Left — Eval Mission Selector */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20">
          <EvalMissionSelector grades={grades} columns={columns} isDungeon={combatMode} />
        </div>

        {/* Center — Character display */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {combatMode && pendingEvalKey && (
            <div className={styles.combatZone}>
              <span className={styles.combatTitle}>⚔ Modo Combate Activo</span>
              <EnemySprite enemyType={pendingEvalKey as "tp1" | "tp2" | "parcial1" | "parcial2"} isDefeated={grades[pendingEvalKey]?.status === "Victory"} />
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
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4 w-96">
          <ProfileCard
            name={userData.displayName}
            avatarClass={userData.avatarClass}
            level={userData.level}
            currentXP={userData.xp}
            xpToNextLevel={xpToNext}
          />
          <EvalList grades={grades} columns={columns} isDungeon={combatMode} />
        </div>
      </div>

      {/* Level-up modal */}
      <LevelUpModal
        open={!!levelUpModal}
        prevLevel={levelUpModal?.prevLevel ?? 1}
        nextLevel={levelUpModal?.nextLevel ?? 1}
        onClose={() => setLevelUpModal(null)}
      />

      {/* XP gain toast */}
      {xpToast && (
        <XPToast
          key={xpToast.key}
          gain={xpToast.amount}
          isDungeon={combatMode}
          onDismiss={() => setXpToast(null)}
        />
      )}

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
            <EnemySprite enemyType={pendingEvalKey as "tp1" | "tp2" | "parcial1" | "parcial2"} isDefeated={grades[pendingEvalKey]?.status === "Victory"} />
          </div>
        )}
        <AvatarDisplay
          displayName={userData.displayName}
          avatarClass={userData.avatarClass}
          isVictoryAnim={victoryAnim}
          isDungeon={combatMode}
        />
        <EvalList grades={grades} columns={columns} isDungeon={combatMode} />
      </div>
    </div>
  )
}
