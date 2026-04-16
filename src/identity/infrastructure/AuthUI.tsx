import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FirebaseAuthAdapter } from "./FirebaseAuthAdapter"
import { LoginUser } from "../application/LoginUser"
import type { Role, AvatarClass } from "../domain/User"

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
    <form onSubmit={handleSubmit} style={{ maxWidth: 360, margin: "0 auto", padding: 24 }}>
      <h1>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>

      {mode === "register" && (
        <div>
          <label htmlFor="displayName">Nombre</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
      )}

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {mode === "register" && (
        <>
          <div>
            <label htmlFor="role">Rol</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={loading}
            >
              <option value="student">Alumno</option>
              <option value="teacher">Profesor</option>
            </select>
          </div>

          {role === "student" && (
            <div>
              <label htmlFor="avatarClass">Clase de personaje</label>
              <select
                id="avatarClass"
                value={avatarClass}
                onChange={(e) => setAvatarClass(e.target.value as AvatarClass)}
                disabled={loading}
              >
                {AVATAR_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {error && <p role="alert" style={{ color: "red" }}>{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Cargando..." : mode === "login" ? "Ingresar" : "Registrarse"}
      </button>

      <p>
        {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }}
          disabled={loading}
        >
          {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </p>
    </form>
  )
}
