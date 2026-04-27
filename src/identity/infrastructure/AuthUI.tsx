import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { FirebaseAuthAdapter } from "./FirebaseAuthAdapter"
import { LoginUser } from "../application/LoginUser"
import { loginSchema, registerSchema } from "../domain/loginSchema"
import styles from "./AuthUI.module.css"

const adapter = new FirebaseAuthAdapter()
const loginUser = new LoginUser(adapter)

const SPRING = { stiffness: 120, damping: 20, mass: 0.6 }

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Credenciales inválidas. Verificá tu email y contraseña.",
  "auth/user-not-found": "No existe una cuenta con ese email.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/too-many-requests": "Demasiados intentos fallidos. Intentá más tarde.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese email.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/user-doc-missing": "Tu cuenta existe pero falta el perfil. Contactá al administrador.",
  "auth/user-doc-invalid": "Tu cuenta existe pero el perfil está incompleto. Contactá al administrador.",
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code
    return ERROR_MESSAGES[code] ?? "Ocurrió un error. Intentá de nuevo."
  }
  return "Ocurrió un error. Intentá de nuevo."
}

type FieldErrors = { email?: string; password?: string; displayName?: string }

export default function AuthUI() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Parallax mouse tracking
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const backX = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), SPRING)
  const backY = useSpring(useTransform(mouseY, [0, 1], [-9, 9]), SPRING)
  const midX = useSpring(useTransform(mouseX, [0, 1], [-24, 24]), SPRING)
  const midY = useSpring(useTransform(mouseY, [0, 1], [-14, 14]), SPRING)
  const frontX = useSpring(useTransform(mouseX, [0, 1], [-42, 42]), SPRING)
  const frontY = useSpring(useTransform(mouseY, [0, 1], [-24, 24]), SPRING)

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)))
    mouseY.set(Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)))
  }

  function handlePointerLeave() {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const schema = mode === "login" ? loginSchema : registerSchema
    const result = schema.safeParse({ email, password, displayName })
    if (!result.success) {
      const errs: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors
        if (!errs[field]) errs[field] = issue.message
      }
      setFieldErrors(errs)
      return
    }

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

  function switchMode() {
    setMode(mode === "login" ? "register" : "login")
    setError(null)
    setFieldErrors({})
  }

  return (
    <div className={styles.root}>
      <div
        className={styles.stage}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* Parallax layers — desktop only via CSS */}
        <motion.div className={styles.layerFrame} style={{ x: backX, y: backY }}>
          <img src="/login/parallax-layer-back.png" alt="" className={styles.layerImgBack} />
        </motion.div>
        <motion.div className={styles.layerFrame} style={{ x: midX, y: midY }}>
          <img src="/login/parallax-layer-mid.png" alt="" className={styles.layerImg} />
        </motion.div>
        <motion.div className={styles.layerFrame} style={{ x: frontX, y: frontY }}>
          <img src="/login/parallax-layer-front.png" alt="" className={styles.layerImg} />
        </motion.div>

        <div className={styles.overlay} />

        <div className={styles.content}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Paradigma De Programación</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={styles.card}
          >
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </h2>
              {mode === "register" && (
                <p className={styles.cardHint}>Registro habilitado solo para administradores</p>
              )}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {mode === "register" && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="displayName">Nombre</label>
                  <input
                    id="displayName"
                    className={`${styles.input}${fieldErrors.displayName ? " " + styles.inputError : ""}`}
                    type="text" value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Tu nombre completo" disabled={loading}
                  />
                  {fieldErrors.displayName && (
                    <span className={styles.fieldError}>{fieldErrors.displayName}</span>
                  )}
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  className={`${styles.input}${fieldErrors.email ? " " + styles.inputError : ""}`}
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com" disabled={loading}
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <span className={styles.fieldError}>{fieldErrors.email}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  className={`${styles.input}${fieldErrors.password ? " " + styles.inputError : ""}`}
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" disabled={loading}
                  autoComplete="current-password"
                />
                {fieldErrors.password && (
                  <span className={styles.fieldError}>{fieldErrors.password}</span>
                )}
              </div>

              {mode === "register" && <hr className={styles.divider} />}

              {error && (
                <div className={styles.error} role="alert">
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? "Cargando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
              </button>
            </form>

            <div className={styles.toggle}>
              {mode === "login" ? "Modo administrador" : "Volver al ingreso"}{" "}
              <button
                type="button" className={styles.toggleBtn}
                onClick={switchMode} disabled={loading}
              >
                {mode === "login" ? "Registrar profesor" : "Iniciar sesión"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
