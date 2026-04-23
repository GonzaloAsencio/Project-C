import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FirebaseAuthAdapter } from "./FirebaseAuthAdapter"
import { LoginUser } from "../application/LoginUser"
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
  "auth/user-doc-invalid": "Tu cuenta existe pero el perfil esta incompleto. Contacta al administrador.",
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code
    return ERROR_MESSAGES[code] ?? "Ocurrió un error. Intentá de nuevo."
  }
  return "Ocurrió un error. Intentá de nuevo."
}

export default function AuthUI() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
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
        const user = await adapter.registerTeacher(email, password, displayName)
        navigate(user.role === "teacher" ? "/teacher" : "/student", { replace: true })
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
            {mode === "login"
              ? "Inicia sesion para continuar"
              : "Registro de profesor habilitado para administradores"}
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

          {mode === "register" && <hr className={styles.divider} />}

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
          {mode === "login" ? "Modo administrador" : "Volver al ingreso"}{" "}
          <button
            type="button" className={styles.toggleBtn}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }}
            disabled={loading}
          >
            {mode === "login" ? "Registrar profesor" : "Iniciar sesion"}
          </button>
        </div>
      </div>
    </div>
  )
}
