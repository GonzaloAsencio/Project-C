import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "./AuthContext"
import type { Role } from "../identity"

interface RouteGuardProps {
  requiredRole: Role
  children: ReactNode
}

export function RouteGuard({ requiredRole, children }: RouteGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== requiredRole) {
    const redirect = user.role === "student" ? "/student" : "/teacher"
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}
