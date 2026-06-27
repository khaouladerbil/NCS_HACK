import { useCallback, useEffect, useState } from "react"
import { clearTokens, getAccessToken, getMe, login as apiLogin, register as apiRegister } from "@/lib/backend"

type User = { id: number; username: string; email: string }

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false)
      return
    }
    getMe()
      .then((me) => setUser(me))
      .finally(() => setLoading(false))

    const onLogout = () => setUser(null)
    window.addEventListener("auth:logout", onLogout)
    return () => window.removeEventListener("auth:logout", onLogout)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password)
    const me = await getMe()
    setUser(me)
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    await apiRegister(username, email, password)
    await apiLogin(email, password)
    const me = await getMe()
    setUser(me)
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  return { user, loading, login, register, logout, isAuthenticated: !!user }
}
