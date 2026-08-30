import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'cliniccare_theme'

/** 'system' follows the OS; 'light' and 'dark' are explicit overrides. */
export const THEME_OPTIONS = ['light', 'dark', 'system']

function readStoredTheme() {
  // Light is the default for anyone without a saved choice; the OS preference
  // is only honoured when a user explicitly selects 'system'.
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return THEME_OPTIONS.includes(stored) ? stored : 'light'
  } catch {
    return 'light'
  }
}

function prefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Toggle the class Tailwind's `darkMode: 'class'` strategy looks for. */
function applyTheme(isDark) {
  document.documentElement.classList.toggle('dark', isDark)
}

export function ThemeProvider({ children }) {
  // The inline script in index.html has already set the class to avoid a flash;
  // this state mirrors that decision for React.
  const [theme, setThemeState] = useState(readStoredTheme)
  const [systemDark, setSystemDark] = useState(prefersDark)

  // Track the OS setting so 'system' stays live rather than snapshotting once.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setSystemDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const isDark = theme === 'dark' || (theme === 'system' && systemDark)

  useEffect(() => {
    applyTheme(isDark)
  }, [isDark])

  const setTheme = useCallback((next) => {
    if (!THEME_OPTIONS.includes(next)) return
    setThemeState(next)
    try {
      // 'system' is the default, so store it as an absence of preference.
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable — the theme still applies for this session */
    }
  }, [])

  /** Flip to the opposite of what is currently on screen. */
  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark')
  }, [isDark, setTheme])

  const value = useMemo(
    () => ({ theme, isDark, setTheme, toggleTheme }),
    [theme, isDark, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

export default ThemeContext
