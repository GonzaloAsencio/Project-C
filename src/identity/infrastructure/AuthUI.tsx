import { useState } from "react"
import { useNavigate } from "react-router-dom"
import clsx from "clsx"
import { FirebaseAuthAdapter } from "./FirebaseAuthAdapter"
import { LoginUser } from "../application/LoginUser"
import type { Role, AvatarClass } from "../domain/User"
import styles from "./AuthUI.module.css"

const adapter = new FirebaseAuthAdapter()
const loginUser = new LoginUser(adapter)

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Credenciales inválidas. Verificá tu email y contraseña.",
  "auth/user-not-found": "No existe una cuenta con ese email.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/too-many-requests": "Demasiados intentos fallidos. Intentá más tarde.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese email.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/user-doc-missing": "Tu cuenta existe pero falta el perfil. Contactá al administrador.",
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code
    return ERROR_MESSAGES[code] ?? "Ocurrió un error. Intentá de nuevo."
  }
  return "Ocurrió un error. Intentá de nuevo."
}

const AVATAR_OPTIONS: AvatarClass[] = ["Sword", "Axe", "Dagger", "Bow", "Magic"]
const AVATAR_EMOJIS: Record<AvatarClass, string> = {
  Sword: "⚔️", Axe: "🪓", Dagger: "🗡️", Bow: "🏹", Magic: "🔮",
}

export default function AuthUI() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [role, setRole] = useState<Role>("student")
  const [avatarClass, setAvatarClass] = useState<AvatarClass>("Sword")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === "login") {
        const user = await loginUser.execute(email, password)
        navigate(user.role === "student" ? "/student" : "/teacher", { replace: true })
      } else {
        const user = await adapter.register(email, password, displayName, role, avatarClass)
        navigate(user.role === "student" ? "/student" : "/teacher", { replace: true })
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎮</span>
          <h1 className={styles.title}>Project-C</h1>
          <p className={styles.subtitle}>
            {mode === "login" ? "Iniciá sesión para continuar" : "Creá tu cuenta y comenzá"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="displayName">Nombre</label>
              <input
                id="displayName" className={styles.input} type="text"
                value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre completo" required disabled={loading}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email" className={styles.input} type="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com" required disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Contraseña</label>
            <input
              id="password" className={styles.input} type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required disabled={loading}
            />
          </div>

          {mode === "register" && (
            <>
              <hr className={styles.divider} />

              <div className={styles.field}>
                <label className={styles.label}>Rol</label>
                <div className={styles.roleRow}>
                  {(["student", "teacher"] as Role[]).map((r) => (
                    <button
                      key={r} type="button"
                      className={clsx(styles.roleBtn, role === r && styles.roleBtnSelected)}
                      onClick={() => setRole(r)} disabled={loading}
                    >
                      {r === "student" ? "🎒 Alumno" : "🎓 Profesor"}
                    </button>
                  ))}
                </div>
              </div>

              {role === "student" && (
                <div className={styles.field}>
                  <label className={styles.label}>Clase de personaje</label>
                  <div className={styles.avatarGrid}>
                    {AVATAR_OPTIONS.map((c) => (
                      <button
                        key={c} type="button"
                        className={clsx(styles.avatarBtn, avatarClass === c && styles.avatarBtnSelected)}
                        onClick={() => setAvatarClass(c)} disabled={loading}
                        title={c}
                      >
                        {AVATAR_EMOJIS[c]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className={styles.error} role="alert">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "⏳ Cargando..." : mode === "login" ? "Ingresar →" : "Crear cuenta →"}
          </button>
        </form>

        <div className={styles.toggle}>
          {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
          <button
            type="button" className={styles.toggleBtn}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }}
            disabled={loading}
          >
            {mode === "login" ? "Registrarse" : "Iniciar sesión"}
          </button>
        </div>
      </div>
    </div>
  )
}
