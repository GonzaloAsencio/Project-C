import { useNavigate } from "react-router-dom"
import { FirebaseAuthAdapter } from "../identity/infrastructure/FirebaseAuthAdapter"

const adapter = new FirebaseAuthAdapter()

export function useLogout() {
  const navigate = useNavigate()
  return async function logout() {
    await adapter.signOut()
    navigate("/login", { replace: true })
  }
}
