import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import specialtyService from '../services/specialtyService'

const AppContext = createContext(null)

let toastSeq = 0

export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  // Specialties are needed by the header, home page, filters and booking flow.
  // Fetch once and share, instead of refetching in every consumer.
  const [specialties, setSpecialties] = useState([])
  const [specialtiesLoading, setSpecialtiesLoading] = useState(true)
  const [specialtiesError, setSpecialtiesError] = useState(null)

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const pushToast = useCallback(
    (message, type = 'info', duration = 4500) => {
      toastSeq += 1
      const id = toastSeq
      setToasts((prev) => [...prev, { id, message, type }])
      const timer = setTimeout(() => dismissToast(id), duration)
      timers.current.set(id, timer)
      return id
    },
    [dismissToast],
  )

  const toast = useMemo(
    () => ({
      success: (m, d) => pushToast(m, 'success', d),
      error: (m, d) => pushToast(m, 'error', d ?? 6000),
      info: (m, d) => pushToast(m, 'info', d),
      warning: (m, d) => pushToast(m, 'warning', d),
    }),
    [pushToast],
  )

  const loadSpecialties = useCallback(async () => {
    setSpecialtiesLoading(true)
    setSpecialtiesError(null)
    try {
      const data = await specialtyService.list()
      setSpecialties(data.specialties || [])
    } catch {
      // The API may be offline — pages fall back to their own empty states.
      setSpecialtiesError('Unable to load specialties.')
      setSpecialties([])
    } finally {
      setSpecialtiesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSpecialties()
  }, [loadSpecialties])

  // Clear any pending toast timers on unmount.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((t) => clearTimeout(t))
      pending.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      toasts,
      toast,
      dismissToast,
      specialties,
      specialtiesLoading,
      specialtiesError,
      reloadSpecialties: loadSpecialties,
    }),
    [toasts, toast, dismissToast, specialties, specialtiesLoading, specialtiesError, loadSpecialties],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}

export function useToast() {
  return useApp().toast
}

export default AppContext
