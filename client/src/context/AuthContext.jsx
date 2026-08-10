import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import authService from '../services/authService'
import { tokenStore } from '../services/api'
import { ROLES } from '../utils/constants'
import { getErrorMessage } from '../utils/helpers'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // `initializing` covers the first token->session check so guards don't
  // redirect a logged-in user to /login during the initial page load.
  const [initializing, setInitializing] = useState(true)
  const [loading, setLoading] = useState(false)

  const clearSession = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Restore the session from a stored token on first mount.
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!tokenStore.get()) {
        if (!cancelled) setInitializing(false)
        return
      }
      try {
        const data = await authService.me()
        if (!cancelled) setUser(data.user)
      } catch {
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [clearSession])

  // The api layer emits this when any request comes back 401.
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('cliniccare:unauthorized', onUnauthorized)
    return () => window.removeEventListener('cliniccare:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (credentials) => {
    setLoading(true)
    try {
      const data = await authService.login(credentials)
      tokenStore.set(data.token)
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: getErrorMessage(error, 'Unable to sign in.') }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const data = await authService.register(payload)
      tokenStore.set(data.token)
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: getErrorMessage(error, 'Unable to create your account.') }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      /* server-side logout is best-effort; the local session is cleared regardless */
    }
    clearSession()
  }, [clearSession])

  /** Merge updated fields into the cached user (after a profile save). */
  const applyUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      role: user?.role ?? null,
      isPatient: user?.role === ROLES.PATIENT,
      isDoctor: user?.role === ROLES.DOCTOR,
      isAdmin: user?.role === ROLES.ADMIN,
      initializing,
      loading,
      login,
      register,
      logout,
      applyUser,
    }),
    [user, initializing, loading, login, register, logout, applyUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export default AuthContext
