import { useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../shared/firebase"
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

function useMateriaName(materiaId: string | null): string {
  const [name, setName] = useState("Paradigmas De Programación")
  useEffect(() => {
    if (!materiaId) return
    getDoc(doc(db, "materias", materiaId)).then((snap) => {
      if (snap.exists()) setName((snap.data() as { name: string }).name)
    }).catch(() => { /* keep default */ })
  }, [materiaId])
  return name
}


export default function StudentPanel() {
  const { user } = useAuth()
  const logout = useLogout()
  const { userData, grades, columns, snapshotError, xpGainEvent, levelUpEvent } = useStudentData()
  const materiaName = useMateriaName(user?.materiaId ?? null)
  const [xpToast, setXpToast] = useState<{ amount: number; key: number } | null>(null)
  const [levelUpModal, setLevelUpModal] = useState<{ prevLevel: number; nextLevel: number } | null>(null)
  const [victoryAnim, setVictoryAnim] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!settingsOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [settingsOpen])

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
        <span className={styles.navbarBrand}>{materiaName}</span>
        <div ref={settingsRef} className={styles.settingsWrap}>
          <button
            className={clsx(styles.settingsBtn, combatMode && styles.settingsBtnDungeon)}
            onClick={() => setSettingsOpen(o => !o)}
            aria-label="Configuración"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          {settingsOpen && (
            <div className={clsx(styles.settingsDropdown, combatMode && styles.settingsDropdownDungeon)}>
              <button className={styles.settingsItem} onClick={logout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Desktop layout (3 columns) ── */}
      <div className="hidden lg:flex flex-1 relative z-10">
        {/* Left — Eval Mission Selector */}
        <div className="absolute left-12 xl:left-16 top-1/2 -translate-y-1/2 z-20">
          <EvalMissionSelector isDungeon={combatMode} />
        </div>

        {/* Right — Profile + Evals */}
        <div className="absolute right-12 xl:right-16 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4 w-72 xl:w-80 2xl:w-96">
          <ProfileCard
            name={userData.displayName}
            avatarClass={userData.avatarClass}
            level={userData.level}
            currentXP={userData.xp}
            xpToNextLevel={xpToNext}
          />
          <EvalList grades={grades} columns={columns} isDungeon={combatMode} />
        </div>

        {/* Center — Character display */}
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-6">
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
            <EnemySprite enemyType={pendingEvalKey} isDefeated={grades[pendingEvalKey]?.status === "Victory"} />
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
