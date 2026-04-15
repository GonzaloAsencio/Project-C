import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FirebaseAuthAdapter } from "./FirebaseAuthAdapter"
import { LoginUser } from "../application/LoginUser"

const adapter = new FirebaseAuthAdapter()
const loginUser = new LoginUser(adapter)

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Credenciales inválidas. Verificá tu email y contraseña.",
  "auth/user-not-found": "No existe una cuenta con ese email.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/too-many-requests": "Demasiados intentos fallidos. Intentá más tarde.",
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code
    return ERROR_MESSAGES[code] ?? "Ocurrió un error al iniciar sesión."
  }
  return "Ocurrió un error al iniciar sesión."
}

export default function AuthUI() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await loginUser.execute(email, password)
      navigate(user.role === "student" ? "/student" : "/teacher", { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Iniciar sesión</h1>
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
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  )
}
