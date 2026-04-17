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
    <>
      <style>{`
        * { box-sizing: border-box; }
        .auth-root {
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%);
          padding: 1.5rem;
        }
        .auth-card {
          background: #fff;
          border-radius: 20px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.3);
        }
        @media (min-width: 768px) {
          .auth-card { padding: 3rem 2.5rem; }
        }
        .auth-logo {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .auth-logo-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
        }
        .auth-title {
          font-size: 1.5rem; font-weight: 800;
          color: #1e1b4b; text-align: center;
          margin: 0 0 0.25rem;
        }
        .auth-subtitle {
          font-size: 0.875rem; color: #64748b;
          text-align: center; margin: 0 0 2rem;
        }
        .auth-field { margin-bottom: 1rem; }
        .auth-label {
          display: block;
          font-size: 0.8rem; font-weight: 700;
          color: #374151; text-transform: uppercase;
          letter-spacing: 0.05em; margin-bottom: 0.4rem;
        }
        .auth-input, .auth-select {
          width: 100%; padding: 0.75rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.95rem; color: #1e293b;
          background: #f9fafb;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .auth-input:focus, .auth-select:focus {
          outline: none;
          border-color: #a855f7;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(168,85,247,0.12);
        }
        .auth-input:disabled, .auth-select:disabled {
          opacity: 0.6; cursor: not-allowed;
        }
        .auth-avatar-grid {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem;
          margin-top: 0.4rem;
        }
        .auth-avatar-btn {
          aspect-ratio: 1;
          border-radius: 10px;
          border: 2px solid #e5e7eb;
          background: #f9fafb;
          font-size: 1.4rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s ease;
        }
        .auth-avatar-btn:hover { border-color: #a855f7; background: #faf5ff; }
        .auth-avatar-btn--selected {
          border-color: #a855f7;
          background: #faf5ff;
          box-shadow: 0 0 0 3px rgba(168,85,247,0.2);
        }
        .auth-error {
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; padding: 0.75rem 1rem;
          color: #b91c1c; font-size: 0.875rem; font-weight: 600;
          margin-bottom: 1rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .auth-btn {
          width: 100%; padding: 0.875rem;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          color: #fff; border: none; border-radius: 10px;
          font-size: 1rem; font-weight: 700; cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
          box-shadow: 0 4px 16px rgba(168,85,247,0.4);
          margin-top: 0.5rem;
        }
        .auth-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(168,85,247,0.5);
        }
        .auth-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-toggle {
          text-align: center; margin-top: 1.25rem;
          font-size: 0.875rem; color: #64748b;
        }
        .auth-toggle-btn {
          background: none; border: none;
          color: #a855f7; font-weight: 700; cursor: pointer;
          font-size: 0.875rem; padding: 0;
          text-decoration: underline;
        }
        .auth-toggle-btn:hover { color: #7c3aed; }
        .auth-divider {
          border: none; border-top: 1px solid #e5e7eb;
          margin: 1.25rem 0;
        }
        .auth-role-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
        }
        .auth-role-btn {
          padding: 0.6rem; border-radius: 10px;
          border: 2px solid #e5e7eb; background: #f9fafb;
          font-size: 0.875rem; font-weight: 600; cursor: pointer;
          transition: all 0.15s ease; text-align: center;
          color: #374151;
        }
        .auth-role-btn:hover { border-color: #a855f7; }
        .auth-role-btn--selected {
          border-color: #a855f7; background: #faf5ff; color: #7c3aed;
        }
      `}</style>

      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-icon">🎮</span>
            <h1 className="auth-title">Project-C</h1>
            <p className="auth-subtitle">
              {mode === "login" ? "Iniciá sesión para continuar" : "Creá tu cuenta y comenzá"}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="displayName">Nombre</label>
                <input
                  id="displayName" className="auth-input" type="text"
                  value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre completo" required disabled={loading}
                />
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email</label>
              <input
                id="email" className="auth-input" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com" required disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Contraseña</label>
              <input
                id="password" className="auth-input" type="password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required disabled={loading}
              />
            </div>

            {mode === "register" && (
              <>
                <hr className="auth-divider" />

                <div className="auth-field">
                  <label className="auth-label">Rol</label>
                  <div className="auth-role-row">
                    {(["student", "teacher"] as Role[]).map((r) => (
                      <button
                        key={r} type="button"
                        className={`auth-role-btn${role === r ? " auth-role-btn--selected" : ""}`}
                        onClick={() => setRole(r)} disabled={loading}
                      >
                        {r === "student" ? "🎒 Alumno" : "🎓 Profesor"}
                      </button>
                    ))}
                  </div>
                </div>

                {role === "student" && (
                  <div className="auth-field">
                    <label className="auth-label">Clase de personaje</label>
                    <div className="auth-avatar-grid">
                      {AVATAR_OPTIONS.map((c) => (
                        <button
                          key={c} type="button"
                          className={`auth-avatar-btn${avatarClass === c ? " auth-avatar-btn--selected" : ""}`}
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
              <div className="auth-error" role="alert">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "⏳ Cargando..." : mode === "login" ? "Ingresar →" : "Crear cuenta →"}
            </button>
          </form>

          <div className="auth-toggle">
            {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
            <button
              type="button" className="auth-toggle-btn"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }}
              disabled={loading}
            >
              {mode === "login" ? "Registrarse" : "Iniciar sesión"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
