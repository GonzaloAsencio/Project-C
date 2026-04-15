import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { FirebaseAuthAdapter } from "../identity/infrastructure/FirebaseAuthAdapter"
import type { User } from "../identity"

interface AuthContextValue {
  user: User | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
})

const adapter = new FirebaseAuthAdapter()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = adapter.onAuthStateChanged((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
